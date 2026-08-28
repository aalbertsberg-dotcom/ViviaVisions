import { useEffect, useMemo, useRef, useState } from 'react'
import type { PageKey } from '../components/Header'
import { areaById, venueConfigById } from '../data'
import { listMediaAssets, saveMediaAsset } from '../mediaStore'
import type { MediaAssetRecord, PlacedItem, Selection } from '../types'
import { PLATFORM_NAME } from '../config/platform'

type AiPreviewProps = {
  venueId: string
  weddingId: string
  weddingName: string
  preferredAreaId: string
  placedItems: PlacedItem[]
  selections: Selection[]
  ownerMode: boolean
  onNavigate: (page: PageKey) => void
}

const SAMPLE_SCENE = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720" viewBox="0 0 1200 720"><defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d8e0d6"/><stop offset="1" stop-color="#f4eadc"/></linearGradient><linearGradient id="floor" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#c9ad88"/><stop offset="1" stop-color="#8e7157"/></linearGradient></defs><rect width="1200" height="720" fill="url(#sky)"/><rect y="370" width="1200" height="350" fill="url(#floor)"/><path d="M110 410V170M1090 410V170M80 190H1120" stroke="#614e3e" stroke-width="24"/><path d="M120 190L300 95L480 190L670 90L860 190L1040 105" fill="none" stroke="#6f5c48" stroke-width="14"/><circle cx="250" cy="335" r="58" fill="#f7f2e7" stroke="#8a735c" stroke-width="9"/><circle cx="520" cy="335" r="58" fill="#f7f2e7" stroke="#8a735c" stroke-width="9"/><circle cx="800" cy="335" r="58" fill="#f7f2e7" stroke="#8a735c" stroke-width="9"/><rect x="470" y="465" width="270" height="160" rx="8" fill="#ddd4c8" stroke="#816b58" stroke-width="9"/><text x="600" y="70" text-anchor="middle" font-family="Georgia" font-size="40" fill="#35473c">Sample Venue Reference</text><text x="600" y="110" text-anchor="middle" font-family="Arial" font-size="20" fill="#6e675f">Upload real area photos in Media Library for a venue-specific preview</text></svg>`)}`

function drawCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, width: number, height: number) {
  const scale = Math.max(width / image.width, height / image.height)
  const drawWidth = image.width * scale; const drawHeight = image.height * scale
  ctx.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight)
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = src })
}

