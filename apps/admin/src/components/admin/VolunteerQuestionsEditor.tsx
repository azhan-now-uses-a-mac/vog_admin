import type { QuestionType, VolunteerQuestion } from '@/types/event'

interface Props {
  questions: VolunteerQuestion[]
  onChange: (questions: VolunteerQuestion[]) => void
}

const TYPE_LABELS: Record<QuestionType, string> = {
  text: 'Short answer',
  yes_no: 'Yes / No',
  choice: 'Pick one option',
}

// Ids must match the API's /^[a-z0-9_-]{1,40}$/ check.
const newId = () => `q_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

const inputClass =
  'input-control h-10 text-sm'

// Lets the admin add extra questions to the volunteer application form.
export function VolunteerQuestionsEditor({ questions, onChange }: Props) {
  function update(index: number, patch: Partial<VolunteerQuestion>) {
    onChange(questions.map((q, i) => (i === index ? { ...q, ...patch } : q)))
  }
  function remove(index: number) {
    onChange(questions.filter((_, i) => i !== index))
  }
  function move(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= questions.length) return
    const next = [...questions]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }
  function add() {
    if (questions.length >= 20) return
    onChange([...questions, { id: newId(), label: '', type: 'text', required: false, options: [] }])
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-vog-brown">Extra questions on the application form</p>
        <p className="text-xs text-vog-brown/60">
          Optional. These appear after the standard questions. Answers show in "See volunteer details".
        </p>
      </div>

      {questions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-vog-brown/20 p-3 text-center text-xs text-vog-brown/60">
          No extra questions yet.
        </p>
      ) : null}

      <ol className="space-y-3">
        {questions.map((q, i) => (
          <li key={q.id} className="rounded-xl border border-vog-brown/15 bg-white p-3">
            <div className="flex items-start gap-2">
              <span className="mt-2 w-5 shrink-0 text-xs font-semibold text-vog-brown/50">{i + 1}.</span>
              <div className="min-w-0 flex-1 space-y-2">
                <input
                  className={inputClass}
                  value={q.label}
                  onChange={(e) => update(i, { label: e.target.value })}
                  placeholder="Question, e.g. Do you have first-aid training?"
                  maxLength={160}
                  aria-label={`Question ${i + 1}`}
                />
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    className={`${inputClass} w-auto pr-8`}
                    value={q.type}
                    onChange={(e) => {
                      const type = e.target.value as QuestionType
                      update(i, { type, options: type === 'choice' ? q.options : [] })
                    }}
                    aria-label="Answer type"
                  >
                    {(Object.keys(TYPE_LABELS) as QuestionType[]).map((t) => (
                      <option key={t} value={t}>
                        {TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 text-sm text-vog-brown">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-vog-green"
                      checked={q.required}
                      onChange={(e) => update(i, { required: e.target.checked })}
                    />
                    Required
                  </label>
                </div>
                {q.type === 'choice' ? (
                  <input
                    className={inputClass}
                    value={q.options.join(', ')}
                    onChange={(e) =>
                      update(i, {
                        options: e.target.value.split(',').map((o) => o.trim()).filter(Boolean).slice(0, 20),
                      })
                    }
                    placeholder="Options, separated by commas — e.g. Morning, Afternoon, Either"
                    aria-label="Options"
                  />
                ) : null}
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded px-2 text-xs text-vog-brown/60 hover:text-vog-brown disabled:opacity-30" aria-label="Move up">▲</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === questions.length - 1} className="rounded px-2 text-xs text-vog-brown/60 hover:text-vog-brown disabled:opacity-30" aria-label="Move down">▼</button>
                <button type="button" onClick={() => remove(i)} className="rounded px-2 text-xs text-amber-800 hover:underline" aria-label="Remove question">✕</button>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <button
        type="button"
        onClick={add}
        disabled={questions.length >= 20}
        className="rounded-lg border border-vog-green px-3 py-1.5 text-sm font-semibold text-vog-pattern transition hover:bg-vog-green/10 disabled:opacity-50"
      >
        + Add question
      </button>
    </div>
  )
}
