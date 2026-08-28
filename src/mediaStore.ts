import { supabase } from './lib/supabase'
import { venueConfigById, venueConfigs } from './data'
import type { MediaAsset, MediaAssetRecord } from './types'

const DB_NAME = 'venueVisionsMediaDemo'
const DB_VERSION = 1
const STORE = 'assets'
const PRIVATE_BUCKET = 'venue-assets'

type DbRow = Record<string, unknown>

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function isUuid(value: string | undefined) {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value))
}

function text(value: unknown, fallback = '') {
  return value === null || value === undefined ? fallback : String(value)
}

function metadataObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

async function listLocalMediaAssets(): Promise<MediaAssetRecord[]> {
  const db = await openDb()
  const tx = db.transaction(STORE, 'readonly')
  const assets = await requestToPromise(tx.objectStore(STORE).getAll()) as MediaAssetRecord[]
  db.close()
  return assets.map((asset) => ({ ...asset, source: 'local' as const }))
}

async function saveLocalMediaAsset(asset: MediaAssetRecord): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(STORE, 'readwrite')
  await requestToPromise(tx.objectStore(STORE).put({ ...asset, source: 'local' }))
  db.close()
}

async function updateLocalMediaMetadata(id: string, patch: Partial<MediaAsset>): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(STORE, 'readwrite')
  const store = tx.objectStore(STORE)
  const current = await requestToPromise(store.get(id)) as MediaAssetRecord | undefined
  if (current) await requestToPromise(store.put({ ...current, ...patch, id: current.id, blob: current.blob, source: 'local' }))
  db.close()
}

async function deleteLocalMediaAsset(id: string): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(STORE, 'readwrite')
  await requestToPromise(tx.objectStore(STORE).delete(id))
  db.close()
}

async function authenticatedUserId() {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session?.user.id ?? null
}

async function resolveVenueUuid(appVenueId: string) {
  if (!supabase) throw new Error('Supabase is not configured.')
  const config = venueConfigById(appVenueId)
  const { data, error } = await supabase.from('venues').select('id,slug').eq('slug', config.profile.slug).single()
  if (error) throw error
  return { databaseVenueId: String(data.id), config }
}

function shouldUseCloud(asset: MediaAssetRecord) {
  if (!supabase) return false
  const config = venueConfigById(asset.venueId)
  if (config.profile.isSample) return false
  if (asset.scope === 'wedding' && !isUuid(asset.weddingId)) return false
  return true
}

async function listCloudMediaAssets(): Promise<MediaAssetRecord[]> {
  const client = supabase
  if (!client) return []
  const userId = await authenticatedUserId()
  if (!userId) return []

  const { data: venueRows, error: venueError } = await client.from('venues').select('id,slug')
  if (venueError) throw venueError

  const venueMap = new Map<string, string>()
  for (const venue of venueRows ?? []) {
    const config = venueConfigs.find((entry) => entry.profile.slug === String(venue.slug))
    if (config) venueMap.set(String(venue.id), config.profile.id)
  }

  const { data, error } = await client.from('media_assets').select('*').order('created_at', { ascending: false })
  if (error) throw error

  const records = await Promise.all((data ?? []).map(async (raw: DbRow): Promise<MediaAssetRecord> => {
    const metadata = metadataObject(raw.metadata)
    const storagePath = text(raw.storage_path)
    const signed = await client.storage.from(PRIVATE_BUCKET).createSignedUrl(storagePath, 60 * 60)
    if (signed.error) throw signed.error

    const databaseVenueId = text(raw.venue_id)
    const appVenueId = text(metadata.appVenueId, venueMap.get(databaseVenueId) ?? '')
    const eventId = text(raw.event_id)

    return {
      id: text(raw.id),
      venueId: appVenueId,
      scope: eventId ? 'wedding' : 'venue',
      weddingId: eventId || undefined,
      name: text(raw.name),
      mimeType: text(raw.mime_type, 'application/octet-stream'),
      size: Number(raw.size_bytes ?? 0),
      mediaType: text(raw.media_type, 'document') as MediaAsset['mediaType'],
      createdAt: text(raw.created_at),
      areaId: text(metadata.areaExternalKey) || undefined,
      inventoryItemId: text(metadata.inventoryExternalKey) || undefined,
      purpose: text(raw.purpose, 'document') as MediaAsset['purpose'],
      aiReference: Boolean(raw.ai_reference),
      url: signed.data.signedUrl,
      storagePath,
      source: 'cloud',
    }
  }))

  return records.filter((record) => Boolean(record.venueId))
}

