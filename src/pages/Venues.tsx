import { useMemo, useState, type CSSProperties } from 'react'
import type { VenueConfig, WeddingWorkspace } from '../types'

export default function Venues({ venues, weddings, onOpenVenue, onOpenCouple, onForVenues }: {
  venues: VenueConfig[]
  weddings: WeddingWorkspace[]
  onOpenVenue: (slug: string) => void
  onOpenCouple: (venueSlug: string, coupleSlug: string) => void
  onForVenues?: () => void
}) {
  const [selectedSlug, setSelectedSlug] = useState(venues[0]?.profile.slug ?? '')
  const selectedVenue = useMemo(() => venues.find(v => v.profile.slug === selectedSlug) ?? venues[0], [selectedSlug, venues])

  return (
    <main className="page-main shell venue-directory-page">
      <section className="page-intro venue-directory-intro">
        <p className="eyebrow">VIVIAVISIONS · VENUES</p>
        <h1>See ViviaVisions in action.</h1>
        <p>Explore how the same platform adapts to wedding venues, corporate event spaces and private-event properties. Clients always enter through the venue where their event is booked.</p>
      </section>

      {selectedVenue && (
        <section
          className="venue-quick-picker"
          style={{ '--picker-primary': selectedVenue.profile.brandPrimary, '--picker-accent': selectedVenue.profile.brandAccent, '--picker-surface': selectedVenue.profile.brandSurface ?? '#f4f4f4' } as CSSProperties}
          aria-label="Quick venue access"
        >
          <div className="venue-quick-picker__copy">
            <span className="eyebrow">QUICK ACCESS</span>
            <strong>Choose a venue</strong>
            <small>Jump straight into a configured venue portal.</small>
          </div>
          <label className="venue-quick-picker__select">
            <span>Venue</span>
            <select value={selectedSlug} onChange={(event) => setSelectedSlug(event.target.value)}>
              {venues.map((venue) => <option key={venue.profile.id} value={venue.profile.slug}>{venue.profile.shortName} · {venue.profile.locationLabel}</option>)}
            </select>
          </label>
          <div className="venue-quick-picker__selected">
            <span>{selectedVenue.profile.logoText}</span>
            <div><strong>{selectedVenue.profile.shortName}</strong><small>{selectedVenue.profile.venueTypeLabel ?? 'Event venue'} · {selectedVenue.profile.locationLabel}</small></div>
          </div>
          <button className="button button--primary" onClick={() => onOpenVenue(selectedVenue.profile.slug)}>Open Venue</button>
        </section>
      )}

      <section className="venue-directory-grid venue-directory-grid--medium">
        {venues.map((config) => {
          const venueEvents = weddings.filter((event) => event.venueId === config.profile.id)
          const firstEvent = venueEvents[0]
          const clientPlural = config.profile.clientPluralLabel ?? 'clients'
          const clientSingular = config.profile.clientLabel ?? 'client'
          return (
            <article
              key={config.profile.id}
              className="venue-directory-card venue-directory-card--medium"
              style={{ '--card-primary': config.profile.brandPrimary, '--card-accent': config.profile.brandAccent, '--card-surface': config.profile.brandSurface ?? '#f4f4f4' } as CSSProperties}
            >
              <div className="venue-directory-card__brand">
                <span className="venue-directory-card__mark">{config.profile.logoText}</span>
                <div><span>{(config.profile.venueTypeLabel ?? 'Venue portal').toUpperCase()}</span><h2>{config.profile.shortName}</h2><p>{config.profile.locationLabel}</p></div>
              </div>
              <p className="venue-directory-card__tagline">{config.profile.tagline}</p>
              <div className="venue-directory-card__stats venue-directory-card__stats--compact">
                <span><strong>{config.areas.length}</strong>spaces</span>
                <span><strong>{config.inventory.length}</strong>resources</span>
                <span><strong>{venueEvents.length}</strong>{clientPlural}</span>
              </div>
              <div className="venue-directory-card__actions">
                <button className="button button--primary" onClick={() => onOpenVenue(config.profile.slug)}>Explore Venue</button>
                {firstEvent && <button className="button button--ghost" onClick={() => onOpenCouple(config.profile.slug, firstEvent.accessSlug)}>Open {clientSingular} portal</button>}
              </div>
            </article>
          )
        })}
      </section>

      <p className="venue-directory-disclosure">Chandelier Oaks is the first configured venue implementation, built from its current public venue information with inventory verification still to be completed. Juniper &amp; Stone and The Foundry are fictional showcase properties.</p>

      <section className="venue-directory-cta">
        <div>
          <p className="eyebrow">FOR VENUES</p>
          <h2>Bring ViviaVisions to your property.</h2>
          <p>Your branding, spaces, inventory, packages, event types and client workflow — configured around the way your venue already operates.</p>
        </div>
        <button className="button button--primary" onClick={() => onForVenues?.()}>See ViviaVisions for Your Venue</button>
      </section>
    </main>
  )
}
