import type { CSSProperties } from 'react'
import { useState } from 'react'
import type { PageKey } from '../components/Header'
import type { VenueConfig, VenueLead, WeddingWorkspace } from '../types'
import { PLATFORM_NAME, PLATFORM_NAME_UPPER, PLATFORM_SHORT_NAME } from '../config/platform'
import { backendStatus } from '../lib/backend'

type PlatformAdminProps = {
  authenticated: boolean
  authLoading: boolean
  onAuthenticate: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  onLogout: () => void | Promise<void>
  onNavigate: (page: PageKey) => void
  leads: VenueLead[]
  weddings: WeddingWorkspace[]
  venues: VenueConfig[]
  onOpenVenue: (slug: string) => void
  onManageVenue: (slug: string) => void | Promise<void>
}

function formatActivityTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function PlatformAdmin({
  authenticated,
  authLoading,
  onAuthenticate,
  leads,
  weddings,
  venues,
  onNavigate,
  onOpenVenue,
  onManageVenue,
}: PlatformAdminProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!authenticated) {
    return (
      <main className="owner-access-page shell">
        <section className="panel owner-access-card platform-access-card">
          <div className="owner-access-lock">{PLATFORM_SHORT_NAME}</div>
          <p className="eyebrow">{PLATFORM_NAME_UPPER} ADMIN</p>
          <h1>Administrator sign in.</h1>

          {authLoading ? (
            <div className="owner-access-note">
              <strong>Checking your session…</strong>
            </div>
          ) : (
            <form
              className="owner-access-form"
              onSubmit={async (event) => {
                event.preventDefault()
                setSubmitting(true)
                setError('')
                const result = await onAuthenticate(email, password)
                if (!result.ok) setError(result.error ?? 'Unable to sign in.')
                setSubmitting(false)
              }}
            >
              <label htmlFor="platform-admin-email">Email</label>
              <input
                id="platform-admin-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  setError('')
                }}
                required
              />

              <label htmlFor="platform-admin-password">Password</label>
              <input
                id="platform-admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  setError('')
                }}
                required
              />

              {error && <div className="owner-access-error">{error}</div>}

              <button className="button button--primary full-width" type="submit" disabled={submitting}>
                {submitting ? 'Signing in…' : `Sign in to ${PLATFORM_SHORT_NAME} Admin`}
              </button>
            </form>
          )}
        </section>
      </main>
    )
  }

  const visibleEvents = weddings.filter(
    (wedding) => !wedding.deletedAt && wedding.status !== 'Cancelled',
  )
  const cancelledEvents = weddings.filter(
    (wedding) => !wedding.deletedAt && wedding.status === 'Cancelled',
  )
  const trashedEvents = weddings.filter((wedding) => Boolean(wedding.deletedAt))

  const totalUnread = visibleEvents.reduce(
    (sum, wedding) =>
      sum +
      wedding.messages.filter(
        (message) => message.senderRole !== 'venue' && !message.readByVenue,
      ).length,
    0,
  )

  const totalInventory = venues.reduce(
    (sum, venue) => sum + venue.inventory.length,
    0,
  )

  const activity = [
    ...visibleEvents.flatMap((wedding) =>
      wedding.messages.map((message) => ({
        id: `message-${wedding.id}-${message.id}`,
        time: message.timestamp,
        type: 'Message',
        title: wedding.profile.couple,
        detail: `${venues.find((venue) => venue.profile.id === wedding.venueId)?.profile.shortName ?? 'Venue'} · ${message.senderName}: ${message.body || 'Attachment or linked item'}`,
      })),
    ),
    ...leads.map((lead) => ({
      id: `lead-${lead.id}`,
      time: lead.submittedAt,
      type: 'Venue request',
      title: lead.venueName,
      detail: `${lead.contactName} · ${lead.email}`,
    })),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 8)

  return (
    <main className="vv-admin-console shell">
      <section className="vv-admin-heading">
        <div>
          <p className="eyebrow">{PLATFORM_NAME_UPPER}</p>
          <h1>Admin</h1>
        </div>
        <a href="#/platform-inventory" className="button button--primary button--small platform-inventory-button" onClick={(event) => { event.preventDefault(); onNavigate('platform-inventory') }}>
          Inventory
        </a>
      </section>

      <section className="vv-admin-metrics" aria-label="Platform metrics">
        <article>
          <span>Venue accounts</span>
          <strong>{venues.length}</strong>
          <small>{venues.filter((venue) => venue.profile.isSample).length} demo</small>
        </article>
        <article>
          <span>Active events</span>
          <strong>{visibleEvents.length}</strong>
          <small>{cancelledEvents.length} cancelled</small>
        </article>
        <article>
          <span>Unread messages</span>
          <strong>{totalUnread}</strong>
          <small>across active events</small>
        </article>
        <article>
          <span>Venue requests</span>
          <strong>{leads.length}</strong>
          <small>{trashedEvents.length} events in trash</small>
        </article>
      </section>

      <section className="panel vv-admin-section vv-admin-venues">
        <div className="vv-admin-section__heading">
          <div>
            <p className="eyebrow">VENUE ACCOUNTS</p>
            <h2>Venues</h2>
          </div>
          <button className="button button--primary button--small" onClick={() => onNavigate('for-venues')}>
            New venue request
          </button>
        </div>

        <div className="vv-admin-venue-list">
          {venues.map((config) => {
            const venueEvents = visibleEvents.filter(
              (wedding) => wedding.venueId === config.profile.id,
            )
            const venueUnread = venueEvents.reduce(
              (sum, wedding) =>
                sum +
                wedding.messages.filter(
                  (message) => message.senderRole !== 'venue' && !message.readByVenue,
                ).length,
              0,
            )

            return (
              <article
                className="vv-admin-venue-row"
                key={config.profile.id}
                style={{ '--vv-row-accent': config.profile.brandAccent } as CSSProperties}
              >
                <div
                  className="vv-admin-venue-mark"
                  style={{
                    background: config.profile.brandPrimary,
                    color: '#fff',
                  }}
                >
                  {config.profile.logoText}
                </div>

                <div className="vv-admin-venue-identity">
                  <div className="vv-admin-venue-name-line">
                    <h3>{config.profile.shortName}</h3>
                    <span className={config.profile.isSample ? 'vv-admin-badge vv-admin-badge--demo' : 'vv-admin-badge vv-admin-badge--live'}>
                      {config.profile.isSample ? 'DEMO' : 'LIVE'}
                    </span>
                  </div>
                  <p>{config.profile.locationLabel || config.profile.address}</p>
                </div>

                <div className="vv-admin-venue-stats">
                  <div><strong>{venueEvents.length}</strong><span>Active events</span></div>
                  <div><strong>{venueUnread}</strong><span>Unread</span></div>
                  <div><strong>{config.inventory.length}</strong><span>Inventory</span></div>
                  <div><strong>{config.packages.length}</strong><span>Packages</span></div>
                </div>

                <div className="vv-admin-venue-action">
                  <a
                    className="button button--ghost button--small"
                    href={`#/venue/${config.profile.slug}`}
                    onClick={(event) => { event.preventDefault(); onOpenVenue(config.profile.slug) }}
                  >
                    Open venue
                  </a>
                  <a
                    className="button button--primary button--small"
                    href={`#/venue/${config.profile.slug}/owner`}
                    onClick={(event) => { event.preventDefault(); void onManageVenue(config.profile.slug) }}
                  >
                    Manage venue
                  </a>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="panel vv-admin-section vv-admin-status">
        <div className="vv-admin-section__heading">
          <div>
            <p className="eyebrow">STATUS</p>
            <h2>System</h2>
          </div>
        </div>

        <div className="vv-admin-status-grid">
          <div>
            <i className="vv-admin-status-dot vv-admin-status-dot--ok" />
            <span><strong>Backend</strong><small>{backendStatus.label}</small></span>
          </div>
          <div>
            <i className="vv-admin-status-dot vv-admin-status-dot--ok" />
            <span><strong>Venue accounts</strong><small>{venues.length} configured</small></span>
          </div>
          <div>
            <i className="vv-admin-status-dot vv-admin-status-dot--ok" />
            <span><strong>Inventory</strong><small>{totalInventory} records loaded</small></span>
          </div>
          <div>
            <i className={trashedEvents.length ? 'vv-admin-status-dot vv-admin-status-dot--attention' : 'vv-admin-status-dot vv-admin-status-dot--ok'} />
            <span><strong>Recovery queue</strong><small>{trashedEvents.length} in Trash</small></span>
          </div>
          <div>
            <i className={totalUnread ? 'vv-admin-status-dot vv-admin-status-dot--attention' : 'vv-admin-status-dot vv-admin-status-dot--ok'} />
            <span><strong>Messages</strong><small>{totalUnread} unread</small></span>
          </div>
        </div>
      </section>

      <section className="panel vv-admin-section vv-admin-activity">
        <div className="vv-admin-section__heading">
          <div>
            <p className="eyebrow">RECENT ACTIVITY</p>
            <h2>Activity</h2>
          </div>
        </div>

        {activity.length === 0 ? (
          <div className="empty-state">
            <h3>No recent activity.</h3>
          </div>
        ) : (
          <div className="vv-admin-activity-list">
            {activity.map((item) => (
              <article key={item.id}>
                <span className="vv-admin-activity-type">{item.type}</span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>
                <time>{formatActivityTime(item.time)}</time>
              </article>
            ))}
          </div>
        )}
      </section>

      {leads.length > 0 && (
        <section className="panel vv-admin-section vv-admin-requests">
          <div className="vv-admin-section__heading">
            <div>
              <p className="eyebrow">VENUE REQUESTS</p>
              <h2>Requests</h2>
            </div>
          </div>

          <div className="vv-admin-request-list">
            {leads.map((lead) => (
              <article key={lead.id}>
                <div
                  className="vv-admin-request-mark"
                  style={{ background: lead.brandPrimary, color: '#fff' }}
                >
                  {lead.logoDataUrl
                    ? <img src={lead.logoDataUrl} alt="" />
                    : lead.venueName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <strong>{lead.venueName}</strong>
                  <span>{lead.contactName} · {lead.email}</span>
                </div>
                <time>{new Date(lead.submittedAt).toLocaleDateString()}</time>
              </article>
            ))}
          </div>
        </section>
      )}

      <footer className="vv-admin-console__footer">
        <span>{PLATFORM_NAME}</span>
        <span>Platform operations</span>
      </footer>
    </main>
  )
}
