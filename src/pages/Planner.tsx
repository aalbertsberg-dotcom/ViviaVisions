import { useMemo, useRef, useState } from 'react'
import { areaById, itemAllowedForTier, venueConfigById } from '../data'
import type { Dispatch, PointerEvent as ReactPointerEvent, SetStateAction } from 'react'
import type { InventoryItem, PackageTier, PlacedItem, PlannerObjectType, Selection } from '../types'
import type { PageKey } from '../components/Header'

const furniture: Array<{ type: PlannerObjectType; label: string; icon: string }> = [
  { type: 'round-table', label: 'Round table', icon: '○' },
  { type: 'banquet-table', label: 'Banquet table', icon: '▭' },
  { type: 'chair', label: 'Single chair', icon: '⌑' },
  { type: 'dance-floor', label: 'Dance floor', icon: '◇' },
  { type: 'bar', label: 'Bar', icon: '▰' },
  { type: 'cake-table', label: 'Cake table', icon: '◉' },
  { type: 'arch', label: 'Ceremony arch', icon: '∩' },
]

const baseSize: Record<PlannerObjectType, { width: number; height: number }> = {
  'round-table': { width: 74, height: 74 },
  'banquet-table': { width: 85, height: 48 },
  chair: { width: 35, height: 35 },
  'dance-floor': { width: 120, height: 100 },
  bar: { width: 96, height: 37 },
  'cake-table': { width: 58, height: 58 },
  arch: { width: 70, height: 75 },
  decor: { width: 60, height: 53 },
}

function objectClass(type: PlannerObjectType) {
  return `plan-object plan-object--${type}`
}

function isTable(item: PlacedItem | undefined): item is PlacedItem {
  return item?.type === 'round-table' || item?.type === 'banquet-table'
}

function rotatePoint(x: number, y: number, degrees: number) {
  const radians = degrees * Math.PI / 180
  return {
    x: x * Math.cos(radians) - y * Math.sin(radians),
    y: x * Math.sin(radians) + y * Math.cos(radians),
  }
}

function chairPositions(table: PlacedItem, count: number) {
  const scale = table.scale ?? 1
  const size = baseSize[table.type]
  const centerX = table.x + size.width / 2
  const centerY = table.y + size.height / 2
  const radiusX = (size.width * scale) / 2 + 17
  const radiusY = (size.height * scale) / 2 + 17
  const chairW = baseSize.chair.width
  const chairH = baseSize.chair.height

  return Array.from({ length: count }, (_, index) => {
    const angle = -90 + (360 / count) * index
    const radians = angle * Math.PI / 180
    const localX = Math.cos(radians) * radiusX
    const localY = Math.sin(radians) * radiusY
    const rotated = rotatePoint(localX, localY, table.rotation)
    return {
      x: centerX + rotated.x - chairW / 2,
      y: centerY + rotated.y - chairH / 2,
      rotation: angle + 90 + table.rotation,
    }
  })
}

function relayoutLinkedChairs(items: PlacedItem[], tableId: string) {
  const table = items.find((item) => item.id === tableId)
  if (!table || !isTable(table)) return items
  const linked = items.filter((item) => item.parentTableId === tableId)
  if (!linked.length) return items
  const positions = chairPositions(table, linked.length)
  let linkedIndex = 0
  return items.map((item) => {
    if (item.parentTableId !== tableId) return item
    const position = positions[linkedIndex++]
    return { ...item, ...position }
  })
}

type PlannerProps = {
  venueId: string
  selections: Selection[]
  placedItems: PlacedItem[]
  setPlacedItems: Dispatch<SetStateAction<PlacedItem[]>>
  onSetQuantity: (itemId: string, quantity: number) => void
  packageTier: PackageTier
  preferredAreaId?: string
  onNavigate: (page: PageKey) => void
}

