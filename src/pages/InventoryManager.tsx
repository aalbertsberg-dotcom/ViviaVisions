import { useEffect, useMemo, useRef, useState } from 'react'
import type { Category, VenueConfig } from '../types'
import {
  archiveManagedInventoryItem,
  listManagedInventory,
  refreshRuntimeVenueConfig,
  restoreManagedInventoryItem,
  saveManagedInventoryItem,
  uploadManagedInventoryImage,
  type ManagedInventoryInput,
  type ManagedInventoryItem,
} from '../lib/repositories/contentAdmin'

const categories: Category[] = [
  'Furniture',
  'Arches',
  'Backdrops',
  'Lighting',
  'Florals',
  'Linens',
  'Centerpieces',
  'Signs',
  'Specialty',
  'Ceremony',
  'Miscellaneous',
]

type InventoryManagerProps = {
  venues: VenueConfig[]
  initialVenueId: string
  platformMode: boolean
  onBack: () => void
}

function blankItem(): ManagedInventoryInput {
  return {
    externalKey: '',
    name: '',
    category: 'Miscellaneous',
    color: '',
    quantity: 1,
    dimensions: '',
    storageLocation: '',
    description: '',
    featured: false,
    accessTier: 1,
    packageNote: '',
    imageUrl: '',
    isPublic: true,
    isActive: true,
  }
}

function configRows(config: VenueConfig): ManagedInventoryItem[] {
  return config.inventory.map((item) => ({
    id: item.id,
    externalKey: item.id,
    name: item.name,
    category: item.category,
    color: item.color,
    quantity: item.quantity,
    dimensions: item.dimensions,
    storageLocation: item.storage,
    description: item.description,
    featured: Boolean(item.featured),
    accessTier: item.accessTier,
    packageNote: item.packageNote ?? '',
    imageUrl: item.imageUrl ?? '',
    isPublic: true,
    isActive: true,
  }))
}

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    const next = text[index + 1]

    if (char === '"' && quoted && next === '"') {
      cell += '"'
      index += 1
      continue
    }

    if (char === '"') {
      quoted = !quoted
      continue
    }

    if (char === ',' && !quoted) {
      row.push(cell.trim())
      cell = ''
      continue
    }

    if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1
      row.push(cell.trim())
      if (row.some(Boolean)) rows.push(row)
      row = []
      cell = ''
      continue
    }

    cell += char
  }

  row.push(cell.trim())
  if (row.some(Boolean)) rows.push(row)
  return rows
}

function parseBool(value: string, fallback = false) {
  if (!value) return fallback
  return ['1', 'true', 'yes', 'y'].includes(value.trim().toLowerCase())
}

function clampTier(value: string) {
  const numeric = Number(value)
  if (numeric >= 3) return 3 as const
  if (numeric >= 2) return 2 as const
  return 1 as const
}