export async function listMediaAssets(): Promise<MediaAssetRecord[]> {
  const local = await listLocalMediaAssets()
  if (!supabase) return local.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  try {
    const cloud = await listCloudMediaAssets()
    return [...cloud, ...local].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  } catch (error) {
    console.error('Unable to load Supabase media assets; keeping demo/browser media available.', error)
    return local.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }
}

export async function saveMediaAsset(asset: MediaAssetRecord): Promise<void> {
  if (!shouldUseCloud(asset)) {
    await saveLocalMediaAsset(asset)
    return
  }

  if (!supabase) throw new Error('Supabase is not configured.')
  if (!asset.blob) throw new Error('The selected file is unavailable for upload.')

  const userId = await authenticatedUserId()
  if (!userId) throw new Error('Sign in before uploading files.')

  const { databaseVenueId } = await resolveVenueUuid(asset.venueId)
  const safeName = asset.name.replace(/[^a-zA-Z0-9._-]+/g, '-')
  const folder = asset.scope === 'wedding'
    ? `venues/${databaseVenueId}/events/${asset.weddingId}`
    : `venues/${databaseVenueId}/shared`
  const storagePath = `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${safeName}`

  const { error: uploadError } = await supabase.storage.from(PRIVATE_BUCKET).upload(storagePath, asset.blob, {
    cacheControl: '3600',
    contentType: asset.mimeType || 'application/octet-stream',
    upsert: false,
  })
  if (uploadError) throw uploadError

  const payload = {
    venue_id: databaseVenueId,
    event_id: asset.scope === 'wedding' ? asset.weddingId : null,
    uploaded_by: userId,
    storage_path: storagePath,
    name: asset.name,
    mime_type: asset.mimeType,
    size_bytes: asset.size,
    media_type: asset.mediaType,
    purpose: asset.purpose,
    ai_reference: asset.aiReference,
    metadata: {
      appVenueId: asset.venueId,
      areaExternalKey: asset.areaId ?? null,
      inventoryExternalKey: asset.inventoryItemId ?? null,
    },
  }

  const { error: metadataError } = await supabase.from('media_assets').insert(payload)
  if (metadataError) {
    await supabase.storage.from(PRIVATE_BUCKET).remove([storagePath])
    throw metadataError
  }
}

export async function updateMediaMetadata(id: string, patch: Partial<MediaAsset>): Promise<void> {
  if (!isUuid(id) || !supabase) {
    await updateLocalMediaMetadata(id, patch)
    return
  }

  const { data, error } = await supabase.from('media_assets').select('metadata,purpose,ai_reference').eq('id', id).single()
  if (error) throw error

  const metadata = metadataObject((data as DbRow).metadata)
  const nextMetadata = { ...metadata }

  if ('areaId' in patch) nextMetadata.areaExternalKey = patch.areaId ?? null
  if ('inventoryItemId' in patch) nextMetadata.inventoryExternalKey = patch.inventoryItemId ?? null

  const payload: Record<string, unknown> = { metadata: nextMetadata }
  if (patch.purpose) payload.purpose = patch.purpose
  if (patch.aiReference !== undefined) payload.ai_reference = patch.aiReference

  const { error: updateError } = await supabase.from('media_assets').update(payload).eq('id', id)
  if (updateError) throw updateError
}

export async function deleteMediaAsset(id: string): Promise<void> {
  if (!isUuid(id) || !supabase) {
    await deleteLocalMediaAsset(id)
    return
  }

  const { data, error } = await supabase.from('media_assets').select('storage_path').eq('id', id).single()
  if (error) throw error

  const storagePath = String(data.storage_path)
  const { error: storageError } = await supabase.storage.from(PRIVATE_BUCKET).remove([storagePath])
  if (storageError) throw storageError

  const { error: deleteError } = await supabase.from('media_assets').delete().eq('id', id)
  if (deleteError) throw deleteError
}

export async function clearMediaAssets(): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(STORE, 'readwrite')
  await requestToPromise(tx.objectStore(STORE).clear())
  db.close()
}

export function mediaTypeForFile(file: File): MediaAsset['mediaType'] | null {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  if (file.type === 'application/pdf' || file.type.startsWith('text/') || /\.(docx?|xlsx?|pptx?)$/i.test(file.name)) return 'document'
  return null
}

export function formatMediaBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}