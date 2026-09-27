import { useEffect, useState } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { EventForm } from '@/components/admin/EventForm'
import { SubmissionsPage } from '@/pages/SubmissionsPage'
import { PageShell } from '@/components/layout/PageShell'
import { SITE } from '@/config/site'
import {
  createEvent,
  listAllEvents,
  setEventActive,
  signOut,
  updateEvent,
} from '@/services/adminService'
import { exportDonations, exportVolunteers } from '@/services/reportService'
import { toUserMessage } from '@/lib/errors'
import type { AdminEvent, EventFormValues } from '@/types/event'
import type { SubmissionKind } from '@/types/submissions'

type Editing =
  | { mode: 'new' }
  | { mode: 'edit'; event: AdminEvent; section: 'event' | 'volunteer' }
  | null

interface DashboardPageProps {
  email: string | null
}

export function DashboardPage({ email }: DashboardPageProps) {
  const [events, setEvents] = useState<AdminEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Editing>(null)
  const [viewing, setViewing] = useState<{ event: AdminEvent; kind: SubmissionKind } | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [exporting, setExporting] = useState<'donations' | 'volunteers' | null>(
    null,
  )
  const [reportNote, setReportNote] = useState<string | null>(null)

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      setEvents(await listAllEvents())
    } catch (err) {
      setError(toUserMessage(err, 'Could not load events.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  async function handleSubmit(values: EventFormValues) {
    if (editing?.mode === 'edit') {
      await updateEvent(editing.event.id, values)
    } else {
      await createEvent(values)
    }
    setEditing(null)
    await refresh()
  }

  async function handleExport(kind: 'donations' | 'volunteers') {
    setExporting(kind)
    setReportNote(null)
    setError(null)
    try {
      const count =
        kind === 'donations'
          ? await exportDonations()
          : await exportVolunteers()
      setReportNote(
        count === 0
          ? `No ${kind} submissions yet. An empty file was downloaded.`
          : `Downloaded ${count} ${kind} ${count === 1 ? 'row' : 'rows'}.`,
      )
    } catch (err) {
      setError(toUserMessage(err, `Could not export ${kind}.`))
    } finally {
      setExporting(null)
    }
  }

  async function handleToggle(event: AdminEvent) {
    setBusyId(event.id)
    setError(null)
    try {
      await setEventActive(event.id, !event.is_active)
      await refresh()
    } catch (err) {
      setError(toUserMessage(err, 'Could not update the event.'))
    } finally {
      setBusyId(null)
    }
  }

  if (viewing) {
    return (
      <SubmissionsPage
        event={viewing.event}
        kind={viewing.kind}
        email={email}
        onBack={() => setViewing(null)}
      />
    )
  }

  if (editing) {
    return (
      <PageShell email={email} onSignOut={() => void signOut()} wide>
        <EventForm
          event={editing.mode === 'edit' ? editing.event : null}
          section={editing.mode === 'edit' ? editing.section : 'event'}
          onSubmit={handleSubmit}
          onCancel={() => setEditing(null)}
        />
      </PageShell>
    )
  }

  return (
    <PageShell email={email} onSignOut={() => void signOut()} wide>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-vog-brown">Events</h1>
          <p className="mt-1 text-sm text-vog-brown/70">
            Create campaigns and turn them on or off. Active events show on the
            donate and volunteer sites.
          </p>
        </div>
        <Button
          className="w-auto px-5"
          onClick={() => setEditing({ mode: 'new' })}
        >
          + New event
        </Button>
      </div>

      <section className="mt-6 rounded-2xl border border-vog-brown/10 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-vog-brown">Reports</h2>
            <p className="text-sm text-vog-brown/70">
              Download submissions as a spreadsheet (CSV, opens in Excel).
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleExport('donations')}
              disabled={exporting !== null}
              className="rounded-lg bg-vog-green px-4 py-2 text-sm font-semibold text-white transition hover:bg-vog-pattern disabled:opacity-60"
            >
              {exporting === 'donations' ? 'Preparing…' : 'Export donations'}
            </button>
            <button
              type="button"
              onClick={() => void handleExport('volunteers')}
              disabled={exporting !== null}
              className="rounded-lg bg-vog-green px-4 py-2 text-sm font-semibold text-white transition hover:bg-vog-pattern disabled:opacity-60"
            >
              {exporting === 'volunteers' ? 'Preparing…' : 'Export volunteers'}
            </button>
          </div>
        </div>
        {reportNote ? (
          <p className="mt-3 text-sm text-vog-brown/75">{reportNote}</p>
        ) : null}
      </section>

      {error ? (
        <div className="mt-4">
          <Alert tone="error">{error}</Alert>
        </div>
      ) : null}

      <div className="mt-6">
        {loading ? (
          <div className="space-y-3" aria-busy="true">
            <div className="h-20 animate-pulse rounded-2xl bg-white" />
            <div className="h-20 animate-pulse rounded-2xl bg-white" />
            <div className="h-20 animate-pulse rounded-2xl bg-white" />
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-3xl border border-vog-brown/10 bg-white p-8 text-center">
            <p className="text-vog-brown/75">
              No events yet. Create your first one.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {events.map((event) => (
              <li
                key={event.id}
                className="rounded-2xl border border-vog-brown/10 bg-white p-4 shadow-sm sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate text-lg font-semibold text-vog-brown">
                        {event.name}
                      </h2>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                          event.is_active
                            ? 'bg-vog-green/15 text-vog-pattern'
                            : 'bg-vog-brown/10 text-vog-brown/60'
                        }`}
                      >
                        {event.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-xs text-vog-brown/60">
                      /{event.slug}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                      <a
                        className="text-vog-green underline"
                        href={`${SITE.donateUrl}/${event.slug}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open on donate ↗
                      </a>
                      <a
                        className="text-vog-green underline"
                        href={`${SITE.volunteerUrl}/${event.slug}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open on volunteer ↗
                      </a>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setViewing({ event, kind: 'donations' })}
                        className="rounded-lg bg-vog-cream px-3 py-1.5 text-xs font-semibold text-vog-brown transition hover:bg-vog-green/15 hover:text-vog-pattern"
                      >
                        See donation details
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewing({ event, kind: 'volunteers' })}
                        className="rounded-lg bg-vog-cream px-3 py-1.5 text-xs font-semibold text-vog-brown transition hover:bg-vog-green/15 hover:text-vog-pattern"
                      >
                        See volunteer details
                      </button>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setEditing({ mode: 'edit', event, section: 'event' })
                      }
                      className="rounded-lg border border-vog-brown/20 px-3 py-1.5 text-sm font-medium text-vog-brown transition hover:border-vog-green hover:text-vog-pattern"
                    >
                      Edit event details
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setEditing({
                          mode: 'edit',
                          event,
                          section: 'volunteer',
                        })
                      }
                      className="rounded-lg border border-vog-brown/20 px-3 py-1.5 text-sm font-medium text-vog-brown transition hover:border-vog-green hover:text-vog-pattern"
                    >
                      Edit volunteer details
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleToggle(event)}
                      disabled={busyId === event.id}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium text-white transition disabled:opacity-60 ${
                        event.is_active
                          ? 'bg-vog-brown/70 hover:bg-vog-brown'
                          : 'bg-vog-green hover:bg-vog-pattern'
                      }`}
                    >
                      {busyId === event.id
                        ? '…'
                        : event.is_active
                          ? 'Deactivate'
                          : 'Activate'}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageShell>
  )
}
