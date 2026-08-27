import type { CSSProperties } from 'react'
import type { PageKey } from '../components/Header'
import Logo from '../components/Logo'
import type { VenueConfig } from '../types'
import { PLATFORM_NAME, PLATFORM_NAME_UPPER, PLATFORM_TAGLINE } from '../config/platform'

export default function Home({ onNavigate, onOpenVenue, venues }: {
  onNavigate: (page: PageKey) => void
  onOpenVenue: (slug: string) => void
  venues: VenueConfig[]
}) {
  return (
    <main className="saas-home">
      <section className="saas-hero shell">
        <div className="saas-hero__copy">
          <span className="saas-pill">{PLATFORM_NAME_UPPER} · EVENT VENUE MANAGEMENT &amp; PLANNING</span>
          <h1>One platform. Every venue still feels like itself.</h1>
          <p className="vivia-tagline">{PLATFORM_TAGLINE}</p>
          <p>{PLATFORM_NAME} gives event venues a branded system for inventory, spaces, packages, clients, communication and final setup — while every event gets a private workspace inside the venue where it is booked.</p>
          <div className="hero__actions">
            <button className="button button--primary" onClick={() => onNavigate('venues')}>Explore Venues</button>
            <button className="button button--ghost" onClick={() => onNavigate('for-venues')}>For Venues</button>
            <button className="text-link home-signin-link" onClick={() => onNavigate('signin')}>Sign In</button>
          </div>
        </div>

        <div className="saas-hero__visual">
          <div className="multi-venue-stack">
            <div className="platform-stack__top"><Logo compact /><div><span>{PLATFORM_NAME_UPPER}</span><strong>Venue Portals</strong></div></div>
            <p>Choose a venue to explore its branded owner and client experience.</p>
            <div className="multi-venue-stack__cards">
              {venues.map((config) => (
                <button
                  key={config.profile.id}
                  className="multi-venue-mini"
                  style={{ '--mini-primary': config.profile.brandPrimary, '--mini-accent': config.profile.brandAccent, '--mini-surface': config.profile.brandSurface ?? '#f4f4f4' } as CSSProperties}
                  onClick={() => onOpenVenue(config.profile.slug)}
                >
                  <span>{config.profile.logoText}</span>
                  <div><small>{(config.profile.venueTypeLabel ?? 'Event venue').toUpperCase()}</small><strong>{config.profile.shortName}</strong><em>{config.profile.locationLabel}</em></div>
                  <b>›</b>
                </button>
              ))}
            </div>
            <button className="multi-venue-stack__next" onClick={() => onNavigate('for-venues')}><span>+</span><div><small>YOUR VENUE</small><strong>See {PLATFORM_NAME} for your property</strong><em>Your logo · colors · spaces · inventory · clients</em></div><b>›</b></button>
          </div>
        </div>
      </section>

      <section className="saas-proof-section shell" aria-label={`${PLATFORM_NAME} platform highlights`}>
        <div className="saas-proof-row">
          <div><strong>Venue-owned workflow</strong><span>Inventory, packages, spaces and events</span></div>
          <div><strong>Venue-based client portals</strong><span>Each event lives inside its booked venue</span></div>
          <div><strong>Reusable SaaS platform</strong><span>One product configured differently for every venue</span></div>
        </div>
      </section>

      <section className="section section--soft">
        <div className="shell">
          <div className="section-heading"><div><p className="eyebrow">WHAT THE PRODUCT DOES</p><h2>Replace scattered planning with a system the venue controls.</h2></div></div>
          <div className="feature-six-grid">
            <article><span>01</span><h3>Venue dashboard</h3><p>See upcoming events, clients, packages, dates, messages, selections and planning progress.</p></article>
            <article><span>02</span><h3>Digital inventory</h3><p>Turn décor, furniture, AV, props and venue resources into a searchable catalog with quantities and storage locations.</p></article>
            <article><span>03</span><h3>2D + AI visualization</h3><p>Build the overhead layout first, then use venue photos and the structured plan to create a realistic visual preview.</p></article>
            <article><span>04</span><h3>Private client portals</h3><p>Each client gets access only to their venue and their event workspace.</p></article>
            <article><span>05</span><h3>Calendar + milestones</h3><p>Protect booked dates and surface contract or payment milestones without replacing accounting software.</p></article>
            <article><span>06</span><h3>Venue-specific branding</h3><p>Each venue keeps its own identity, colors, website information, inventory names and customer-facing experience.</p></article>
          </div>
        </div>
      </section>

      <section className="section shell venue-comparison-section">
        <div className="section-heading"><div><p className="eyebrow">VENUE PORTALS</p><h2>One system, tailored to each property.</h2><p className="section-lead">Explore different venue experiences to see how branding, inventory, spaces, packages and client workspaces adapt without changing the core platform.</p></div></div>
        <div className="venue-comparison-grid">
          {venues.map((config) => <button key={config.profile.id} className="venue-comparison-card" style={{ '--card-primary': config.profile.brandPrimary, '--card-accent': config.profile.brandAccent } as CSSProperties} onClick={() => onOpenVenue(config.profile.slug)}><span>{config.profile.logoText}</span><div><small>{config.profile.venueTypeLabel ?? config.profile.locationLabel}</small><strong>{config.profile.shortName}</strong><p>{config.profile.tagline}</p></div><b>Explore →</b></button>)}
        </div>
      </section>

      <section className="cta-section shell saas-cta">
        <div><p className="eyebrow">FOR VENUES</p><h2>Build the portal around your property.</h2><p>Tell us about your branding, website, spaces, inventory, packages and workflow. {PLATFORM_NAME} can configure a venue experience around the way you already operate.</p></div>
        <button className="button button--light" onClick={() => onNavigate('for-venues')}>See {PLATFORM_NAME} for Your Venue</button>
      </section>
    </main>
  )
}
