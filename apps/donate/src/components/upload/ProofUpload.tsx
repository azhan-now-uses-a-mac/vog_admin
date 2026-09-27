import { useCallback, useId, useRef, useState } from 'react'
import { UPLOAD_CONFIG, formatFileSize } from '@/config/upload'
import { classNames } from '@/lib/format'
import { validateProofFile } from '@/lib/validation'

interface ProofUploadProps {
  file: File | null
  error?: string
  progress?: number | null
  disabled?: boolean
  onFileChange: (file: File | null) => void
}

const ACCEPT = UPLOAD_CONFIG.acceptedExtensions.join(',')

export function ProofUpload({
  file,
  error,
  progress,
  disabled,
  onFileChange,
}: ProofUploadProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const applyFile = useCallback(
    (next: File | null) => {
      onFileChange(next)
    },
    [onFileChange],
  )

  function handleFiles(files: FileList | null) {
    const next = files?.[0] ?? null
    if (!next) return

    if (validateProofFile(next)) return

    applyFile(next)
  }

  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-vog-brown">
        Proof of payment
      </label>
      <div
        className={classNames(
          'rounded-2xl border-2 border-dashed p-5 text-center transition',
          isDragging ? 'border-vog-green bg-vog-cream/80' : 'border-vog-brown/20 bg-white',
          error ? 'border-amber-800/50' : undefined,
        )}
        onDragOver={(event) => {
          event.preventDefault()
          if (!disabled) setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setIsDragging(false)
          if (!disabled) handleFiles(event.dataTransfer.files)
        }}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          className="sr-only"
          accept={ACCEPT}
          disabled={disabled}
          onChange={(event) => handleFiles(event.target.files)}
        />
        {file ? (
          <div className="space-y-2">
            <p className="font-medium text-vog-brown">{file.name}</p>
            <p className="text-sm text-vog-brown/70">{formatFileSize(file.size)}</p>
            {typeof progress === 'number' ? (
              <div
                className="mx-auto h-2 max-w-xs overflow-hidden rounded-full bg-vog-brown/10"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
              >
                <div
                  className="h-full bg-vog-green transition-[width]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            ) : null}
            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                className="text-sm font-semibold text-vog-brown underline"
                onClick={() => inputRef.current?.click()}
                disabled={disabled}
              >
                Replace file
              </button>
              <button
                type="button"
                className="text-sm font-semibold text-amber-800 underline"
                onClick={() => {
                  applyFile(null)
                  if (inputRef.current) inputRef.current.value = ''
                }}
                disabled={disabled}
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="font-medium text-vog-brown">Drop your receipt here, or click to upload</p>
            <p className="mt-1 text-sm text-vog-brown/65">
              JPG, JPEG, PNG, or PDF · up to {formatFileSize(UPLOAD_CONFIG.maxFileSizeBytes)}
            </p>
            <button
              type="button"
              className="mt-4 inline-flex h-12 items-center rounded-xl bg-vog-brown px-5 font-semibold text-white"
              onClick={() => inputRef.current?.click()}
              disabled={disabled}
            >
              Choose file
            </button>
          </div>
        )}
      </div>
      {error ? (
        <p id={`${inputId}-error`} role="alert" className="mt-1.5 text-sm text-amber-800">
          {error}
        </p>
      ) : (
        <p className="mt-1.5 text-sm text-vog-brown/60">
          Proof of payment is required. This website does not process payments.
        </p>
      )}
    </div>
  )
}
