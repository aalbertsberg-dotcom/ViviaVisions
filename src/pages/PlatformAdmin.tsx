import { useState } from 'react'
import type { PageKey } from '../components/Header'
import type { VenueConfig, VenueLead, WeddingWorkspace } from '../types'

const ADMIN_POC_CODE = '654321'
const companyModules = [
  { id: 'venues', title: 'Venue accounts', copy: 'Create, configure, suspend and review each venue using ViviaVisions.', defaultOn: true },
  { id: 'sales', title: 'Preview requests + sales', copy: 'Track venue inquiries, requested walkthroughs, follow-ups and onboarding status.', defaultOn: true },
  { id: 'billing', title: 'Plans + billing', copy: 'Future subscription plans, billing status, trials and account terms.', defaultOn: false },
  { id: 'support', title: 'Venue support', copy: 'See support requests, onboarding questions and venue account issues.', defaultOn: true },
  { id: 'branding', title: 'Brand + portal setup', copy: 'Manage venue logos, colors, portal settings, property spaces and templates.', defaultOn: true },
  { id: 'platform', title: 'Platform settings', copy: 'Company-level defaults, features, permissions and future integrations.', defaultOn: false },
]

type PlatformAdminProps = {
  authenticated: boolean
  onAuthenticate: (code: string) => boolean
  onLogout: () => void
  onNavigate: (page: PageKey) => void
  leads: VenueLead[]
  weddings: WeddingWorkspace[]
  venues: VenueConfig[]
  onOpenVenue: (slug: string) => void
}

