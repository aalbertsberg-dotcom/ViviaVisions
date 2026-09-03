import type { CSSProperties } from 'react'
import type { PageKey } from '../components/Header'
import { venueConfigById } from '../data'
import type { WeddingWorkspace } from '../types'
import { PLATFORM_NAME, PLATFORM_NAME_UPPER } from '../config/platform'
import { isDemoClientWorkspace } from '../config/demo'
import VendorPartners from '../components/VendorPartners'

type VenuePortalProps = {
  venueId: string
  weddings: WeddingWorkspace[]
  onNavigate: (page: PageKey) => void
  onOpenCouple: (weddingId: string) => void
  onOpenClientPortal: () => void
}

export default function VenuePortal({ venueId, weddings, onNavigate, onOpenCouple, onOpenClientPortal }: VenuePortalProps) {
  const config = venueConfigById(venueId)
  const { profile: venue, packages, areas } = config
  const isChandelier = venue.id === 'venue-chandelier-oaks'
  const publicShowcaseWeddings = isChandelier
    ? weddings.filter((event) => isDemoClientWorkspace(venue.slug, event.accessSlug))
    : weddings
  const firstEvent = publicShowcaseWeddings[0]
  const isFoundry = venue.id === 'venue-foundry-rivergate'
  const eventLabel = venue.eventLabel ?? 'event'
  const eventPlural = venue.eventPluralLabel ?? 'events'
  const clientLabel = venue.clientLabel ?? 'client'
  const clientPlural = venue.clientPluralLabel ?? 'clients'
  const heroTitle = isChandelier ? 'Plan your event at Chandelier Oaks.' : (venue.portalHeroTitle ?? 'A modern venue portal, configured around a completely different brand.')
  const heroBody = venue.portalHeroBody ?? (isChandelier ? 'Browse the Pinrose Prop Shop, review your package, design venue spaces and keep every question attached to your wedding plan.' : 'Explore the Design Library, plan modern venue spaces, build the 2D layout and keep every wedding workspace separate.')

  return (
    <main className="venue-portal" style={{ '--venue-primary': venue.brandPrimary, '--venue-accent': venue.brandAccent, '--venue-surface': venue.brandSurface ?? '#eef2ed', '--venue-text': venue.brandText ?? venue.brandPrimary } as CSSProperties}>
      <section className="venue-brand-hero venue-brand-hero--dynamic venue-brand-hero--compact">
        <div className="venue-brand-hero__wash" />
        <div className="shell venue-brand-hero__inner">
          {!isChandelier && <div className="venue-brand-lockup">
            <div className="venue-brand-mark">{venue.logoText}</div>
            <div><span>{venue.shortName.toUpperCase()}</span><small>{venue.venueTypeLabel ?? 'Event venue'} · {venue.locationLabel}</small></div>
          </div>}
          <div className="venue-brand-hero__copy">
            <h1>{heroTitle}</h1>
            <p>{heroBody}</p>
            <div className="hero__actions">
              {isChandelier
                ? <>
                    <button className="button button--venue" data-testid="real-client-portal" onClick={onOpenClientPortal}>Open Couple Portal</button>
                    <button className="button button--venue-ghost" onClick={() => document.getElementById('chandelier-demo-showcase')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>View Demo Weddings</button>
                  </>
                : firstEvent && <button className="button button--venue" onClick={() => onOpenCouple(firstEvent.id)}>{`Enter a ${clientLabel} workspace`}</button>}
              <button className="button button--venue-ghost" onClick={() => onNavigate('admin')}>{isChandelier ? 'Owner Portal' : 'Venue owner preview'}</button>
            </div>
            {!isChandelier && <div className="venue-preview-credentials"><span>Owner access is prefilled on the next screen.</span><span>{`${weddings.length} private ${clientPlural} workspaces configured.`}</span></div>}
          </div>
        </div>
      </section>

      <section className="section shell venue-overview">
        <div className="venue-overview__intro">
          <p className="eyebrow">{venue.previewLabel?.toUpperCase()}</p>
          <h2>{isChandelier ? 'A 32-acre Mississippi Gulf Coast venue, organized around the way Chandelier Oaks actually operates.' : isFoundry ? `A multi-purpose event venue showing ${PLATFORM_NAME} beyond weddings.` : `A second wedding venue showing how ${PLATFORM_NAME} changes with the customer.`}</h2>
          <p>{isChandelier ? 'The portal brings Chandelier Oaks packages, ceremony and reception spaces, booking rules, Pinrose Prop Shop resources, couple workspaces and setup planning into one venue-branded system. Final inventory counts and storage details can be completed during the venue inventory pass.' : isFoundry ? 'The Foundry is fictional and intentionally focuses on meetings, galas, launches and private events, with client workspaces instead of couple-only language.' : 'Juniper & Stone is fictional and intentionally uses a different visual identity, package structure, spaces and inventory language.'}</p>
          {venue.links && venue.links.length > 0 && <div className="venue-external-links">{venue.links.map((link) => <a key={link.url} href={link.url} target="_blank" rel="noreferrer">{link.label} ↗</a>)}</div>}
        </div>
        <div className="venue-facts">
          {isChandelier ? <><article><strong>32</strong><span>acre property</span></article><article><strong>250</strong><span>guest outdoor capacity</span></article><article><strong>3,500</strong><span>sq. ft. Pecan Pavilion</span></article><article><strong>1</strong><span>wedding hosted per day</span></article></> : isFoundry ? <><article><strong>{areas.length}</strong><span>configurable event spaces</span></article><article><strong>400</strong><span>showcase max guests</span></article><article><strong>{config.inventory.length}</strong><span>resource styles</span></article><article><strong>{packages.length}</strong><span>event packages</span></article></> : <><article><strong>{areas.length}</strong><span>designable spaces</span></article><article><strong>200</strong><span>showcase max guests</span></article><article><strong>{config.inventory.length}</strong><span>design styles</span></article><article><strong>{packages.length}</strong><span>packages</span></article></>}
        </div>
      </section>

      {isChandelier && <section className="section shell chandelier-operations-section">
        <div className="section-heading"><div><p className="eyebrow">CHANDELIER OAKS WORKFLOW</p><h2>Venue policies are part of the portal, not separate notes.</h2><p className="section-lead">The configured experience carries the venue's current public booking and package information into the tools the team and couples use.</p></div></div>
        <div className="chandelier-operations-grid">
          <article><span>BOOKING</span><strong>One wedding per day</strong><p>Tours are by appointment, and the venue reserves the calendar around one wedding per date.</p></article>
          <article><span>PAYMENT SCHEDULE</span><strong>25% at signing</strong><p>Follow-up installments are scheduled 270, 180 and 60 days before the wedding date.</p></article>
          <article><span>PINROSE PROP SHOP</span><strong>Décor built into planning</strong><p>Antique furniture, arches, arbors, French doors, champagne walls, swing beds, chandeliers and more can live in the searchable venue catalog.</p></article>
          <article><span>PACKAGE EXPERIENCE</span><strong>Venue services stay attached</strong><p>Ceremony seating, outdoor photo access, onsite representation, officiant, golf-cart service and setup/breakdown are reflected in the planning workflow.</p></article>
        </div>
      </section>}

      <section className="section venue-spaces-section">
        <div className="shell">
          <div className="section-heading"><div><p className="eyebrow">{isChandelier ? 'CHANDELIER OAKS SPACES' : 'DESIGNABLE VENUE AREAS'}</p><h2>{isChandelier ? 'Plan the actual spaces couples choose.' : 'Choose the place, then build the plan.'}</h2><p className="section-lead">{isChandelier ? 'Each Chandelier Oaks ceremony, reception and hospitality area is configured as its own planning canvas so layouts and selections stay attached to the right space.' : 'Each venue defines its own spaces instead of forcing every customer into one generic room template.'}</p></div></div>
          <div className="venue-area-grid">
            {areas.map((area) => (
              <article className={`venue-area-card venue-area-card--${area.visual}`} key={area.id}>
                <div className="venue-area-card__art"><span/><i/><b/></div>
                <div className="venue-area-card__body"><span>{area.kind}</span><h3>{area.name}</h3><p>{area.description}</p>{isChandelier ? <button className="text-link" onClick={onOpenClientPortal}>Open {eventLabel} tools →</button> : firstEvent && <button className="text-link" onClick={() => onOpenCouple(firstEvent.id)}>Open {eventLabel} tools →</button>}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section shell package-preview-section">
        <div className="section-heading"><div><p className="eyebrow">{isChandelier ? 'CURRENT WEDDING PACKAGES' : 'PACKAGE-AWARE PLANNING'}</p><h2>{isChandelier ? 'Package details drive the planning experience.' : `The portal knows what kind of ${eventLabel} is being planned.`}</h2><p className="section-lead">{isChandelier ? 'Current public Chandelier Oaks wedding package pricing, duration and published guest limits are reflected here so each couple can plan against the package they actually booked.' : `Package details can control guest limits, planning milestones and which inventory or resource tiers are available to the ${clientLabel}.`}</p></div></div>
        <div className="package-preview-grid">
          {packages.map((pkg) => (
            <article className={pkg.tier === 2 ? 'package-card package-card--featured' : 'package-card'} key={pkg.id}>
              <div className="package-card__top"><span>{pkg.duration}</span>{pkg.tier === 2 && <b>FEATURED</b>}</div>
              <h3>{pkg.name}</h3><strong className="package-price">${pkg.price.toLocaleString()}</strong><p>{pkg.description}</p><ul>{pkg.highlights.slice(0, 3).map((item) => <li key={item}>{item}</li>)}</ul>
            </article>
          ))}
        </div>
      </section>

      <VendorPartners venueSlug={venue.slug} venueName={venue.shortName} />

      {isChandelier ? (
        <section id="chandelier-demo-showcase" data-testid="demo-showcase" className="section shell venue-couple-preview-section venue-demo-showcase">
          <div className="section-heading">
            <div>
              <p className="eyebrow">VIVIAVISIONS DEMO SHOWCASE</p>
              <h2>Try a complete Chandelier Oaks planning workspace.</h2>
              <p className="section-lead">These three fictional weddings are intentionally public demonstrations. Real Chandelier Oaks couples use the private Couple Portal above and never appear in this showcase.</p>
            </div>
          </div>
          <div className="venue-couple-preview-grid">
            {publicShowcaseWeddings.map((event) => (
              <button className="demo-showcase-card" key={event.id} onClick={() => onOpenCouple(event.id)}>
                <span>DEMO · {event.status}</span>
                <strong>{event.profile.couple}</strong>
                <small>{new Date(`${event.profile.date}T12:00:00`).toLocaleDateString(undefined,{month:'long',day:'numeric',year:'numeric'})}</small>
                <small className="demo-showcase-code">Demo code: <b>{event.accessCode}</b></small>
                <b>Open demo workspace →</b>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <section className="section shell venue-couple-preview-section">
          <div className="section-heading"><div><p className="eyebrow">{`PRIVATE ${eventLabel.toUpperCase()} WORKSPACES`}</p><h2>{`Every ${clientLabel} stays inside ${venue.shortName}.`}</h2><p className="section-lead">{`These workspaces are separate from every other venue in ${PLATFORM_NAME}.`}</p></div></div>
          <div className="venue-couple-preview-grid">{publicShowcaseWeddings.map((event) => <button key={event.id} onClick={() => onOpenCouple(event.id)}><span>{event.status}</span><strong>{event.profile.couple}</strong><small>{new Date(`${event.profile.date}T12:00:00`).toLocaleDateString(undefined,{month:'long',day:'numeric',year:'numeric'})}</small><b>Open workspace →</b></button>)}</div>
        </section>
      )}

      <section className="venue-contact-strip venue-contact-strip--dynamic">
        <div className="shell venue-contact-strip__inner">
          <div><span>{venue.shortName.toUpperCase()}</span><strong>{venue.address}</strong></div>
          <div><span>{venue.isSample ? 'SHOWCASE CONTACT' : 'VENUE CONTACT'}</span><strong>{venue.phone} · {venue.email}</strong></div>
          <div><span>{PLATFORM_NAME_UPPER}</span><strong>{venue.isSample ? `Fictional ${eventPlural} configuration` : 'Chandelier Oaks planning & operations portal'}</strong></div>
        </div>
      </section>
    </main>
  )
}
