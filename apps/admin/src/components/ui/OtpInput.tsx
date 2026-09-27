import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react'

interface OtpInputProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  length?: number
  disabled?: boolean
  error?: string
}

// One box per digit: typing moves forward, Backspace moves back, and pasting
// or phone autofill ("one-time-code") fills every box at once.
export function OtpInput({
  id,
  label,
  value,
  onChange,
  length = 6,
  disabled,
  error,
}: OtpInputProps) {
  const inputs = useRef<Array<HTMLInputElement | null>>([])
  // Empty boxes are stored as spaces so every digit keeps its position.
  const digits = Array.from({ length }, (_, i) => (/\d/.test(value[i] ?? '') ? value[i] : ''))

  function emit(next: string[]) {
    onChange(next.map((d) => d || ' ').join('').trimEnd())
  }

  function focus(index: number) {
    const target = inputs.current[Math.max(0, Math.min(length - 1, index))]
    target?.focus()
    target?.select()
  }

  // Writes digits starting at `start`, e.g. a single keypress or a full paste.
  function fill(start: number, incoming: string) {
    const clean = incoming.replace(/\D/g, '')
    if (!clean) return
    const next = digits.slice()
    for (let i = 0; i < clean.length && start + i < length; i++) {
      next[start + i] = clean[i]
    }
    emit(next)
    focus(Math.min(start + clean.length, length - 1))
  }

  function handleChange(index: number, raw: string) {
    // Autofill and some keyboards put the whole code into one box.
    if (raw.replace(/\D/g, '').length > 1) {
      fill(0, raw)
      return
    }
    const digit = raw.replace(/\D/g, '').slice(-1)
    if (!digit) return
    fill(index, digit)
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace') {
      event.preventDefault()
      const next = digits.slice()
      if (next[index]) {
        next[index] = ''
        emit(next)
      } else if (index > 0) {
        next[index - 1] = ''
        emit(next)
        focus(index - 1)
      }
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      focus(index - 1)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      focus(index + 1)
    }
  }

  function handlePaste(index: number, event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault()
    const pasted = event.clipboardData.getData('text')
    // A full-length paste always starts at the first box.
    fill(pasted.replace(/\D/g, '').length >= length ? 0 : index, pasted)
  }

  return (
    <fieldset className="w-full">
      <legend id={`${id}-label`} className="mb-1.5 block text-sm font-medium text-vog-brown">
        {label}
      </legend>
      <div className="flex gap-2 sm:gap-3" role="group" aria-labelledby={`${id}-label`}>
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputs.current[index] = el
            }}
            id={index === 0 ? id : `${id}-${index}`}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            maxLength={index === 0 ? length : 1}
            aria-label={`Digit ${index + 1} of ${length}`}
            aria-invalid={Boolean(error)}
            disabled={disabled}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={(e) => handlePaste(index, e)}
            onFocus={(e) => e.target.select()}
            className="input-control h-14 w-0 flex-1 px-0 text-center text-2xl font-semibold tabular-nums"
          />
        ))}
      </div>
      {error ? (
        <p role="alert" className="mt-1.5 text-sm text-amber-800">
          {error}
        </p>
      ) : null}
    </fieldset>
  )
}