export default function PlatformAdmin({ authenticated, onAuthenticate, onLogout, onNavigate, leads, weddings, venues, onOpenVenue }: PlatformAdminProps) {
  const [code, setCode] = useState(ADMIN_POC_CODE)
  const [error, setError] = useState('')
  const [moduleChoices, setModuleChoices] = useState<Record<string, boolean>>(() => {
    try { const saved = localStorage.getItem('venueVisions.poc.adminModules'); if (saved) return JSON.parse(saved) as Record<string, boolean> } catch { /* POC */ }
    return Object.fromEntries(companyModules.map((item) => [item.id, item.defaultOn]))
  })
  const [founderNotes, setFounderNotes] = useState(() => { try { return localStorage.getItem('venueVisions.poc.adminNotes') ?? '' } catch { return '' } })

  const toggleModule = (id: string) => setModuleChoices((current) => {
    const next = { ...current, [id]: !current[id] }
    try { localStorage.setItem('venueVisions.poc.adminModules', JSON.stringify(next)) } catch { /* POC */ }
    return next
  })
  const saveNotes = (value: string) => { setFounderNotes(value); try { localStorage.setItem('venueVisions.poc.adminNotes', value) } catch { /* POC */ } }

  if (!authenticated) return (
    <main className="owner-access-page shell"><section className="panel owner-access-card platform-access-card">
      <div className="owner-access-lock">VV</div><p className="eyebrow">VIVIAVISIONS ADMIN · PROOF OF CONCEPT</p><h1>Shape the company side of ViviaVisions.</h1>
      <p className="owner-access-lead">This internal proof of concept is for reviewing what ViviaVisions should need as a company: venue accounts, preview requests, onboarding, support, billing and platform settings. Venue customers would never see this area.</p>
      <form className="owner-access-form" onSubmit={(event) => { event.preventDefault(); if (!onAuthenticate(code)) setError('Incorrect proof-of-concept code.'); else setError('') }}><label htmlFor="admin-poc-code">Temporary POC code</label><input id="admin-poc-code" value={code} onChange={(event) => { setCode(event.target.value); setError('') }} /><small>Prefilled for review: <strong>{ADMIN_POC_CODE}</strong></small>{error && <div className="owner-access-error">{error}</div>}<button className="button button--primary full-width" type="submit">Enter VV Admin POC</button></form>
      <div className="owner-access-note"><strong>Proof of concept only.</strong> Nothing here represents a finalized company workflow, pricing model, security design or billing system.</div>
    </section></main>
  )

  const totalSelected = weddings.reduce((sum, wedding) => sum + wedding.selections.reduce((sub, item) => sub + item.quantity, 0), 0)
  const enabledCount = companyModules.filter((item) => moduleChoices[item.id]).length
  const totalInventory = venues.reduce((sum, venue) => sum + venue.inventory.length, 0)

  return (
    <main className="page-main shell platform-page">
      <section className="page-intro page-intro--split admin-intro"><div><p className="eyebrow">VIVIAVISIONS ADMIN · PROOF OF CONCEPT</p><h1>What should ViviaVisions need to run the company?</h1><p>This is an internal concept for the founders to review. It now shows two separate venue profiles so the tenant model is easier to evaluate.</p></div><div className="owner-session-actions"><span className="prototype-badge prototype-badge--large">Admin POC</span><button className="text-link" onClick={onLogout}>Exit POC</button></div></section>

      <section className="panel poc-decision-panel"><div className="panel__heading"><div><p className="eyebrow">FOUNDER REVIEW BOARD</p><h2>Choose what belongs in the company admin.</h2><p>Toggle the concepts that feel useful. These choices and notes save only in this browser.</p></div><span className="poc-count">{enabledCount}/{companyModules.length} selected</span></div><div className="poc-module-grid">{companyModules.map((item) => { const enabled = Boolean(moduleChoices[item.id]); return <button type="button" key={item.id} className={enabled ? 'poc-module-card poc-module-card--selected' : 'poc-module-card'} onClick={() => toggleModule(item.id)}><span className="poc-module-card__state">{enabled ? 'KEEP IN POC' : 'CONSIDER LATER'}</span><strong>{item.title}</strong><p>{item.copy}</p><b>{enabled ? '✓ Included' : '+ Add concept'}</b></button> })}</div><label className="poc-notes"><span>Founder notes</span><textarea value={founderNotes} onChange={(event) => saveNotes(event.target.value)} placeholder="What should VV add, remove or change on the company side?" /></label></section>

      <section className="metric-grid platform-metrics">
        <article><span>Venue profiles</span><strong>{venues.length}</strong><small>1 configured + 1 sample</small></article>
        <article><span>Event workspaces</span><strong>{weddings.length}</strong><small>kept separate by venue</small></article>
        <article><span>Venue requests</span><strong>{leads.length}</strong><small>saved in this browser</small></article>
        <article><span>Inventory styles</span><strong>{totalInventory}</strong><small>across both venue profiles</small></article>
      </section>

      <section className="panel platform-tenant-panel"><div className="panel__heading"><div><p className="eyebrow">VENUE ACCOUNTS · PROOF OF CONCEPT</p><h2>Three venues, three different customer experiences.</h2><p>The platform owns the common workflow while branding, spaces, packages, inventory, events and clients stay scoped to each venue.</p></div><button className="button button--primary button--small" onClick={() => onNavigate('for-venues')}>Open venue request form</button></div>
        <div className="platform-venue-grid">{venues.map((config) => { const venueWeddings = weddings.filter((wedding) => wedding.venueId === config.profile.id); return (
          <article className="platform-venue-card" key={config.profile.id} style={{ borderTopColor: config.profile.brandAccent }}>
            <div className="platform-venue-card__brand"><div className="venue-brand-mark venue-brand-mark--small" style={{ background: config.profile.brandPrimary, color: '#fff' }}>{config.profile.logoText}</div><div><span>{config.profile.isSample ? 'SAMPLE VENUE' : 'CONFIGURED PREVIEW'}</span><h3>{config.profile.shortName}</h3><p>{config.profile.locationLabel || config.profile.address}</p></div></div>
            <div className="platform-venue-card__stats"><span><strong>{venueWeddings.length}</strong>{config.profile.eventPluralLabel ?? 'events'}</span><span><strong>{config.inventory.length}</strong>inventory styles</span><span><strong>{config.packages.length}</strong>packages</span><span><strong>{config.areas.length}</strong>spaces</span></div>
            <div className="platform-venue-card__actions"><button className="button button--primary button--small" onClick={() => onOpenVenue(config.profile.slug)}>Open venue</button></div>
          </article>
        ) })}</div>
      </section>

      <section className="panel platform-leads-panel"><div className="panel__heading"><div><p className="eyebrow">VENUE REQUESTS · PROOF OF CONCEPT</p><h2>How new venues could enter the VV pipeline.</h2><p>The public For Venues form feeds this browser-only queue so the founders can review useful intake information before building the real back office.</p></div></div>{leads.length === 0 ? <div className="empty-state"><h3>No venue requests yet.</h3><p>Submit the For Venues form to see how a new venue could appear inside the company admin.</p><button className="button button--ghost" onClick={() => onNavigate('for-venues')}>Open venue request form</button></div> : <div className="lead-list">{leads.map((lead) => <article key={lead.id} className="lead-card"><div className="lead-card__brand" style={{ background: lead.brandPrimary, color: '#fff' }}>{lead.logoDataUrl ? <img src={lead.logoDataUrl} alt="" /> : lead.venueName.slice(0, 2).toUpperCase()}</div><div className="lead-card__main"><span>{new Date(lead.submittedAt).toLocaleString()}</span><h3>{lead.venueName}</h3><p>{lead.contactName} · {lead.email}</p><div>{lead.needs.map((need) => <b key={need}>{need}</b>)}</div></div><div className="lead-card__meta"><span>{lead.eventSpaces} spaces</span><span>{lead.weddingsPerMonth} events/mo</span><span>{lead.inventorySize}</span></div></article>)}</div>}</section>

      <section className="panel platform-architecture"><div><p className="eyebrow">COMPANY MODEL · PROOF OF CONCEPT</p><h2>ViviaVisions remains the product.</h2><p>Each venue receives a configured account and branded portal; its clients receive private event workspaces inside that venue.</p></div><div className="architecture-tree"><strong>ViviaVisions</strong><span>Company-owned platform</span><i>↓</i><strong>Venue accounts</strong><span>{venues.map((v) => v.profile.shortName).join(' · ')}</span><i>↓</i><div><b>Venue A clients</b><b>Venue B clients</b><b>Venue C clients</b></div></div></section>
    </main>
  )
}
