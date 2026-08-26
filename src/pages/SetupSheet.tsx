import { packageById, venueConfigById } from '../data'
import type { WeddingWorkspace } from '../types'

type SetupSheetProps = { venueId: string; wedding: WeddingWorkspace }
function formatDate(value: string) { return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) }

export default function SetupSheet({ venueId, wedding }: SetupSheetProps) {
  const config = venueConfigById(venueId)
  const venue = config.profile
  const eventLabel = venue.eventLabel ?? 'event'
  const clientLabel = venue.clientLabel ?? 'client'
  const isWedding = eventLabel === 'wedding'
  const pkg = packageById(wedding.profile.packageId, venueId)
  const selections = wedding.selections.map((selection) => ({ ...selection, item: config.inventory.find((item) => item.id === selection.itemId) })).filter((entry) => entry.item)
  const storage = selections.reduce<Record<string, typeof selections>>((groups, entry) => { const key = entry.item!.storage; (groups[key] ||= []).push(entry); return groups }, {})
  const defaultAreaId = wedding.profile.receptionArea || config.areas.find((area) => area.kind === 'Reception')?.id || config.areas[0]?.id || ''
  const areaCounts = config.areas.map((area) => ({ area, count: wedding.placedItems.filter((item) => (item.areaId || defaultAreaId) === area.id).length })).filter((entry) => entry.count > 0)
  const primaryArea = config.areas.find((a) => a.id === wedding.profile.receptionArea)?.name || 'Not selected'
  const secondaryArea = config.areas.find((a) => a.id === wedding.profile.ceremonyArea)?.name || 'Not selected'
  return (
    <main className="page-main shell setup-sheet-page">
      <section className="setup-sheet-toolbar no-print"><div><p className="eyebrow">{venue.shortName.toUpperCase()} · SETUP SHEET</p><h1>Final handoff.</h1><p>Print or save this planning summary after the {clientLabel}'s selections and layouts are finalized.</p></div><button className="button button--primary" onClick={() => window.print()}>Print / Save PDF</button></section>
      <section className="setup-sheet paper-sheet">
        <header className="paper-sheet__header"><div className="venue-brand-mark venue-brand-mark--paper" style={{ background: venue.brandPrimary, color: '#fff' }}>{venue.logoText}</div><div><span>{venue.shortName.toUpperCase()} · POWERED BY VIVIAVISIONS</span><h2>{wedding.profile.couple}</h2><p>{formatDate(wedding.profile.date)} · {pkg.name} · {wedding.profile.guests} guests</p></div></header>
        <div className="paper-summary-grid"><article><span>{isWedding?'Ceremony':'Arrival / pre-function'}</span><strong>{secondaryArea}</strong></article><article><span>{isWedding?'Reception':'Primary event space'}</span><strong>{primaryArea}</strong></article><article><span>Selected resources</span><strong>{wedding.selections.reduce((sum, item) => sum + item.quantity, 0)}</strong></article><article><span>Planning status</span><strong>{wedding.status}</strong></article></div>
        <section className="paper-block"><h3>{venue.inventoryLabel || 'Venue inventory'} pull list</h3>{selections.length ? <table><thead><tr><th>Item</th><th>Qty</th><th>Storage</th></tr></thead><tbody>{selections.map((entry) => <tr key={entry.itemId}><td>{entry.item!.name}</td><td>{entry.quantity}</td><td>{entry.item!.storage}</td></tr>)}</tbody></table> : <p>No resources selected.</p>}</section>
        <section className="paper-block"><h3>Pull by storage location</h3>{Object.entries(storage).length ? Object.entries(storage).map(([location, entries]) => <div className="storage-pull-group" key={location}><strong>{location}</strong><span>{entries.map((entry) => `${entry.quantity} × ${entry.item!.name}`).join(' · ')}</span></div>) : <p>Nothing to pull yet.</p>}</section>
        <section className="paper-block"><h3>Venue layouts</h3>{areaCounts.length ? <div className="paper-area-grid">{areaCounts.map(({ area, count }) => <article key={area.id}><strong>{area.name}</strong><span>{count} placed objects</span></article>)}</div> : <p>No floor-plan objects placed yet.</p>}</section>
        <section className="paper-block"><h3>{clientLabel[0].toUpperCase() + clientLabel.slice(1)} notes</h3><p>{wedding.profile.notes || 'No notes added.'}</p></section>
        <footer className="paper-sheet__footer"><span>Generated with ViviaVisions.</span><span>{venue.isSample ? `Showcase ${eventLabel} data.` : 'Chandelier Oaks setup sheet · final quantities and placement confirmed by venue team.'}</span></footer>
      </section>
    </main>
  )
}