export default function Planner({ venueId, selections, placedItems, setPlacedItems, onSetQuantity, packageTier, preferredAreaId, onNavigate }: PlannerProps) {
  const config = venueConfigById(venueId)
  const { profile: venue, inventory, areas: venueAreas } = config
  const eventLabel = venue.eventLabel ?? 'event'
  const isWedding = eventLabel === 'wedding'
  const defaultAreaId = preferredAreaId || venueAreas.find((item) => item.kind === 'Reception')?.id || venueAreas[0]?.id || ''
  const canvasRef = useRef<HTMLDivElement>(null)
  const [area, setArea] = useState(() => {
    const focused = localStorage.getItem('venueVisions.plannerArea')
    localStorage.removeItem('venueVisions.plannerArea')
    return focused || defaultAreaId
  })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [inventorySearch, setInventorySearch] = useState('')
  const areaItems = placedItems.filter((item) => (item.areaId || defaultAreaId) === area)
  const currentArea = areaById(area, venueId)

  const selectedDecor = useMemo(
    () => selections.map((s) => inventory.find((item) => item.id === s.itemId)).filter((item): item is InventoryItem => Boolean(item) && itemAllowedForTier(item as InventoryItem, packageTier)),
    [selections, packageTier],
  )

  const filteredInventory = useMemo(() => {
    const query = inventorySearch.trim().toLowerCase()
    const allowed = inventory.filter((item) => itemAllowedForTier(item, packageTier))
    if (!query) return allowed
    return allowed.filter((item) => `${item.name} ${item.category} ${item.color}`.toLowerCase().includes(query))
  }, [inventorySearch, packageTier])

  const makeItem = (type: PlannerObjectType, label: string, inventoryItemId?: string, x?: number, y?: number): PlacedItem => {
    const offset = areaItems.length % 8
    return {
      id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      x: x ?? 42 + offset * 38,
      y: y ?? 50 + offset * 24,
      rotation: 0,
      scale: 1,
      label,
      inventoryItemId,
      areaId: area,
    }
  }

  const addItem = (type: PlannerObjectType, label: string, inventoryItemId?: string) => {
    const newItem = makeItem(type, label, inventoryItemId)
    setPlacedItems((current) => [...current, newItem])
    setSelectedId(newItem.id)
  }

  const addInventoryItem = (item: InventoryItem) => {
    if (!itemAllowedForTier(item, packageTier)) return
    const alreadyPlaced = areaItems.filter((entry) => entry.inventoryItemId === item.id).length
    if (alreadyPlaced >= item.quantity) return
    addItem('decor', item.name, item.id)
    const selectedQty = selections.find((selection) => selection.itemId === item.id)?.quantity ?? 0
    if (selectedQty < alreadyPlaced + 1) onSetQuantity(item.id, alreadyPlaced + 1)
  }

  const updateItem = (id: string, patch: Partial<PlacedItem>) => {
    setPlacedItems((current) => {
      let next = current.map((item) => item.id === id ? { ...item, ...patch } : item)
      const updated = next.find((item) => item.id === id)
      if (isTable(updated) && ('rotation' in patch || 'scale' in patch)) next = relayoutLinkedChairs(next, id)
      return next
    })
  }

  const setTableChairCount = (tableId: string, requested: number) => {
    setPlacedItems((current) => {
      const table = current.find((item) => item.id === tableId)
      if (!table || !isTable(table)) return current
      const max = table.type === 'round-table' ? 12 : 16
      const count = Math.max(0, Math.min(max, requested))
      const existing = current.filter((item) => item.parentTableId === tableId)
      const withoutLinked = current.filter((item) => item.parentTableId !== tableId)
      const positions = chairPositions(table, count)
      const linked = positions.map((position, index): PlacedItem => ({
        id: existing[index]?.id ?? `chair-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'chair',
        x: position.x,
        y: position.y,
        rotation: position.rotation,
        scale: existing[index]?.scale ?? 1,
        label: 'Chair',
        parentTableId: tableId,
        areaId: table.areaId || area,
      }))
      return [...withoutLinked, ...linked]
    })
  }

  const removeSelected = () => {
    if (!selectedId) return
    setPlacedItems((current) => {
      const selected = current.find((item) => item.id === selectedId)
      if (selected && isTable(selected)) return current.filter((item) => item.id !== selectedId && item.parentTableId !== selectedId)
      return current.filter((item) => item.id !== selectedId)
    })
    setSelectedId(null)
  }

  const duplicateSelected = () => {
    const selected = areaItems.find((item) => item.id === selectedId)
    if (!selected) return

    if (selected.inventoryItemId) {
      const source = inventory.find((item) => item.id === selected.inventoryItemId)
      const alreadyPlaced = areaItems.filter((item) => item.inventoryItemId === selected.inventoryItemId).length
      if (source && alreadyPlaced >= source.quantity) return
    }

    const duplicate = makeItem(selected.type, selected.label, selected.inventoryItemId, selected.x + 32, selected.y + 32)
    duplicate.rotation = selected.rotation
    duplicate.scale = selected.scale ?? 1
    setPlacedItems((current) => {
      let next = [...current, duplicate]
      if (isTable(selected)) {
        const chairCount = current.filter((item) => item.parentTableId === selected.id).length
        const positions = chairPositions(duplicate, chairCount)
        next = [...next, ...positions.map((position, index): PlacedItem => ({
          id: `chair-${Date.now()}-dup-${index}-${Math.random().toString(36).slice(2, 6)}`,
          type: 'chair',
          ...position,
          scale: 1,
          label: 'Chair',
          parentTableId: duplicate.id,
          areaId: area,
        }))]
      }
      return next
    })

    if (selected.inventoryItemId) {
      const alreadyPlaced = areaItems.filter((item) => item.inventoryItemId === selected.inventoryItemId).length
      const selectedQty = selections.find((selection) => selection.itemId === selected.inventoryItemId)?.quantity ?? 0
      if (selectedQty < alreadyPlaced + 1) onSetQuantity(selected.inventoryItemId, alreadyPlaced + 1)
    }
    setSelectedId(duplicate.id)
  }

  const clearRoom = () => {
    setPlacedItems((current) => current.filter((item) => (item.areaId || defaultAreaId) !== area))
    setSelectedId(null)
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>, id: string) => {
    const target = event.currentTarget
    const canvas = canvasRef.current
    if (!canvas) return
    target.setPointerCapture(event.pointerId)
    setSelectedId(id)

    const object = areaItems.find((item) => item.id === id)
    if (!object) return
    const rect = canvas.getBoundingClientRect()
    const startOffsetX = event.clientX - rect.left - object.x
    const startOffsetY = event.clientY - rect.top - object.y
    let moved = false

    const onMove = (moveEvent: PointerEvent) => {
      moved = true
      const visualSize = baseSize[object.type]
      const objectScale = object.scale ?? 1
      const nextX = Math.min(rect.width - visualSize.width * objectScale, Math.max(4, moveEvent.clientX - rect.left - startOffsetX))
      const nextY = Math.min(rect.height - visualSize.height * objectScale, Math.max(4, moveEvent.clientY - rect.top - startOffsetY))
      setPlacedItems((current) => {
        const currentObject = current.find((item) => item.id === id)
        if (!currentObject) return current
        const dx = nextX - currentObject.x
        const dy = nextY - currentObject.y
        return current.map((item) => {
          if (item.id === id) return { ...item, x: nextX, y: nextY, ...(item.parentTableId ? { parentTableId: undefined } : {}) }
          if (isTable(currentObject) && item.parentTableId === id) return { ...item, x: item.x + dx, y: item.y + dy }
          return item
        })
      })
    }

    const onUp = () => {
      if (!moved) setSelectedId(id)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const selectedObject = areaItems.find((item) => item.id === selectedId)
  const selectedTableChairCount = isTable(selectedObject) ? areaItems.filter((item) => item.parentTableId === selectedObject.id).length : 0
  const linkedChairCount = areaItems.filter((item) => item.type === 'chair' && item.parentTableId).length

  const continueToPreview = () => {
    localStorage.setItem('venueVisions.aiPreviewArea', area)
    onNavigate('ai-preview')
  }

  return (
    <main className="planner-page">
      <div className="planner-topbar shell">
        <div>
          <p className="eyebrow">{venue.shortName.toUpperCase()} · STEP 1 · 2D VENUE DESIGNER</p>
          <h1>Build the layout first.</h1>
          <p className="planner-topbar__lead">This overhead plan is the placement source of truth. Add tables, chairs and venue resources here before creating an AI visualization.</p>
        </div>
        <div className="planner-topbar__actions">
          <label className="area-select"><span>Design area</span><select value={area} onChange={(e) => { setArea(e.target.value); setSelectedId(null) }}>{venueAreas.filter((item) => item.plannerEnabled).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <button className="button button--ghost button--small" onClick={() => onNavigate('media')}>Area photos</button>
          <button className="button button--ghost button--small" onClick={clearRoom}>Clear room</button>
        </div>
      </div>

      <div className="planner-tip shell" role="note"><strong>{currentArea.name}:</strong> {currentArea.description} Select a table to add chairs, resize or rotate it. <b>The AI Preview uses this exact 2D layout as its structured placement input for this {isWedding ? 'wedding' : 'event'}.</b></div>

      <div className="planner-shell shell">
        <aside className="toolbox panel">
          <div className="toolbox__heading"><span className="mini-label">ADD TO ROOM</span><h2>Layout pieces</h2></div>
          <div className="tool-grid">
            {furniture.map((tool) => (
              <button key={tool.type} onClick={() => addItem(tool.type, tool.label)}><span>{tool.icon}</span><small>{tool.label}</small></button>
            ))}
          </div>

          <div className="toolbox__divider" />
          <div className="toolbox__heading"><span className="mini-label">YOUR RESOURCES</span><h2>Selected pieces</h2></div>
          {selectedDecor.length ? (
            <div className="decor-tools">
              {selectedDecor.map((item) => {
                const inRoom = areaItems.filter((placed) => placed.inventoryItemId === item.id).length
                return <button key={item.id} onClick={() => addInventoryItem(item)} disabled={inRoom >= item.quantity} title="Add this decoration to the floor plan"><span className={`decor-dot decor-dot--${item.imageStyle}`} /><span>{item.name}<small>{inRoom} in room</small></span><b>+</b></button>
              })}
            </div>
          ) : <p className="toolbox-empty">Nothing selected yet. You can still add directly from inventory below.</p>}

          <div className="toolbox__divider" />
          <div className="toolbox__heading"><span className="mini-label">{(venue.inventoryLabel ?? 'ALL INVENTORY').toUpperCase()}</span><h2>Add resources directly</h2></div>
          <input className="inventory-search" type="search" value={inventorySearch} onChange={(e) => setInventorySearch(e.target.value)} placeholder={`Search ${venue.inventoryLabel ?? 'inventory'}…`} />
          <div className="inventory-tools">
            {filteredInventory.map((item) => {
              const inRoom = areaItems.filter((placed) => placed.inventoryItemId === item.id).length
              const isSelected = selections.some((selection) => selection.itemId === item.id)
              return (
                <button key={item.id} onClick={() => addInventoryItem(item)} disabled={inRoom >= item.quantity} title={`Adds to the layout and to this ${eventLabel} when needed`}>
                  <span className={`decor-dot decor-dot--${item.imageStyle}`} />
                  <span><strong>{item.name}</strong><small>{item.category} · {isSelected ? 'selected' : 'not selected'} · {inRoom}/{item.quantity} in room</small></span>
                  <b>+</b>
                </button>
              )
            })}
          </div>
        </aside>

        <section className="canvas-panel panel">
          <div className="canvas-panel__heading">
            <div><span className="mini-label">{currentArea.kind.toUpperCase()}</span><strong>{currentArea.name} · conceptual plan</strong></div>
            <span className="prototype-badge">Not to scale</span>
          </div>
          <div className="floor-canvas" ref={canvasRef} onMouseDown={() => setSelectedId(null)}>
            <div className="floor-label floor-label--entrance">ENTRY / APPROACH</div>
            <div className="floor-feature floor-feature--stage">{currentArea.kind === 'Ceremony' ? 'CEREMONY FOCAL AREA' : 'FEATURE / HEAD TABLE'}</div>
            <div className="floor-feature floor-feature--doors">{currentArea.name.toUpperCase()}</div>
            <div className="floor-feature floor-feature--service">NOT TO SCALE</div>
            {areaItems.map((item) => {
              const inventoryItem = item.inventoryItemId ? inventory.find((entry) => entry.id === item.inventoryItemId) : undefined
              return (
                <button
                  key={item.id}
                  className={`${objectClass(item.type)} ${selectedId === item.id ? 'selected' : ''} ${item.parentTableId ? 'linked-chair' : ''}`}
                  style={{ left: item.x, top: item.y, transform: `rotate(${item.rotation}deg) scale(${item.scale ?? 1})` }}
                  onPointerDown={(e) => handlePointerDown(e, item.id)}
                  onMouseDown={(e) => e.stopPropagation()}
                  title={item.parentTableId ? 'Chair linked to table · drag to detach' : item.label}
                >
                  {item.type === 'round-table' && <span className="table-center"/>}
                  {item.type === 'banquet-table' && <span className="banquet-shape" />}
                  {item.type === 'chair' && <span className="chair-shape" />}
                  {item.type === 'dance-floor' && <span>DANCE<br/>FLOOR</span>}
                  {item.type === 'bar' && <span>BAR</span>}
                  {item.type === 'cake-table' && <span>CAKE</span>}
                  {item.type === 'arch' && <span className="arch-shape">∩</span>}
                  {item.type === 'decor' && <><span className={`decor-object decor-dot--${inventoryItem?.imageStyle ?? ''}`} /><small>{inventoryItem?.name.split(' ').slice(0, 2).join(' ')}</small></>}
                </button>
              )
            })}
          </div>
          <div className="canvas-help"><span>Drag objects to move them. Linked chairs move with their table.</span><span>Select an object for chairs, size, rotation, duplicate or remove.</span></div>
        </section>

        <aside className="properties panel">
          <span className="mini-label">SELECTED OBJECT</span>
          {selectedObject ? (
            <div className="properties__content">
              <div className={`properties-icon plan-object--${selectedObject.type}`}>{selectedObject.type === 'decor' ? '✦' : furniture.find((item) => item.type === selectedObject.type)?.icon ?? '•'}</div>
              <h3>{selectedObject.label}</h3>

              {isTable(selectedObject) && (
                <div className="property-control property-control--chairs">
                  <div className="property-control__heading"><label htmlFor="chairCount">Chairs</label><strong>{selectedTableChairCount}</strong></div>
                  <input id="chairCount" type="range" min="0" max={selectedObject.type === 'round-table' ? 12 : 16} step="1" value={selectedTableChairCount} onChange={(e) => setTableChairCount(selectedObject.id, Number(e.target.value))} />
                  <small>Chairs are separate pieces and can be moved individually.</small>
                </div>
              )}

              <div className="property-control">
                <div className="property-control__heading"><label htmlFor="objectSize">Size</label><strong>{Math.round((selectedObject.scale ?? 1) * 100)}%</strong></div>
                <input id="objectSize" type="range" min="0.6" max="1.8" step="0.05" value={selectedObject.scale ?? 1} onChange={(e) => updateItem(selectedObject.id, { scale: Number(e.target.value) })} />
              </div>

              <div className="property-control">
                <div className="property-control__heading"><label htmlFor="objectRotation">Rotation</label><strong>{selectedObject.rotation}°</strong></div>
                <input id="objectRotation" type="range" min="0" max="345" step="15" value={selectedObject.rotation} onChange={(e) => updateItem(selectedObject.id, { rotation: Number(e.target.value) })} />
              </div>

              {selectedObject.parentTableId && <div className="linked-note">Linked to a table. Drag this chair to detach it and position it freely.</div>}
              <button className="button button--ghost full-width" onClick={duplicateSelected}>Duplicate</button>
              <button className="button button--danger full-width" onClick={removeSelected}>Remove from room</button>
            </div>
          ) : (
            <div className="properties-empty"><span>↖</span><p>Select an object on the floor plan to edit it.</p></div>
          )}
          <div className="toolbox__divider" />
          <div className="room-stats"><span>Objects in this area</span><strong>{areaItems.length}</strong></div>
          <div className="room-stats"><span>Table-linked chairs</span><strong>{linkedChairCount}</strong></div>
          <div className="room-stats"><span>Resource pieces shown</span><strong>{areaItems.filter((item) => item.type === 'decor').length}</strong></div>
        </aside>
      </div>

      <section className="planner-next-step shell panel">
        <div>
          <span className="mini-label">STEP 2 · VISUALIZE</span>
          <h2>Ready to see this layout in the venue?</h2>
          <p>AI Preview combines the current {currentArea.name} 2D plan with venue reference photos, selected resources and {eventLabel} style choices. Your overhead plan remains the placement reference.</p>
        </div>
        <button className="button button--primary" onClick={continueToPreview} disabled={areaItems.length === 0}>
          {areaItems.length === 0 ? 'Add layout pieces first' : 'Continue to AI Preview'}
        </button>
      </section>
    </main>
  )
}
