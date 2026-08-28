import type { CSSProperties } from 'react'
import type { VenueConfig } from '../types'
import { PLATFORM_NAME, PLATFORM_NAME_UPPER } from '../config/platform'

type SignInProps = {
  venues: VenueConfig[]
  activeVenueId: string
  onSelectVenue: (venueId: string) => void
  onVenueOwner: () => void
  onCouple: () => void
  onBackHome: () => void
}

export default function SignIn({ venues, activeVenueId, onSelectVenue, onVenueOwner, onCouple, onBackHome }: SignInProps) {
  const active = venues.find((item) => item.profile.id === activeVenueId) ?? venues[0]
  const eventLabel = active.profile.eventLabel ?? 'event'
  const eventPlural = active.profile.eventPluralLabel ?? 'events'
  const clientLabel = active.profile.clientLabel ?? 'client'
  const isChandelier = active.profile.id === 'venue-chandelier-oaks'
  return (
    <main className="page-main shell signin-page">
      <section className="signin-intro">
        <p className="eyebrow">{PLATFORM_NAME_UPPER} · SIGN IN</p>
        <h1>Find your venue first.</h1>
        <p>Venue-team and client access always belongs to a venue. Choose the venue, then enter the workspace assigned to you.</p>
      </section>

      <section className="panel signin-venue-picker" style={{ '--venue-primary': active.profile.brandPrimary, '--venue-accent': active.profile.brandAccent } as CSSProperties}>
        <label htmlFor="signinVenue"><span>VENUE</span><select id="signinVenue" value={activeVenueId} onChange={(event) => onSelectVenue(event.target.value)}>{venues.map((config) => <option value={config.profile.id} key={config.profile.id}>{config.profile.shortName}</option>)}</select></label>
        <div className="signin-selected-venue"><span>{active.profile.logoText}</span><div><strong>{active.profile.shortName}</strong><small>{active.profile.locationLabel}</small></div></div>
      </section>

      <div className="signin-grid">
        <article className="panel signin-card"><div className="signin-card__icon">V</div><span className="mini-label">VENUE TEAM</span><h2>{active.profile.shortName} owner</h2><p>Manage {eventPlural}, inventory, packages, messages, calendar milestones and final setup sheets for this venue only.</p><button className="button button--primary full-width" onClick={onVenueOwner}>{isChandelier ? 'Open Owner Portal' : 'Open Venue Owner Preview'}</button><small>{isChandelier ? 'Use the owner or staff account assigned to this venue.' : 'Preview access is prefilled on the next screen.'}</small></article>
        <article className="panel signin-card"><div className="signin-card__icon signin-card__icon--couple">◎</div><span className="mini-label">{clientLabel.toUpperCase()}</span><h2>My {active.profile.shortName} {eventLabel}</h2><p>{isChandelier ? `Sign in once and your email will open the private ${eventLabel} workspace assigned to you.` : `Enter the private ${eventLabel} workspace that belongs to this venue.`}</p><button className="button button--ghost full-width" onClick={onCouple}>{isChandelier ? `Sign in to ${clientLabel[0].toUpperCase() + clientLabel.slice(1)} Portal` : `Open ${clientLabel[0].toUpperCase() + clientLabel.slice(1)} Workspace`}</button><small>{isChandelier ? 'Email/password access is used for real clients. The three showcase weddings continue to use their demo codes.' : `The preview opens the first configured ${clientLabel} for the selected venue.`}</small></article>
      </div>

      <section className="signin-production-note"><strong>Access model</strong><span>{isChandelier ? 'Real Chandelier Oaks clients use secure email/password accounts. Showcase demo weddings intentionally keep their visible demo codes.' : 'Sample venues continue to demonstrate the venue-first access flow.'}</span></section>
      <button className="text-link signin-back" onClick={onBackHome}>← Back to {PLATFORM_NAME}</button>
    </main>
  )
}
