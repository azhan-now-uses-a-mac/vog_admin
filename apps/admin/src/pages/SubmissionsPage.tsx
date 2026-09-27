import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Alert } from '@/components/ui/Alert'
import { PageShell } from '@/components/layout/PageShell'
import { toUserMessage } from '@/lib/errors'
import { classNames, formatAmount } from '@/lib/format'
import { signOut } from '@/services/adminService'
import {
  exportEventDonations,
  exportEventVolunteers,
  listEventDonations,
  listEventVolunteers,
  paymentMethodLabel,
} from '@/services/submissionsService'
import type { AdminEvent } from '@/types/event'
import type { EventDonation, EventVolunteer, SubmissionKind } from '@/types/submissions'

interface SubmissionsPageProps {
  event: AdminEvent
  kind: SubmissionKind
  email: string | null
  onBack: () => void
}

// One definition drives both the desktop table and the mobile cards.
interface Column<T> {
  key: string
  label: string
  render: (row: T) => ReactNode
  // Free-text search looks at these.
  searchable?: (row: T) => string
  wide?: boolean
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })

function YesNo({ value }: { value: boolean }) {
  return (
    <span
      className={classNames(
        'inline-block rounded-full px-2 py-0.5 text-xs font-medium',
        value ? 'bg-vog-green/15 text-vog-pattern' : 'bg-vog-brown/10 text-vog-brown/60',
      )}
    >
      {value ? 'Yes' : 'No'}
    </span>
  )
}

function Message({ text }: { text: string | null }) {
  if (!text) return <span className="text-vog-brown/40">—</span>
  return <span className="whitespace-pre-line">{text}</span>
}

const DONATION_COLUMNS: Column<EventDonation>[] = [
  { key: 'created_at', label: 'Submitted', render: (r) => formatDate(r.created_at) },
  { key: 'full_name', label: 'Name', render: (r) => <span className="font-medium">{r.full_name}</span>, searchable: (r) => r.full_name },
  {
    key: 'contact',
    label: 'Contact',
    render: (r) => (
      <span className="block">
        <a className="underline" href={`mailto:${r.email}`}>{r.email}</a>
        <br />
        <a className="underline" href={`tel:${r.phone}`}>{r.phone}</a>
      </span>
    ),
    searchable: (r) => `${r.email} ${r.phone}`,
  },
  { key: 'amount', label: 'Amount', render: (r) => <span className="font-semibold">{formatAmount(Number(r.amount), r.currency)}</span>, searchable: (r) => r.currency },
  { key: 'payment_method', label: 'Method', render: (r) => paymentMethodLabel(r.payment_method) },
  { key: 'message', label: 'Message', render: (r) => <Message text={r.message} />, searchable: (r) => r.message ?? '', wide: true },
  {
    key: 'proof',
    label: 'Proof',
    render: (r) => (
      <a className="font-medium text-vog-green underline" href={r.proof_url} target="_blank" rel="noreferrer">
        View ↗
      </a>
    ),
  },
]

const VOLUNTEER_COLUMNS: Column<EventVolunteer>[] = [
  { key: 'created_at', label: 'Submitted', render: (r) => formatDate(r.created_at) },
  { key: 'full_name', label: 'Name', render: (r) => <span className="font-medium">{r.full_name}</span>, searchable: (r) => r.full_name },
  {
    key: 'contact',
    label: 'Contact',
    render: (r) => (
      <span className="block">
        <a className="underline" href={`mailto:${r.email}`}>{r.email}</a>
        <br />
        <a className="underline" href={`tel:${r.phone}`}>{r.phone}</a>
      </span>
    ),
    searchable: (r) => `${r.email} ${r.phone}`,
  },
  {
    key: 'study',
    label: 'University / course',
    render: (r) => (
      <span className="block">
        {r.university}
        <br />
        <span className="text-vog-brown/70">{r.course} · {r.year_of_study}</span>
      </span>
    ),
    searchable: (r) => `${r.university} ${r.course} ${r.year_of_study}`,
  },
  { key: 'area_of_residence', label: 'Area', render: (r) => r.area_of_residence, searchable: (r) => r.area_of_residence },
  { key: 'has_license', label: 'Licence', render: (r) => <YesNo value={r.has_license} /> },
  { key: 'has_car', label: 'Car', render: (r) => <YesNo value={r.has_car} /> },
  { key: 'commitment_agreed', label: 'Committed', render: (r) => <YesNo value={r.commitment_agreed} /> },
  { key: 'message', label: 'Message', render: (r) => <Message text={r.message} />, searchable: (r) => r.message ?? '', wide: true },
]

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl border border-vog-brown/10 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-vog-brown/60">{label}</p>
      <p className="mt-1 text-xl font-semibold text-vog-brown">{value}</p>
    </div>
  )
}

