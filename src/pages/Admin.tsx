import type { CSSProperties } from 'react'
import { useMemo, useState, type FormEvent } from 'react'
import type { PageKey } from '../components/Header'
import { packageById, venueConfigById } from '../data'
import type { WeddingWorkspace } from '../types'
import { PLATFORM_NAME } from '../config/platform'

type AdminProps = {
  venueId: string
  weddings: WeddingWorkspace[]
  activeWeddingId: string
  onSelectWedding: (id: string) => void
  onOpenWedding: (id: string, destination?: PageKey) => void
  onAddWedding: (input: { couple: string; date: string; guests: number; packageId: string; primaryEmail: string }) => string | null
  authenticated: boolean
  onAuthenticate: (code: string) => boolean
  onExitPreview: () => void
  onLogout: () => void
  onNavigate: (page: PageKey) => void
}

function formatDate(value: string) { return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) }
function venueUnread(wedding: WeddingWorkspace) { return wedding.messages.filter((message) => message.senderRole !== 'venue' && !message.readByVenue).length }

export default function Admin({ venueId, weddings, activeWeddingId, onSelectWedding, onOpenWedding, onAddWedding, authenticated, onAuthenticate, onExitPreview, onLogout, onNavigate }: AdminProps) {
  const config = venueConfigById(venueId)
  const { profile: venue, inventory, packages } = config
  const eventLabel = venue.eventLabel ?? 'event'
  const eventPlural = venue.eventPluralLabel ?? 'events'
  const clientLabel = venue.clientLabel ?? 'client'
  const clientPlural = venue.clientPluralLabel ?? 'clients'
  const [accessCode, setAccessCode] = useState(config.ownerAccessCode)
  const [accessError, setAccessError] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [couple, setCouple] = useState('')
  const [date, setDate] = useState('')
  const [guests, setGuests] = useState(100)
  const [packageId, setPackageId] = useState(packages[0]?.id ?? '')
  const [primaryEmail, setPrimaryEmail] = useState('')
  const [formError, setFormError] = useState('')
  const [accessWeddingId, setAccessWeddingId] = useState<string | null>(null)
  const [copyStatus, setCopyStatus] = useState('')
  const isChandelier = venue.id === 'venue-chandelier-oaks'

  const sortedWeddings = useMemo(() => [...weddings].sort((a, b) => a.profile.date.localeCompare(b.profile.date)), [weddings])
  const activeWedding = weddings.find((wedding) => wedding.id === activeWeddingId) ?? weddings[0]
  const totalSelected = weddings.reduce((sum, wedding) => sum + wedding.selections.reduce((sub, selection) => sub + selection.quantity, 0), 0)
  const totalUnread = weddings.reduce((sum, wedding) => sum + venueUnread(wedding), 0)

  if (!authenticated) {
    return (
      <main className="owner-access-page shell">
        <section className="panel owner-access-card venue-owner-access" style={{ '--venue-primary': venue.brandPrimary, '--venue-accent': venue.brandAccent } as CSSProperties}>
          <div className="venue-brand-mark owner-access-venue-mark" style={{ background: venue.brandPrimary, color: venue.brandAccent }}>{venue.logoText}</div>
          <p className="eyebrow">{venue.shortName.toUpperCase()} · {isChandelier ? 'OWNER PORTAL ACCESS' : 'OWNER PREVIEW ACCESS'}</p>
          <h1>{isChandelier ? 'Chandelier Oaks owner portal.' : 'Venue owner dashboard.'}</h1>
          <p className="owner-access-lead">{isChandelier ? 'Enter the private Chandelier Oaks operations area for weddings, inventory, planning, messages and setup.' : `This gate represents the private ${venue.shortName} admin area. Production would use secure authentication and venue-specific permissions.`}</p>
          <form className="owner-access-form" onSubmit={(event) => { event.preventDefault(); if (!onAuthenticate(accessCode)) setAccessError(isChandelier ? 'Incorrect owner access code.' : 'Incorrect preview password.'); else setAccessError('') }}>
            <label htmlFor="ownerAccess">{isChandelier ? 'Owner access code' : 'Temporary preview password'}</label>
            <input id="ownerAccess" value={accessCode} onChange={(event) => { setAccessCode(event.target.value); setAccessError('') }} autoFocus />
            <small>{isChandelier ? 'Current build access code' : 'Prefilled for this preview'}: <strong>{config.ownerAccessCode}</strong></small>
            {accessError && <div className="owner-access-error" role="alert">{accessError}</div>}
            <button className="button button--primary full-width" type="submit">Enter {venue.shortName} Owner View</button>
          </form>
          <div className="owner-access-note"><strong>{isChandelier ? 'Current build access.' : 'Preview environment.'}</strong> {isChandelier ? 'The venue workflow is configured; secure production authentication and backend storage are still pending.' : 'No real customer, contract or payment information should be entered here.'}</div>
          <button className="text-link owner-access-back" onClick={onExitPreview}>← Back to {venue.shortName}</button>
        </section>
      </main>
    )
  }

  const submitWedding = (event: FormEvent) => {
    event.preventDefault()
    const result = onAddWedding({ couple, date, guests, packageId, primaryEmail })
    if (result) { setFormError(result); return }
    setShowAdd(false); setCouple(''); setDate(''); setGuests(100); setPackageId(packages[0]?.id ?? ''); setPrimaryEmail(''); setFormError('')
  }

  const accessSegment = clientLabel === 'couple' ? 'couple' : 'client'
  const coupleLink = (wedding: WeddingWorkspace) => `${window.location.origin}${window.location.pathname}#/venue/${encodeURIComponent(venue.slug)}/${accessSegment}/${encodeURIComponent(wedding.accessSlug)}`
  const copyText = async (text: string, label: string) => { try { await navigator.clipboard.writeText(text); setCopyStatus(`${label} copied.`) } catch { setCopyStatus(`${label}: ${text}`) }; window.setTimeout(() => setCopyStatus(''), 2200) }
  const copyInvite = (wedding: WeddingWorkspace) => copyText(`${venue.shortName} ${eventLabel} portal: ${coupleLink(wedding)}  Access code: ${wedding.accessCode}`, isChandelier ? 'Invite' : 'Preview invite')
  const inventoryTitle = venue.inventoryLabel ?? 'Décor Collection'

  return (
    <main className="page-main shell admin-page venue-admin" style={{ '--venue-primary': venue.brandPrimary, '--venue-accent': venue.brandAccent, '--venue-surface': venue.brandSurface ?? '#f4f4f4' } as CSSProperties}>
      <section className="page-intro page-intro--split admin-intro">
        <div><p className="eyebrow">{venue.shortName.toUpperCase()} · OWNER DASHBOARD</p><h1>Every {eventLabel}. One venue command center.</h1><p>Switch {eventPlural}, watch booked dates, manage {inventoryTitle}, review package status and keep each {clientLabel}'s private workspace separate.</p></div>
        <div className="owner-session-actions"><span className="prototype-badge prototype-badge--large">{venue.previewLabel}</span><button className="text-link" onClick={onLogout}>Sign out</button></div>
      </section>

      {activeWedding && <section className="panel owner-active-wedding owner-active-wedding--dynamic"><div className="owner-active-wedding__copy"><p className="eyebrow">ACTIVE {eventLabel.toUpperCase()}</p><h2>{activeWedding.profile.couple}</h2><p>{formatDate(activeWedding.profile.date)} · {packageById(activeWedding.profile.packageId, venueId).name}</p></div><div className="owner-active-wedding__controls"><label htmlFor="owner-active-wedding-select">Switch active {clientLabel}</label><select id="owner-active-wedding-select" value={activeWeddingId} onChange={(event) => onSelectWedding(event.target.value)}>{sortedWeddings.map((wedding) => <option key={wedding.id} value={wedding.id}>{wedding.profile.couple} · {formatDate(wedding.profile.date)}</option>)}</select><div className="owner-active-wedding__buttons"><button className="button button--primary button--small" onClick={() => onOpenWedding(activeWedding.id, 'wedding')}>Open workspace</button><button className="button button--ghost button--small" onClick={() => onOpenWedding(activeWedding.id, 'messages')}>Messages</button></div></div></section>}

      <section className="admin-metrics metric-grid"><article><span>Upcoming {eventPlural}</span><strong>{weddings.length}</strong><small>inside {venue.shortName}</small></article><article><span>{inventoryTitle}</span><strong>{inventory.length}</strong><small>configured inventory styles</small></article><article><span>Selected pieces</span><strong>{totalSelected}</strong><small>across this venue</small></article><article><span>Unread messages</span><strong>{totalUnread}</strong><small>for venue team</small></article></section>

      <section className="owner-quick-grid">
        <button className="owner-quick-card" onClick={() => onNavigate('calendar')}><span>CALENDAR + MILESTONES</span><strong>See booked dates and timing</strong><small>{config.oneEventPerDate ? `One ${eventLabel} per calendar date` : 'Venue-defined availability rules'}</small><b>→</b></button>
        <button className="owner-quick-card" onClick={() => onNavigate('catalog')}><span>{inventoryTitle.toUpperCase()}</span><strong>Review inventory and package access</strong><small>Counts, availability and storage</small><b>→</b></button>
        <button className="owner-quick-card" onClick={() => onNavigate('messages')}><span>MESSAGES</span><strong>Keep each {eventLabel} conversation together</strong><small>Follows the active {clientLabel}</small><b>→</b></button>
        <button className="owner-quick-card" onClick={() => onNavigate('planner')}><span>2D DESIGNER</span><strong>Build the layout before visualizing it</strong><small>The structured plan becomes the AI Preview input</small><b>→</b></button>
      </section>

      <section className="panel admin-weddings admin-weddings--cards">
        <div className="panel__heading admin-weddings__heading"><div><p className="eyebrow">UPCOMING</p><h2>{clientPlural[0].toUpperCase() + clientPlural.slice(1)} &amp; {eventLabel} workspaces</h2><p className="booking-rule">{config.ownerDashboardNote} {PLATFORM_NAME} prevents duplicate dates inside this venue.</p></div><button className="button button--small button--primary" onClick={() => { setShowAdd((current) => !current); setFormError('') }}>{showAdd ? 'Cancel' : `+ Add ${eventLabel}`}</button></div>

        {showAdd && <form className="add-wedding-form add-wedding-form--expanded" onSubmit={submitWedding}><label><span>{clientLabel[0].toUpperCase() + clientLabel.slice(1)} / event name</span><input value={couple} onChange={(event) => setCouple(event.target.value)} placeholder={eventLabel === 'wedding' ? 'Taylor & Jordan' : 'Annual Leadership Summit'} /></label><label><span>{eventLabel[0].toUpperCase() + eventLabel.slice(1)} date</span><input type="date" value={date} onChange={(event) => { setDate(event.target.value); setFormError('') }} /></label><label><span>Guests</span><input type="number" min="1" max="300" value={guests} onChange={(event) => setGuests(Number(event.target.value) || 1)} /></label><label><span>Package</span><select value={packageId} onChange={(event) => setPackageId(event.target.value)}>{packages.map((pkg) => <option key={pkg.id} value={pkg.id}>{pkg.name}</option>)}</select></label><label><span>Primary email</span><input type="email" value={primaryEmail} onChange={(event) => setPrimaryEmail(event.target.value)} placeholder="client@example.com" /></label><button className="button button--primary" type="submit">Create {eventLabel} workspace</button>{formError && <div className="add-wedding-error">{formError}</div>}</form>}
        {copyStatus && <div className="copy-toast" role="status">{copyStatus}</div>}

        <div className="wedding-workspace-grid">{sortedWeddings.map((wedding) => { const selectedPieces = wedding.selections.reduce((sum, selection) => sum + selection.quantity, 0); const unread = venueUnread(wedding); const active = wedding.id === activeWeddingId; const showAccess = accessWeddingId === wedding.id; const pkg = packageById(wedding.profile.packageId, venueId); return <article className={`wedding-workspace-card ${active ? 'wedding-workspace-card--active' : ''}`} key={wedding.id}><div className="wedding-workspace-card__top"><div><span className="mini-label">{active ? 'ACTIVE OWNER WORKSPACE' : `${eventLabel.toUpperCase()} WORKSPACE`}</span><h3>{wedding.profile.couple}</h3><strong className="workspace-date">{formatDate(wedding.profile.date)}</strong></div><span className={`status-pill status-pill--${wedding.status.toLowerCase().replace(' ', '-')}`}>{wedding.status}</span></div><div className="workspace-package"><span>PACKAGE</span><strong>{pkg.name}</strong><small>${pkg.price.toLocaleString()} · {pkg.maxGuests === null ? 'guest cap to confirm' : `up to ${pkg.maxGuests} guests`}</small></div><div className="workspace-stats"><div><span>Guests</span><strong>{wedding.profile.guests}</strong></div><div><span>Resources</span><strong>{selectedPieces}</strong></div><div><span>Plan</span><strong>{wedding.placedItems.length ? `${wedding.placedItems.length} pcs` : '—'}</strong></div><div><span>Messages</span><strong>{unread ? `${unread} new` : wedding.messages.length}</strong></div></div><div className="workspace-actions workspace-actions--three"><button className="button button--primary button--small" onClick={() => onOpenWedding(wedding.id, 'wedding')}>Open workspace</button><button className="button button--ghost button--small" onClick={() => onOpenWedding(wedding.id, 'messages')}>Messages</button><button className="button button--ghost button--small" onClick={() => { setAccessWeddingId(showAccess ? null : wedding.id); setCopyStatus('') }}>Access details</button></div>{showAccess && <div className="couple-access-details"><div className="couple-access-details__heading"><div><span className="mini-label">{clientLabel.toUpperCase()} ACCESS{isChandelier ? '' : ' · PREVIEW'}</span><strong>Private {eventLabel} link</strong></div><span className="access-code-pill">Code {wedding.accessCode}</span></div><code className="couple-access-url">{coupleLink(wedding)}</code><div className="couple-access-details__actions"><button className="button button--small button--ghost" onClick={() => copyText(coupleLink(wedding), `${eventLabel[0].toUpperCase() + eventLabel.slice(1)} link`)}>Copy link</button><button className="button button--small button--ghost" onClick={() => copyText(wedding.accessCode, 'Access code')}>Copy code</button><button className="button button--small button--primary" onClick={() => copyInvite(wedding)}>Resend access</button></div><small>{isChandelier ? `The direct link stays under ${venue.shortName}. Production launch will replace the temporary code with secure email sign-in or a one-time code.` : `Production would email a secure sign-in or one-time code. The link always stays under ${venue.shortName}.`}</small></div>}</article> })}</div>
      </section>

      <section className="panel package-admin-panel"><div className="panel__heading"><div><p className="eyebrow">PACKAGES</p><h2>Package-aware planning</h2><p>Each venue can define its own packages, guest limits and inventory access rules.</p></div></div><div className="owner-package-grid">{packages.map((pkg) => <article key={pkg.id}><span>{pkg.duration}</span><strong>{pkg.name}</strong><b>${pkg.price.toLocaleString()}</b><small>{pkg.maxGuests === null ? 'Guest cap to confirm' : `Up to ${pkg.maxGuests} guests`} · collection tier {pkg.tier}</small></article>)}</div></section>

      <section className="panel inventory-admin"><div className="panel__heading"><div><p className="eyebrow">{inventoryTitle.toUpperCase()}</p><h2>Storage &amp; availability</h2><p>{venue.isSample ? 'This inventory is fictional and exists to demonstrate another venue configuration.' : 'The initial Pinrose Prop Shop catalog is configured from public venue information. Working counts, dimensions, storage locations and package access can be finalized during the venue inventory pass.'}</p></div><button className="button button--small button--primary">+ Add inventory item</button></div><div className="admin-table-wrap"><table className="admin-table admin-table--inventory"><thead><tr><th>Item</th><th>Category</th><th>Tier</th><th>Available</th><th>Storage location</th></tr></thead><tbody>{inventory.map((item) => <tr key={item.id}><td><strong>{item.name}</strong></td><td>{item.category}</td><td>{item.accessTier}</td><td>{item.quantity}</td><td><code>{item.storage}</code></td></tr>)}</tbody></table></div></section>
    </main>
  )
}
