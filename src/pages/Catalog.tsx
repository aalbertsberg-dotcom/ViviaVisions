import { useEffect, useMemo, useState } from 'react'
import DecorVisual from '../components/DecorVisual'
import { itemAllowedForTier, tierLabel, venueConfigById } from '../data'
import type { Category, PackageTier, Selection } from '../types'
import { PLATFORM_NAME } from '../config/platform'
import type { PageKey } from '../components/Header'

const categories: Array<'All' | Category> = ['All', 'Furniture', 'Arches', 'Backdrops', 'Lighting', 'Florals', 'Linens', 'Centerpieces', 'Signs', 'Specialty', 'Ceremony', 'Miscellaneous']

type CatalogProps = {
  venueId: string
  selections: Selection[]
  onSetQuantity: (itemId: string, quantity: number) => void
  canEdit: boolean
  onRequireAccess: () => void
  packageTier: PackageTier
  packageName: string
  onNavigate: (page: PageKey) => void
}

export default function Catalog({ venueId, selections, onSetQuantity, canEdit, onRequireAccess, packageTier, packageName, onNavigate }: CatalogProps) {
  const config = venueConfigById(venueId)
  const { profile: venue, inventory } = config
  const eventLabel = venue.eventLabel ?? 'event'
  const isWedding = eventLabel === 'wedding'
  const inventoryName = venue.inventoryLabel ?? 'Venue Inventory'
  const isChandelier = venue.id === 'venue-chandelier-oaks'
  const [category, setCategory] = useState<'All' | Category>('All')
  const [query, setQuery] = useState('')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [showOnlyIncluded, setShowOnlyIncluded] = useState(false)

  useEffect(() => {
    const focused = localStorage.getItem('venueVisions.catalogFocus')
    if (!focused || !inventory.some((item) => item.id === focused)) return
    setCategory('All'); setQuery(''); setDetailId(focused); localStorage.removeItem('venueVisions.catalogFocus')
  }, [])

  const filtered = useMemo(() => inventory.filter((item) => {
    const categoryMatch = category === 'All' || item.category === category
    const includedMatch = !showOnlyIncluded || itemAllowedForTier(item, packageTier)
    const q = query.trim().toLowerCase()
    const searchMatch = !q || [item.name, item.category, item.color, item.description].some((value) => value.toLowerCase().includes(q))
    return categoryMatch && includedMatch && searchMatch
  }), [category, query, showOnlyIncluded, packageTier])

  const selectedQuantity = (itemId: string) => selections.find((item) => item.itemId === itemId)?.quantity ?? 0
  const detail = inventory.find((item) => item.id === detailId)
  const totalSelected = selections.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <main className="page-main shell catalog-page pinrose-page">
      <section className="page-intro page-intro--split">
        <div>
          <p className="eyebrow">{venue.shortName.toUpperCase()} · {inventoryName.toUpperCase()}</p>
          <h1>Browse the venue's resources before setup day.</h1>
          <p>{venue.id === 'venue-chandelier-oaks' ? `Chandelier Oaks publicly describes its Pinrose Prop Shop as including antique furniture, arches, arbors, French doors, champagne walls, swing beds, chandeliers and more. ${PLATFORM_NAME} turns that collection into a searchable planning library.` : venue.id === 'venue-foundry-rivergate' ? 'The Foundry uses an Event Resource Library to show how furniture, AV, staging, lighting and operational resources can live in the same planning workflow.' : `Juniper & Stone uses a modern Design Library to show how a completely different inventory style and brand can use the same ${PLATFORM_NAME} tools.`}</p>
          <div className="sample-data-note"><strong>{venue.isSample ? 'Showcase inventory' : 'Initial venue catalog'}</strong><span>{venue.isSample ? 'This venue and its inventory are fictional examples created to show multi-venue customization.' : 'Pinrose Prop Shop item types are configured from Chandelier Oaks public information. Working quantities, dimensions, storage locations and exact package access should be finalized during the venue inventory pass.'}</span></div>
          {!canEdit && <div className="catalog-access-note"><strong>{isChandelier ? 'Public catalog view.' : 'Public browsing preview.'}</strong><span>Enter an {eventLabel} workspace to make selections.</span><button className="text-link" onClick={onRequireAccess}>{eventLabel[0].toUpperCase() + eventLabel.slice(1)} access →</button></div>}
        </div>
        <div className="selection-summary pinrose-tier-summary"><span className="mini-label">ACTIVE PACKAGE</span><strong>{tierLabel[packageTier]}</strong><span>{packageName}</span><small>{selections.reduce((sum, item) => sum + item.quantity, 0)} pieces selected</small></div>
      </section>

      <section className="catalog-toolbar">
        <div className="search-box"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/></svg><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${inventoryName}…`} /></div>
        <label className="included-toggle"><input type="checkbox" checked={showOnlyIncluded} onChange={(e) => setShowOnlyIncluded(e.target.checked)} /><span>Show only included in active package</span></label>
        <div className="filter-row" aria-label="Inventory categories">{categories.map((item) => <button key={item} className={category === item ? 'filter-pill active' : 'filter-pill'} onClick={() => setCategory(item)}>{item}</button>)}</div>
      </section>

      <div className="catalog-grid">
        {filtered.map((item) => {
          const qty = selectedQuantity(item.id)
          const allowed = itemAllowedForTier(item, packageTier)
          return (
            <article className={allowed ? 'catalog-card' : 'catalog-card catalog-card--locked'} key={item.id}>
              <button className="catalog-card__image-button" onClick={() => setDetailId(item.id)}>{item.imageUrl ? <img className="catalog-card__real-image" src={item.imageUrl} alt={item.name} /> : <DecorVisual styleName={item.imageStyle} name={item.name} />}</button>
              <div className="catalog-card__body">
                <div className="catalog-card__meta"><span>{item.category}</span><span>{isChandelier ? `${item.quantity} working qty` : `${item.quantity} demo qty`}</span></div>
                <h3><button onClick={() => setDetailId(item.id)}>{item.name}</button></h3>
                <p className="catalog-card__color">{item.color} · {item.dimensions}</p>
                <div className={allowed ? 'tier-chip tier-chip--included' : 'tier-chip'}>{allowed ? '✓ Included in this package' : `Tier ${item.accessTier} access`}</div>
                {!canEdit ? <button className="button button--small button--ghost full-width" onClick={onRequireAccess}>Sign in to select</button> : !allowed ? <button className="button button--small button--ghost full-width" disabled>Not included in this package</button> : qty === 0 ? <button className="button button--small button--primary full-width" onClick={() => onSetQuantity(item.id, 1)}>Add to my {eventLabel}</button> : <div className="quantity-control"><button aria-label={`Remove one ${item.name}`} onClick={() => onSetQuantity(item.id, qty - 1)}>−</button><span><strong>{qty}</strong><small>selected</small></span><button aria-label={`Add one ${item.name}`} disabled={qty >= item.quantity} onClick={() => onSetQuantity(item.id, qty + 1)}>+</button></div>}
              </div>
            </article>
          )
        })}
      </div>

      {filtered.length === 0 && <div className="empty-state"><h3>No resources matched that filter.</h3><p>Try another category or turn off the package-only filter.</p></div>}

      {canEdit && <section className="planning-next-step panel">
        <div>
          <span className="mini-label">STEP 1 · SELECT INVENTORY</span>
          <h2>{totalSelected ? 'Next, place your selections in the layout.' : 'Choose the resources you want to use.'}</h2>
          <p>{totalSelected ? `You have ${totalSelected} ${totalSelected === 1 ? 'piece' : 'pieces'} selected. The 2D Designer uses those choices while you arrange tables, chairs and venue resources.` : `Select the décor and resources for this ${eventLabel} first. Then build the room layout around those choices.`}</p>
        </div>
        <div className="planning-next-step__actions">
          <button className="button button--primary" onClick={() => onNavigate('planner')} disabled={totalSelected === 0}>
            {totalSelected ? 'Next: Build your layout' : 'Select inventory to continue'}
          </button>
        </div>
      </section>}

      {detail && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setDetailId(null)}>
          <section className="detail-modal" role="dialog" aria-modal="true" aria-label={detail.name} onMouseDown={(event) => event.stopPropagation()}>
            <button className="detail-modal__close" onClick={() => setDetailId(null)}>×</button>
            {detail.imageUrl ? <img className="detail-modal__real-image" src={detail.imageUrl} alt={detail.name} /> : <DecorVisual styleName={detail.imageStyle} name={detail.name} large />}
            <div className="detail-modal__body"><span className="mini-label">{detail.category}</span><h2>{detail.name}</h2><p>{detail.description}</p><dl><div><dt>Color</dt><dd>{detail.color}</dd></div><div><dt>{isChandelier ? 'Working quantity' : 'Quantity'}</dt><dd>{detail.quantity}</dd></div><div><dt>Storage</dt><dd>{detail.storage}</dd></div><div><dt>Package access</dt><dd>{tierLabel[detail.accessTier]}</dd></div></dl>{detail.packageNote && <div className="sample-data-note"><strong>{venue.isSample ? 'Sample configuration' : 'Inventory onboarding field'}</strong><span>{detail.packageNote}</span></div>}</div>
          </section>
        </div>
      )}
    </main>
  )
}