function DataView<T extends { id: string }>({ columns, rows }: { columns: Column<T>[]; rows: T[] }) {
  return (
    <>
      {/* Desktop: table */}
      <div className="hidden overflow-x-auto rounded-2xl border border-vog-brown/10 bg-white shadow-sm md:block">
        <table className="w-full text-left text-sm text-vog-brown">
          <thead className="bg-vog-cream/60 text-xs uppercase tracking-wide text-vog-brown/70">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={classNames('px-4 py-3 font-semibold', c.wide && 'min-w-56')}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-vog-brown/10 align-top">
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3">
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: one card per submission */}
      <ul className="space-y-3 md:hidden">
        {rows.map((row) => (
          <li key={row.id} className="rounded-2xl border border-vog-brown/10 bg-white p-4 shadow-sm">
            <dl className="grid grid-cols-[minmax(0,7rem)_1fr] gap-x-3 gap-y-2 text-sm text-vog-brown">
              {columns.map((c) => (
                <div key={c.key} className="contents">
                  <dt className="text-vog-brown/60">{c.label}</dt>
                  <dd className="min-w-0 break-words">{c.render(row)}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </>
  )
}

export function SubmissionsPage({ event, kind, email, onBack }: SubmissionsPageProps) {
  const [donations, setDonations] = useState<EventDonation[]>([])
  const [volunteers, setVolunteers] = useState<EventVolunteer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    const load =
      kind === 'donations'
        ? listEventDonations(event.id).then((rows) => !cancelled && setDonations(rows))
        : listEventVolunteers(event.id).then((rows) => !cancelled && setVolunteers(rows))
    load
      .catch((err) => !cancelled && setError(toUserMessage(err, 'Could not load submissions.')))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [event.id, kind])

  const title = kind === 'donations' ? 'Donations' : 'Volunteer applications'
  const columns = (kind === 'donations' ? DONATION_COLUMNS : VOLUNTEER_COLUMNS) as Column<{ id: string }>[]
  const allRows: Array<{ id: string }> = kind === 'donations' ? donations : volunteers

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return allRows
    return allRows.filter((row) =>
      columns.some((c) => c.searchable?.(row).toLowerCase().includes(q)),
    )
  }, [allRows, columns, query])

  const stats = useMemo(() => {
    if (kind === 'donations') {
      const totals = new Map<string, number>()
      for (const d of donations) totals.set(d.currency, (totals.get(d.currency) ?? 0) + Number(d.amount))
      const totalText =
        totals.size === 0
          ? '—'
          : [...totals.entries()].map(([cur, sum]) => formatAmount(sum, cur)).join(' + ')
      return [
        { label: 'Donations', value: donations.length },
        { label: 'Total submitted', value: totalText },
        { label: 'Latest', value: donations[0] ? formatDate(donations[0].created_at) : '—' },
      ]
    }
    return [
      { label: 'Applications', value: volunteers.length },
      { label: 'With licence', value: volunteers.filter((v) => v.has_license).length },
      { label: 'With car', value: volunteers.filter((v) => v.has_car).length },
    ]
  }, [kind, donations, volunteers])

  function handleExport() {
    if (kind === 'donations') exportEventDonations(event, donations)
    else exportEventVolunteers(event, volunteers)
  }

  return (
    <PageShell email={email} onSignOut={() => void signOut()} wide>
      <button
        type="button"
        onClick={onBack}
        className="text-sm font-medium text-vog-green underline hover:text-vog-pattern"
      >
        ← Back to events
      </button>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-vog-green">{title}</p>
          <h1 className="mt-1 truncate text-2xl font-semibold text-vog-brown">{event.name}</h1>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={loading || allRows.length === 0}
          className="rounded-lg bg-vog-green px-4 py-2 text-sm font-semibold text-white transition hover:bg-vog-pattern disabled:opacity-60"
        >
          Export CSV
        </button>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <Stat key={s.label} label={s.label} value={s.value} />
        ))}
      </div>

      {error ? (
        <div className="mt-4">
          <Alert tone="error">{error}</Alert>
        </div>
      ) : null}

      <div className="mt-6">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={kind === 'donations' ? 'Search by name, email, phone, or message' : 'Search by name, email, university, or area'}
          className="input-control"
          aria-label="Search submissions"
        />
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="space-y-3" aria-busy="true">
            <div className="h-16 animate-pulse rounded-2xl bg-white" />
            <div className="h-16 animate-pulse rounded-2xl bg-white" />
          </div>
        ) : allRows.length === 0 ? (
          <div className="rounded-3xl border border-vog-brown/10 bg-white p-8 text-center">
            <p className="text-vog-brown/75">
              {kind === 'donations' ? 'No donations for this event yet.' : 'No volunteer applications for this event yet.'}
            </p>
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-3xl border border-vog-brown/10 bg-white p-8 text-center">
            <p className="text-vog-brown/75">Nothing matches your search.</p>
          </div>
        ) : (
          <>
            <p className="mb-2 text-xs text-vog-brown/60">
              Showing {rows.length} of {allRows.length}
            </p>
            <DataView columns={columns} rows={rows} />
          </>
        )}
      </div>
    </PageShell>
  )
}
