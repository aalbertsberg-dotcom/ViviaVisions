import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { venueConfigById } from '../data'
import { deleteMediaAsset, formatMediaBytes, listMediaAssets, mediaTypeForFile, saveMediaAsset, updateMediaMetadata } from '../mediaStore'
import type { MediaAssetRecord, MediaPurpose, MediaScope } from '../types'
import type { PageKey } from '../components/Header'

const MAX_DEMO_FILE_SIZE = 50 * 1024 * 1024

function AssetPreview({ asset }: { asset: MediaAssetRecord }) {
  const [url, setUrl] = useState('')
  useEffect(() => {
    const next = URL.createObjectURL(asset.blob)
    setUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [asset])
  if (!url) return <div className="media-card__preview media-card__preview--loading" />
  if (asset.mediaType === 'image') return <div className="media-card__preview"><img src={url} alt={asset.name} /></div>
  if (asset.mediaType === 'video') return <div className="media-card__preview"><video src={url} controls preload="metadata" /></div>
  return <div className="media-card__preview media-card__preview--document"><span>FILE</span><strong>{asset.name.split('.').pop()?.toUpperCase() || 'DOC'}</strong></div>
}

type MediaLibraryProps = {
  venueId: string
  weddingId: string
  weddingName: string
  ownerMode: boolean
  onNavigate: (page: PageKey) => void
}

export default function MediaLibrary({ venueId, weddingId, weddingName, ownerMode, onNavigate }: MediaLibraryProps) {
  const config = venueConfigById(venueId)
  const { profile: venue, inventory, areas: venueAreas } = config
  const eventLabel = venue.eventLabel ?? 'event'
  const isChandelier = venue.id === 'venue-chandelier-oaks'
  const [assets, setAssets] = useState<MediaAssetRecord[]>([])
  const [scope, setScope] = useState<MediaScope>(ownerMode ? 'venue' : 'wedding')
  const [areaId, setAreaId] = useState('')
  const [purpose, setPurpose] = useState<MediaPurpose>(ownerMode ? 'venue-reference' : 'inspiration')
  const [inventoryItemId, setInventoryItemId] = useState('')
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const refresh = async () => setAssets(await listMediaAssets())
  useEffect(() => { refresh() }, [])
  useEffect(() => { if (!ownerMode) setScope('wedding') }, [ownerMode])

  const visibleAssets = useMemo(() => assets.filter((asset) => asset.venueId === venueId && (scope === 'venue' ? asset.scope === 'venue' : asset.scope === 'wedding' && asset.weddingId === weddingId)), [assets, scope, weddingId, venueId])
  const imageCount = visibleAssets.filter((asset) => asset.mediaType === 'image').length
  const videoCount = visibleAssets.filter((asset) => asset.mediaType === 'video').length
  const aiCount = visibleAssets.filter((asset) => asset.aiReference).length

  const uploadFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []) as File[]
    event.target.value = ''
    if (!files.length) return
    setUploading(true); setStatus('')
    let saved = 0; const skipped: string[] = []
    for (const file of files) {
      const mediaType = mediaTypeForFile(file)
      if (!mediaType) { skipped.push(`${file.name} (unsupported)`); continue }
      if (file.size > MAX_DEMO_FILE_SIZE) { skipped.push(`${file.name} (over 50 MB ${isChandelier ? 'current-build' : 'preview'} limit)`); continue }
      const asset: MediaAssetRecord = {
        id: `media-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        venueId,
        scope,
        weddingId: scope === 'wedding' ? weddingId : undefined,
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        mediaType,
        createdAt: new Date().toISOString(),
        areaId: areaId || undefined,
        inventoryItemId: purpose === 'inventory' && inventoryItemId ? inventoryItemId : undefined,
        purpose: mediaType === 'video' && purpose === 'venue-reference' ? 'walkthrough' : purpose,
        aiReference: mediaType === 'image' && scope === 'venue' && purpose === 'venue-reference',
        blob: file,
      }
      await saveMediaAsset(asset); saved += 1
    }
    await refresh(); setUploading(false)
    setStatus(`${saved} file${saved === 1 ? '' : 's'} added${skipped.length ? ` · ${skipped.length} skipped` : ''}.`)
  }

  const patchAsset = async (asset: MediaAssetRecord, patch: Partial<MediaAssetRecord>) => {
    await updateMediaMetadata(asset.id, patch)
    await refresh()
  }

  const removeAsset = async (asset: MediaAssetRecord) => {
    if (!window.confirm(`Remove ${asset.name} from this ${isChandelier ? 'media library' : 'preview library'}?`)) return
    await deleteMediaAsset(asset.id); await refresh()
  }

  return (
    <main className="page-main shell media-page">
      <section className="page-intro page-intro--split media-intro">
        <div><p className="eyebrow">{ownerMode ? `${venue.shortName.toUpperCase()} · OWNER MEDIA` : `${venue.shortName.toUpperCase()} · ${weddingName.toUpperCase()} · ${eventLabel.toUpperCase()} MEDIA`}</p><h1>Media Library</h1><p>Upload venue photos, short walkthrough videos, inspiration images and planning documents. The same files can feed the AI Preview Studio instead of being uploaded again.</p></div>
        <div className="media-intro__actions"><button className="button button--primary" onClick={() => inputRef.current?.click()} disabled={uploading}>{uploading ? 'Uploading…' : '+ Upload files'}</button><button className="button button--ghost" onClick={() => onNavigate('ai-preview')}>AI Preview Studio</button></div>
      </section>

      <section className="panel media-demo-note"><strong>{isChandelier ? 'Current build storage' : 'Working preview storage'}</strong><p>Files are stored only in this browser using IndexedDB. Production will send them to secure cloud storage so they are available across devices and only to authorized users at {venue.shortName}.</p></section>

      <section className="media-controls panel">
        {ownerMode && <div className="media-scope-toggle"><button className={scope === 'venue' ? 'active' : ''} onClick={() => setScope('venue')}>Venue library</button><button className={scope === 'wedding' ? 'active' : ''} onClick={() => setScope('wedding')}>{weddingName}</button></div>}
        <div className="media-upload-options">
          <label><span>Assign to area</span><select value={areaId} onChange={(e) => setAreaId(e.target.value)}><option value="">General / no area</option>{venueAreas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}</select></label>
          <label><span>Upload purpose</span><select value={purpose} onChange={(e) => setPurpose(e.target.value as MediaPurpose)}><option value="venue-reference">Venue reference</option><option value="walkthrough">Walkthrough video</option><option value="inspiration">Inspiration</option><option value="inventory">Inventory / prop</option><option value="document">Document</option></select></label>
          {ownerMode && purpose === 'inventory' && <label><span>Link to prop</span><select value={inventoryItemId} onChange={(e) => setInventoryItemId(e.target.value)}><option value="">Choose prop</option>{inventory.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
          <input ref={inputRef} className="visually-hidden" type="file" multiple accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt" onChange={uploadFiles} />
        </div>
        {status && <div className="media-status" role="status">{status}</div>}
      </section>

      <section className="media-stat-grid">
        <article><span>Files</span><strong>{visibleAssets.length}</strong></article><article><span>Photos</span><strong>{imageCount}</strong></article><article><span>Videos</span><strong>{videoCount}</strong></article><article><span>AI references</span><strong>{aiCount}</strong></article>
      </section>

      {visibleAssets.length ? (
        <section className="media-grid">
          {visibleAssets.map((asset) => {
            const area = venueAreas.find((entry) => entry.id === asset.areaId)
            const prop = inventory.find((entry) => entry.id === asset.inventoryItemId)
            return <article className="media-card" key={asset.id}>
              <AssetPreview asset={asset} />
              <div className="media-card__body"><div className="media-card__heading"><div><span className="mini-label">{asset.mediaType.toUpperCase()} · {formatMediaBytes(asset.size)}</span><h3>{asset.name}</h3></div>{asset.aiReference && <span className="ai-reference-pill">AI REF</span>}</div>
                <div className="media-card__meta"><span>{area?.name || 'General'}</span><span>{asset.purpose.replace('-', ' ')}</span>{prop && <span>{prop.name}</span>}</div>
                <div className="media-card__controls">
                  <label><span>Area</span><select value={asset.areaId || ''} onChange={(e) => patchAsset(asset, { areaId: e.target.value || undefined })}><option value="">General</option>{venueAreas.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></label>
                  {ownerMode && asset.purpose === 'inventory' && <label><span>Prop</span><select value={asset.inventoryItemId || ''} onChange={(e) => patchAsset(asset, { inventoryItemId: e.target.value || undefined })}><option value="">Unassigned</option>{inventory.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
                  {ownerMode && asset.mediaType === 'image' && asset.scope === 'venue' && <label className="media-ai-check"><input type="checkbox" checked={asset.aiReference} onChange={(e) => patchAsset(asset, { aiReference: e.target.checked })} /><span>Use for AI previews</span></label>}
                </div>
                <button className="text-link media-remove" onClick={() => removeAsset(asset)}>Remove</button>
              </div>
            </article>
          })}
        </section>
      ) : (
        <section className="panel media-empty"><div className="media-empty__icon">▧</div><h2>No files here yet.</h2><p>{ownerMode && scope === 'venue' ? 'Start with 3–6 clear photos of each venue area plus any walkthrough videos. Mark the best area photos as AI references.' : `Upload inspiration images, vendor files, diagrams or short videos for this ${eventLabel}.`}</p><button className="button button--primary" onClick={() => inputRef.current?.click()}>Upload first files</button></section>
      )}
    </main>
  )
}