export default function AiPreview({ venueId, weddingId, weddingName, preferredAreaId, placedItems, selections, ownerMode, onNavigate }: AiPreviewProps) {
  const config = venueConfigById(venueId)
  const { profile: venue, inventory, areas: venueAreas } = config
  const eventLabel = venue.eventLabel ?? 'event'
  const defaultAreaId = preferredAreaId || venueAreas.find((entry) => entry.kind === 'Reception')?.id || venueAreas[0]?.id || ''
  const [assets, setAssets] = useState<MediaAssetRecord[]>([])
  const [areaId, setAreaId] = useState(() => {
    const fromPlanner = localStorage.getItem('venueVisions.aiPreviewArea')
    localStorage.removeItem('venueVisions.aiPreviewArea')
    return fromPlanner || defaultAreaId
  })
  const [referenceId, setReferenceId] = useState('sample')
  const [style, setStyle] = useState('Romantic')
  const [time, setTime] = useState('Golden hour')
  const [view, setView] = useState('Wide room')
  const [notes, setNotes] = useState(`Polished, realistic ${eventLabel} setup with clear guest circulation.`)
  const [previewUrl, setPreviewUrl] = useState('')
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null)
  const [generating, setGenerating] = useState(false)
  const [saved, setSaved] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => { listMediaAssets().then(setAssets) }, [])
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }, [previewUrl])

  const venueImages = useMemo(() => assets.filter((asset) => asset.scope === 'venue' && asset.mediaType === 'image' && (!asset.areaId || asset.areaId === areaId)).sort((a, b) => Number(b.aiReference) - Number(a.aiReference)), [assets, areaId])
  const inspirationCount = assets.filter((asset) => asset.scope === 'wedding' && asset.weddingId === weddingId && asset.mediaType === 'image').length
  const areaItems = placedItems.filter((item) => (item.areaId || defaultAreaId) === areaId)
  const area = areaById(areaId, venueId)
  const selectedDecor = selections.map((selection) => inventory.find((item) => item.id === selection.itemId)).filter(Boolean)

  useEffect(() => { if (referenceId !== 'sample' && !venueImages.some((asset) => asset.id === referenceId)) setReferenceId(venueImages[0]?.id ?? 'sample') }, [venueImages, referenceId])

  const generatePreview = async () => {
    const canvas = canvasRef.current; if (!canvas) return
    setGenerating(true); setSaved(false)
    const ctx = canvas.getContext('2d'); if (!ctx) return
    const width = 1200; const height = 720; canvas.width = width; canvas.height = height
    let src = SAMPLE_SCENE; let objectUrl = ''
    const asset = assets.find((entry) => entry.id === referenceId)
    if (asset) { objectUrl = URL.createObjectURL(asset.blob); src = objectUrl }
    try {
      const image = await loadImage(src)
      ctx.save()
      ctx.filter = time === 'Evening' ? 'brightness(.62) saturate(1.08)' : time === 'Golden hour' ? 'sepia(.16) saturate(1.1) brightness(1.02)' : 'brightness(1.04) saturate(.98)'
      drawCover(ctx, image, width, height)
      ctx.restore()
      const wash = ctx.createLinearGradient(0, 0, 0, height)
      wash.addColorStop(0, style === 'Modern' ? 'rgba(255,255,255,.08)' : 'rgba(255,245,228,.05)')
      wash.addColorStop(1, 'rgba(24,30,26,.45)')
      ctx.fillStyle = wash; ctx.fillRect(0, 0, width, height)

      // Mini interpretation of the 2D plan. Production sends the same structured data to the AI renderer.
      const panelX = 875; const panelY = 40; const panelW = 285; const panelH = 210
      ctx.fillStyle = 'rgba(255,255,255,.88)'; ctx.fillRect(panelX, panelY, panelW, panelH)
      ctx.fillStyle = '#34483b'; ctx.font = '700 17px Arial'; ctx.fillText('2D PLAN INTERPRETATION', panelX + 18, panelY + 30)
      ctx.font = '13px Arial'; ctx.fillStyle = '#6d665f'; ctx.fillText(`${areaItems.length} placed pieces · ${view}`, panelX + 18, panelY + 52)
      areaItems.slice(0, 28).forEach((item) => {
        const x = panelX + 14 + Math.min(.98, item.x / 720) * (panelW - 40)
        const y = panelY + 65 + Math.min(.98, item.y / 500) * (panelH - 82)
        ctx.save(); ctx.translate(x, y); ctx.rotate(item.rotation * Math.PI / 180)
        ctx.fillStyle = item.type === 'decor' ? '#b58a55' : item.type === 'dance-floor' ? '#766b61' : '#6d8674'
        if (item.type === 'round-table' || item.type === 'cake-table' || item.type === 'chair') { ctx.beginPath(); ctx.arc(0, 0, item.type === 'chair' ? 4 : 8, 0, Math.PI * 2); ctx.fill() }
        else ctx.fillRect(-8, -5, item.type === 'dance-floor' ? 24 : 16, item.type === 'dance-floor' ? 15 : 10)
        ctx.restore()
      })

      ctx.fillStyle = 'rgba(28,34,30,.78)'; ctx.fillRect(0, 575, width, 145)
      ctx.fillStyle = '#fff'; ctx.font = '600 34px Georgia'; ctx.fillText(`${weddingName} · ${area.name}`, 52, 625)
      ctx.font = '16px Arial'; ctx.fillStyle = '#eee8df'; ctx.fillText(`${style} · ${time} · ${view}`, 52, 655)
      ctx.font = '13px Arial'; ctx.fillStyle = '#d8d0c7'; const note = notes.trim().slice(0, 115) || `${PLATFORM_NAME} AI preview concept`; ctx.fillText(note, 52, 683)
      ctx.textAlign = 'right'; ctx.fillStyle = '#f0d9b7'; ctx.font = '700 13px Arial'; ctx.fillText('VISUAL PREVIEW · PLACEMENT FOLLOWS THE 2D PLAN', 1148, 683); ctx.textAlign = 'left'

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', .9))
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      if (blob) { setPreviewBlob(blob); setPreviewUrl(URL.createObjectURL(blob)) }
    } finally { if (objectUrl) URL.revokeObjectURL(objectUrl); setGenerating(false) }
  }

  const savePreview = async () => {
    if (!previewBlob) return
    await saveMediaAsset({ id: `media-ai-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, venueId, scope: 'wedding', weddingId, name: `${weddingName.replace(/[^a-z0-9]+/gi, '-')}-${area.name.replace(/[^a-z0-9]+/gi, '-')}-concept.jpg`, mimeType: 'image/jpeg', size: previewBlob.size, mediaType: 'image', createdAt: new Date().toISOString(), areaId, purpose: 'ai-preview', aiReference: false, blob: previewBlob })
    setSaved(true)
  }

  return (
    <main className="page-main shell ai-preview-page">
      <section className="page-intro page-intro--split ai-preview-intro"><div><p className="eyebrow">{venue.shortName.toUpperCase()} · STEP 3 · VISUAL PREVIEW</p><h1>Preview the layout you already designed.</h1><p>The 2D plan stays in control of placement. This step adds a venue reference photo, resource choices and visual style to help you picture the finished setup for {weddingName}.</p></div><div className="ai-preview-intro__actions"><button className="button button--primary" onClick={() => onNavigate('planner')}>Back to 2D Designer</button><button className="button button--ghost" onClick={() => onNavigate('media')}>Reference Photos</button></div></section>

      <section className="panel ai-layout-source">
        <div><span className="mini-label">2D LAYOUT SOURCE</span><strong>{area.name}</strong><p>{areaItems.length} placed objects are being passed into this preview. Change placement in the 2D Designer, not here.</p></div>
        <button className="button button--ghost button--small" onClick={() => onNavigate('planner')}>Edit 2D layout</button>
      </section>

      <section className="panel ai-production-note"><div><span className="mini-label">PREVIEW GENERATION</span><strong>Use the structured layout and venue references to review the event visually.</strong></div><p>The visual preview combines the venue reference, structured 2D layout, selected resources and style choices while keeping the 2D plan as the placement source of truth.</p></section>

      <div className="ai-preview-layout">
        <section className="panel ai-preview-controls">
          <div className="panel__heading"><div><p className="eyebrow">VISUAL OPTIONS</p><h2>Choose how to visualize it</h2></div></div>
          <label><span>Venue area</span><select value={areaId} onChange={(e) => { setAreaId(e.target.value); setPreviewUrl(''); setPreviewBlob(null) }}>{venueAreas.filter((entry) => entry.plannerEnabled).map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></label>
          <label><span>Venue reference photo</span><select value={referenceId} onChange={(e) => setReferenceId(e.target.value)}><option value="sample">Built-in sample scene</option>{venueImages.map((asset) => <option key={asset.id} value={asset.id}>{asset.aiReference ? '★ ' : ''}{asset.name}</option>)}</select></label>
          <div className="ai-reference-help"><strong>{venueImages.length} uploaded reference photo{venueImages.length === 1 ? '' : 's'}</strong><span>{venueImages.length ? '★ indicates an owner-marked AI reference.' : 'Upload real venue photos in Media Library for a venue-specific result.'}</span></div>
          <label><span>Style</span><select value={style} onChange={(e) => setStyle(e.target.value)}><option>Romantic</option><option>Classic</option><option>Modern</option><option>Natural</option></select></label>
          <label><span>Time of day</span><select value={time} onChange={(e) => setTime(e.target.value)}><option>Daylight</option><option>Golden hour</option><option>Evening</option></select></label>
          <label><span>Camera view</span><select value={view} onChange={(e) => setView(e.target.value)}><option>Wide room</option><option>Front view</option><option>Focal-area view</option></select></label>
          <label><span>Style notes</span><textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
          <div className="ai-input-summary"><div><span>2D objects</span><strong>{areaItems.length}</strong></div><div><span>Selected resource types</span><strong>{selectedDecor.length}</strong></div><div><span>Inspiration photos</span><strong>{inspirationCount}</strong></div></div>
          <button className="button button--primary full-width" onClick={generatePreview} disabled={generating}>{generating ? 'Generating concept…' : 'Generate preview concept'}</button>
        </section>

        <section className="panel ai-preview-output">
          <div className="ai-preview-output__heading"><div><span className="mini-label">PREVIEW RESULT</span><strong>{area.name}</strong></div><span className="prototype-badge">AI preview</span></div>
          <div className={previewUrl ? 'ai-preview-stage has-preview' : 'ai-preview-stage'}>{previewUrl ? <img src={previewUrl} alt={`${area.name} ${eventLabel} concept`} /> : <><div className="ai-preview-placeholder"><span>✦</span><h2>Ready to visualize.</h2><p>Your 2D layout is ready. Choose the visual options, then generate the concept.</p></div></>}</div>
          <canvas ref={canvasRef} className="visually-hidden" />
          <div className="ai-preview-actions"><button className="button button--primary" onClick={savePreview} disabled={!previewBlob || saved}>{saved ? `Saved to ${eventLabel} ✓` : `Save to ${eventLabel}`}</button><button className="button button--ghost" onClick={generatePreview}>Regenerate</button><button className="button button--ghost" onClick={() => onNavigate('media')}>View saved media</button></div>
          <p className="ai-preview-disclaimer">Conceptual preview for planning inspiration. The 2D plan remains the placement reference; final setup, measurements and availability are confirmed by the venue.</p>
        </section>
      </div>
    </main>
  )
}
