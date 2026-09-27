import type { OptionalStandardField } from '@/types/event'

interface Props {
  hidden: OptionalStandardField[]
  onChange: (hidden: OptionalStandardField[]) => void
}

// What the application form always asks, in the order it appears.
const ALWAYS = ['Full name', 'Email', 'Phone number']
const OPTIONAL: { key: OptionalStandardField; label: string; note?: string }[] = [
  { key: 'university', label: 'University' },
  { key: 'course', label: 'Course' },
  { key: 'year_of_study', label: 'Year of study', note: 'Year 1 – 5+, Postgraduate, Not a student' },
  { key: 'area_of_residence', label: 'Area of residence' },
  { key: 'driving', label: 'Driving licence & car', note: 'Asks about a valid international licence; the car question only shows after a Yes' },
]
const AFTER = [
  'Message (optional)',
  'Commitment tick: "I understand that if I am selected, I will attend the event and follow the organisers\' instructions to the best of my ability."',
]

function Row({ label, note, checked, onToggle, locked }: { label: string; note?: string; checked: boolean; onToggle?: () => void; locked?: boolean }) {
  return (
    <li className="flex items-start justify-between gap-3 px-3 py-2">
      <div className="min-w-0">
        <p className={`text-sm ${checked ? 'text-vog-brown' : 'text-vog-brown/50 line-through'}`}>{label}</p>
        {note ? <p className="text-xs text-vog-brown/55">{note}</p> : null}
      </div>
      {locked ? (
        <span className="shrink-0 rounded-full bg-vog-brown/10 px-2 py-0.5 text-[11px] font-medium text-vog-brown/60">Always asked</span>
      ) : (
        <label className="flex shrink-0 cursor-pointer items-center gap-2 text-xs text-vog-brown/70">
          <input type="checkbox" className="h-4 w-4 accent-vog-green" checked={checked} onChange={onToggle} />
          Ask
        </label>
      )}
    </li>
  )
}

// Shows the standard application questions and lets the admin switch the
// optional ones off for this event.
export function StandardQuestions({ hidden, onChange }: Props) {
  const toggle = (key: OptionalStandardField) =>
    onChange(hidden.includes(key) ? hidden.filter((h) => h !== key) : [...hidden, key])

  return (
    <div>
      <p className="text-sm font-medium text-vog-brown">Standard questions on the application form</p>
      <p className="text-xs text-vog-brown/60">
        Untick a question to hide it for this event, e.g. University and Course for a non-student event.
      </p>
      <ol className="mt-2 divide-y divide-vog-brown/10 rounded-xl border border-vog-brown/15 bg-white">
        {ALWAYS.map((label) => (
          <Row key={label} label={label} checked locked />
        ))}
        {OPTIONAL.map((q) => (
          <Row key={q.key} label={q.label} note={q.note} checked={!hidden.includes(q.key)} onToggle={() => toggle(q.key)} />
        ))}
        {AFTER.map((label) => (
          <Row key={label} label={label} checked locked />
        ))}
      </ol>
    </div>
  )
}