export default function InventoryManager({ venues, initialVenueId, platformMode, onBack }: InventoryManagerProps) {
  const [selectedVenueId, setSelectedVenueId] = useState(initialVenueId)
  const [rows, setRows] = useState<ManagedInventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<'All' | Category>('All')
  const [view, setView] = useState<'active' | 'archived'>('active')
  const [draft, setDraft] = useState<ManagedInventoryInput | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const csvInputRef = useRef<HTMLInputElement>(null)

  const selectedVenue = venues.find((venue) => venue.profile.id === selectedVenueId) ?? venues[0]
  const canEdit = Boolean(selectedVenue && !selectedVenue.profile.isSample)

  const load = async () => {
    if (!selectedVenue) return
    setLoading(true)
    setError('')
    try {
      const next = selectedVenue.profile.isSample
        ? configRows(selectedVenue)
        : await listManagedInventory(selectedVenue.profile.slug, true)
      setRows(next)
    } catch (loadError) {
      setRows([])
      setError(loadError instanceof Error ? loadError.message : 'Unable to load inventory.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setDraft(null)
    setImageFile(null)
    setQuery('')
    setCategory('All')
    setView('active')
    void load()
  }, [selectedVenueId])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((item) => {
      const statusMatch = view === 'active' ? item.isActive : !item.isActive
      const categoryMatch = category === 'All' || item.category === category
      const queryMatch = !q || [
        item.name,
        item.category,
        item.color,
        item.storageLocation,
        item.description,
      ].some((value) => value.toLowerCase().includes(q))
      return statusMatch && categoryMatch && queryMatch
    })
  }, [rows, category, query, view])

  const saveDraft = async () => {
    if (!draft || !selectedVenue || !canEdit) return
    setBusy(true)
    setError('')
    setStatus('')

    try {
      let saved = await saveManagedInventoryItem(selectedVenue.profile.slug, draft)
      if (imageFile) {
        const imageUrl = await uploadManagedInventoryImage(selectedVenue.profile.slug, saved.id, imageFile)
        saved = { ...saved, imageUrl }
      }

      await refreshRuntimeVenueConfig(selectedVenue.profile.slug)
      await load()
      setDraft(null)
      setImageFile(null)
      setStatus(`${saved.name} saved.`)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save inventory.')
    } finally {
      setBusy(false)
    }
  }

  const archiveItem = async (item: ManagedInventoryItem) => {
    if (!canEdit || !selectedVenue) return
    if (!window.confirm(`Archive ${item.name}? Existing event history is preserved, but the item will no longer appear in active inventory.`)) return

    setBusy(true)
    setError('')
    setStatus('')
    try {
      await archiveManagedInventoryItem(item.id)
      await refreshRuntimeVenueConfig(selectedVenue.profile.slug)
      await load()
      setStatus(`${item.name} archived.`)
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : 'Unable to archive inventory.')
    } finally {
      setBusy(false)
    }
  }

  const restoreItem = async (item: ManagedInventoryItem) => {
    if (!canEdit || !selectedVenue) return

    setBusy(true)
    setError('')
    setStatus('')
    try {
      await restoreManagedInventoryItem(item.id)
      await refreshRuntimeVenueConfig(selectedVenue.profile.slug)
      await load()
      setStatus(`${item.name} restored to active inventory.`)
    } catch (restoreError) {
      setError(restoreError instanceof Error ? restoreError.message : 'Unable to restore inventory.')
    } finally {
      setBusy(false)
    }
  }

  const importCsv = async (file: File) => {
    if (!selectedVenue || !canEdit) return
    setBusy(true)
    setError('')
    setStatus('')

    try {
      const matrix = parseCsv(await file.text())
      if (matrix.length < 2) throw new Error('CSV must include a header row and at least one inventory row.')

      const headers = matrix[0].map(normalizeHeader)
      const indexOf = (...names: string[]) => headers.findIndex((header) => names.includes(header))
      const value = (row: string[], ...names: string[]) => {
        const index = indexOf(...names)
        return index >= 0 ? row[index] ?? '' : ''
      }

      let imported = 0
      for (const row of matrix.slice(1)) {
        const name = value(row, 'name', 'item', 'itemname').trim()
        if (!name) continue

        const categoryValue = value(row, 'category') as Category
        const input: ManagedInventoryInput = {
          ...blankItem(),
          externalKey: value(row, 'externalkey', 'id', 'key'),
          name,
          category: categories.includes(categoryValue) ? categoryValue : 'Miscellaneous',
          color: value(row, 'color'),
          quantity: Math.max(0, Number(value(row, 'quantity', 'qty')) || 0),
          dimensions: value(row, 'dimensions', 'size'),
          storageLocation: value(row, 'storage', 'storagelocation', 'location'),
          description: value(row, 'description', 'notes'),
          featured: parseBool(value(row, 'featured')),
          accessTier: clampTier(value(row, 'accesstier', 'tier', 'packagetier')),
          packageNote: value(row, 'packagenote'),
          isPublic: value(row, 'ispublic', 'public') ? parseBool(value(row, 'ispublic', 'public'), true) : true,
        }

        await saveManagedInventoryItem(selectedVenue.profile.slug, input)
        imported += 1
      }

      await refreshRuntimeVenueConfig(selectedVenue.profile.slug)
      await load()
      setStatus(`${imported} inventory item${imported === 1 ? '' : 's'} imported.`)
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'Unable to import CSV.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="page-main shell content-manager-page">
      <section className="page-intro page-intro--split content-manager-heading">
        <div>
          <p className="eyebrow">{platformMode ? 'VIVIAVISIONS ADMIN · INVENTORY' : `${selectedVenue?.profile.shortName.toUpperCase()} · INVENTORY ADMIN`}</p>
          <h1>{platformMode ? 'Inventory across every venue.' : `Manage ${selectedVenue?.profile.inventoryLabel ?? 'venue inventory'}.`}</h1>
          <p>Add, edit, archive, photograph and bulk-import venue inventory without touching Supabase directly.</p>
        </div>
        <div className="content-manager-heading__actions">
          <button className="button button--ghost" onClick={onBack}>Back</button>
          {canEdit && <button className="button button--primary" onClick={() => { setDraft(blankItem()); setImageFile(null); setError(''); setStatus('') }}>+ Add inventory item</button>}
        </div>
      </section>

      {platformMode && (
        <section className="venue-switch-grid">
          {venues.map((venue) => (
            <button
              type="button"
              className={selectedVenueId === venue.profile.id ? 'venue-switch-card active' : 'venue-switch-card'}
              key={venue.profile.id}
              onClick={() => setSelectedVenueId(venue.profile.id)}
            >
              <span className="venue-switch-card__mark" style={{ background: venue.profile.brandPrimary, color: '#fff' }}>{venue.profile.logoText}</span>
              <span><strong>{venue.profile.shortName}</strong><small>{venue.profile.isSample ? 'Demo venue' : 'Live venue'} · {venue.inventory.length} loaded</small></span>
            </button>
          ))}
        </section>
      )}

      {!canEdit && (
        <section className="panel content-manager-note">
          <strong>Showcase inventory</strong>
          <p>This venue is still a demo configuration. Its inventory is visible here, but database editing activates automatically once the venue is onboarded as a live Supabase tenant.</p>
        </section>
      )}

      <section className="panel inventory-manager-panel">
        <div className="inventory-manager-status-tabs" role="tablist" aria-label="Inventory status">
          <button type="button" className={view === 'active' ? 'active' : ''} onClick={() => setView('active')}>
            Active <b>{rows.filter((item) => item.isActive).length}</b>
          </button>
          <button type="button" className={view === 'archived' ? 'active' : ''} onClick={() => setView('archived')} disabled={!canEdit}>
            Archived <b>{rows.filter((item) => !item.isActive).length}</b>
          </button>
        </div>
        <div className="inventory-manager-toolbar">
          <div className="search-box">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search inventory…" />
          </div>
          <select value={category} onChange={(event) => setCategory(event.target.value as 'All' | Category)}>
            <option value="All">All categories</option>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          {canEdit && (
            <>
              <button className="button button--ghost button--small" disabled={busy} onClick={() => csvInputRef.current?.click()}>Import CSV</button>
              <input
                ref={csvInputRef}
                className="visually-hidden"
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  event.target.value = ''
                  if (file) void importCsv(file)
                }}
              />
            </>
          )}
          <span className="inventory-manager-count">{filtered.length} item{filtered.length === 1 ? '' : 's'}</span>
        </div>

        {status && <div className="client-auth-status" role="status">{status}</div>}
        {error && <div className="owner-access-error" role="alert">{error}</div>}
        {loading && <div className="content-manager-loading">Loading inventory…</div>}

        {!loading && (
          <div className="inventory-admin-grid">
            {filtered.map((item) => (
              <article className="inventory-admin-card" key={item.id}>
                <div className="inventory-admin-card__image">
                  {item.imageUrl ? <img src={item.imageUrl} alt={item.name} /> : <span>{item.name.slice(0, 2).toUpperCase()}</span>}
                  {item.featured && <b>FEATURED</b>}
                </div>
                <div className="inventory-admin-card__body">
                  <span className="mini-label">{item.category} · TIER {item.accessTier}</span>
                  <h3>{item.name}</h3>
                  <p>{item.color || 'No color'} · {item.dimensions || 'Dimensions not entered'}</p>
                  <div className="inventory-admin-card__stats">
                    <span><strong>{item.quantity}</strong><small>Quantity</small></span>
                    <span><strong>{item.storageLocation || '—'}</strong><small>Storage</small></span>
                  </div>
                  <div className="inventory-admin-card__actions">
                    {canEdit ? item.isActive ? (
                      <>
                        <button className="button button--primary button--small" disabled={busy} onClick={() => { setDraft({ ...item }); setImageFile(null); setError(''); setStatus('') }}>Edit</button>
                        <button className="text-link manage-action-danger" disabled={busy} onClick={() => { void archiveItem(item) }}>Archive</button>
                      </>
                    ) : (
                      <button className="button button--primary button--small" disabled={busy} onClick={() => { void restoreItem(item) }}>Restore</button>
                    ) : <span className="status-pill">Read only</span>}
                  </div>
                </div>
              </article>
            ))}
            {!filtered.length && <div className="empty-state"><h3>{view === 'archived' ? 'No archived inventory.' : 'No inventory matched.'}</h3><p>{view === 'archived' ? 'Archived items will appear here with their existing photo and can be restored.' : 'Try a different search or category.'}</p></div>}
          </div>
        )}
      </section>

      {draft && canEdit && (
        <div className="content-editor-backdrop" role="presentation" onMouseDown={() => !busy && setDraft(null)}>
          <section className="content-editor-modal" role="dialog" aria-modal="true" aria-label={draft.id ? `Edit ${draft.name}` : 'Add inventory item'} onMouseDown={(event) => event.stopPropagation()}>
            <div className="content-editor-modal__heading">
              <div><span className="mini-label">INVENTORY RECORD</span><h2>{draft.id ? 'Edit inventory item' : 'Add inventory item'}</h2></div>
              <button type="button" onClick={() => setDraft(null)} disabled={busy}>×</button>
            </div>

            <div className="form-grid two-col">
              <label><span>Name</span><input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
              <label><span>Category</span><select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value as Category })}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label><span>Color / finish</span><input value={draft.color} onChange={(event) => setDraft({ ...draft, color: event.target.value })} /></label>
              <label><span>Quantity</span><input type="number" min="0" value={draft.quantity} onChange={(event) => setDraft({ ...draft, quantity: Number(event.target.value) || 0 })} /></label>
              <label><span>Dimensions</span><input value={draft.dimensions} onChange={(event) => setDraft({ ...draft, dimensions: event.target.value })} /></label>
              <label><span>Storage location</span><input value={draft.storageLocation} onChange={(event) => setDraft({ ...draft, storageLocation: event.target.value })} /></label>
              <label><span>Package tier</span><select value={draft.accessTier} onChange={(event) => setDraft({ ...draft, accessTier: Number(event.target.value) as 1 | 2 | 3 })}><option value={1}>1 · Core</option><option value={2}>2 · Premium</option><option value={3}>3 · Top tier</option></select></label>
              <label><span>Inventory photo</span><input type="file" accept="image/*" onChange={(event) => setImageFile(event.target.files?.[0] ?? null)} /></label>
            </div>

            <label className="notes-field"><span>Description</span><textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label>
            <label className="notes-field"><span>Package note</span><textarea value={draft.packageNote} onChange={(event) => setDraft({ ...draft, packageNote: event.target.value })} /></label>

            <div className="content-editor-checks">
              <label><input type="checkbox" checked={draft.featured} onChange={(event) => setDraft({ ...draft, featured: event.target.checked })} /><span>Featured item</span></label>
              <label><input type="checkbox" checked={draft.isPublic} onChange={(event) => setDraft({ ...draft, isPublic: event.target.checked })} /><span>Visible in public catalog</span></label>
            </div>

            {imageFile && <div className="content-editor-file">New photo: <strong>{imageFile.name}</strong></div>}
            {error && <div className="owner-access-error" role="alert">{error}</div>}

            <div className="content-editor-modal__actions">
              <button className="button button--ghost" type="button" onClick={() => setDraft(null)} disabled={busy}>Cancel</button>
              <button className="button button--primary" type="button" onClick={() => { void saveDraft() }} disabled={busy || !draft.name.trim()}>{busy ? 'Saving…' : 'Save inventory item'}</button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}