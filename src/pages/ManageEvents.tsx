import { useMemo, useState } from 'react'
import type { WeddingWorkspace } from '../types'

type ManageEventsProps = {
  eventLabel: string
  clientLabel: string
  weddings: WeddingWorkspace[]
  onOpen: (id: string) => void
  onBack: () => void
  onCancel: (id: string) => Promise<string | null>
  onReopen: (id: string) => Promise<string | null>
  onTrash: (id: string) => Promise<string | null>
  onRestore: (id: string) => Promise<string | null>
  onPermanentDelete: (id: string) => Promise<string | null>
}

const DAY_MS = 24 * 60 * 60 * 1000
const RETENTION_DAYS = 30

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function deletionAge(deletedAt: string | undefined) {
  if (!deletedAt) return { daysRemaining: RETENTION_DAYS }
  const age = Math.max(0, Date.now() - new Date(deletedAt).getTime())
  const daysOld = Math.floor(age / DAY_MS)
  return { daysRemaining: Math.max(0, RETENTION_DAYS - daysOld) }
}

export default function ManageEvents({
  clientLabel,
  weddings,
  onOpen,
  onBack,
  onCancel,
  onReopen,
  onTrash,
  onRestore,
  onPermanentDelete,
}: ManageEventsProps) {
  const [tab, setTab] = useState<'active' | 'cancelled' | 'trash'>('active')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const active = useMemo(() => weddings.filter((item) => !item.deletedAt && item.status !== 'Cancelled'), [weddings])
  const cancelled = useMemo(() => weddings.filter((item) => !item.deletedAt && item.status === 'Cancelled'), [weddings])
  const trash = useMemo(() => weddings.filter((item) => Boolean(item.deletedAt)), [weddings])
  const current = tab === 'active' ? active : tab === 'cancelled' ? cancelled : trash

  const run = async (id: string, action: () => Promise<string | null>) => {
    setBusyId(id)
    setError('')
    const result = await action()
    if (result) setError(result)
    setBusyId(null)
  }

  const confirmCancel = (workspace: WeddingWorkspace) => {
    if (!window.confirm(`Cancel ${workspace.profile.couple}? The workspace and all planning history will be kept.`)) return
    void run(workspace.id, () => onCancel(workspace.id))
  }

  const confirmTrash = (workspace: WeddingWorkspace) => {
    if (!window.confirm(`Move ${workspace.profile.couple} to Trash? It will disappear from normal owner tools but remain recoverable for at least 30 days.`)) return
    void run(workspace.id, () => onTrash(workspace.id))
  }

  const confirmPermanentDelete = (workspace: WeddingWorkspace) => {
    const { daysRemaining } = deletionAge(workspace.deletedAt)
    if (daysRemaining > 0) return
    const answer = window.prompt(`Permanently delete ${workspace.profile.couple}? This cannot be undone. Type DELETE to continue.`)
    if (answer !== 'DELETE') return
    void run(workspace.id, () => onPermanentDelete(workspace.id))
  }

  return (
    <main className="page-main shell manage-events-page">
      <section className="page-intro page-intro--split">
        <div>
          <p className="eyebrow">OWNER OPERATIONS</p>
          <h1>Manage Events</h1>
          <p>Cancel, restore or remove event workspaces without putting destructive actions in the everyday planning flow.</p>
        </div>
        <button className="button button--ghost" onClick={onBack}>Back to dashboard</button>
      </section>

      <section className="panel manage-events-panel">
        <div className="manage-events-tabs" role="tablist" aria-label="Event management">
          <button className={tab === 'active' ? 'active' : ''} onClick={() => setTab('active')}>Active <b>{active.length}</b></button>
          <button className={tab === 'cancelled' ? 'active' : ''} onClick={() => setTab('cancelled')}>Cancelled <b>{cancelled.length}</b></button>
          <button className={tab === 'trash' ? 'active' : ''} onClick={() => setTab('trash')}>Trash <b>{trash.length}</b></button>
        </div>

        {error && <div className="owner-access-error" role="alert">{error}</div>}

        {current.length === 0 ? (
          <div className="empty-state">
            <h3>Nothing here.</h3>
            <p>{tab === 'trash' ? 'Deleted event workspaces stay here for at least 30 days before permanent deletion is available.' : `No ${tab} events right now.`}</p>
          </div>
        ) : (
          <div className="manage-events-list">
            {current.slice().sort((a, b) => a.profile.date.localeCompare(b.profile.date)).map((workspace) => {
              const retention = deletionAge(workspace.deletedAt)
              const busy = busyId === workspace.id
              return (
                <article className="manage-event-row" key={workspace.id}>
                  <div className="manage-event-row__main">
                    <span className="mini-label">{tab === 'trash' ? 'DELETED EVENT WORKSPACE' : 'EVENT WORKSPACE'}</span>
                    <h3>{workspace.profile.couple}</h3>
                    <p>{formatDate(workspace.profile.date)} · {workspace.profile.guests} guests · {clientLabel}: {workspace.profile.primaryEmail || 'No email'}</p>
                  </div>

                  {tab === 'active' && <div className="manage-event-row__actions">
                    <button className="button button--ghost button--small" disabled={busy} onClick={() => onOpen(workspace.id)}>Open record</button>
                    <button className="text-link manage-action-warning" disabled={busy} onClick={() => confirmCancel(workspace)}>Cancel event</button>
                    <button className="text-link manage-action-danger" disabled={busy} onClick={() => confirmTrash(workspace)}>Move to Trash</button>
                  </div>}

                  {tab === 'cancelled' && <div className="manage-event-row__actions">
                    <button className="button button--ghost button--small" disabled={busy} onClick={() => onOpen(workspace.id)}>Open record</button>
                    <button className="button button--primary button--small" disabled={busy} onClick={() => void run(workspace.id, () => onReopen(workspace.id))}>Reopen event</button>
                    <button className="text-link manage-action-danger" disabled={busy} onClick={() => confirmTrash(workspace)}>Move to Trash</button>
                  </div>}

                  {tab === 'trash' && <div className="manage-event-row__trash">
                    <div>
                      <strong>{retention.daysRemaining > 0 ? `${retention.daysRemaining} days protected` : 'Retention period complete'}</strong>
                      <small>{workspace.deletedAt ? `Moved to Trash ${new Date(workspace.deletedAt).toLocaleString()}` : ''}</small>
                    </div>
                    <div className="manage-event-row__actions">
                      <button className="button button--primary button--small" disabled={busy} onClick={() => void run(workspace.id, () => onRestore(workspace.id))}>Restore</button>
                      <button className="button button--danger button--small" disabled={busy || retention.daysRemaining > 0} title={retention.daysRemaining > 0 ? 'Permanent deletion unlocks after the 30-day recovery period.' : 'Permanent deletion cannot be undone.'} onClick={() => confirmPermanentDelete(workspace)}>Delete permanently</button>
                    </div>
                  </div>}
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="panel retention-note">
        <strong>30-day recovery protection</strong>
        <p>Moving an event to Trash does not destroy it. Messages, selections, layouts and event details remain recoverable during the retention period.</p>
      </section>
    </main>
  )
}
