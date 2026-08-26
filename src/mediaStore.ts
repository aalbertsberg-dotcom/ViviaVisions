import type { MediaAsset, MediaAssetRecord } from './types'

const DB_NAME = 'venueVisionsMediaDemo'
const DB_VERSION = 1
const STORE = 'assets'

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

export async function listMediaAssets(): Promise<MediaAssetRecord[]> {
  const db = await openDb()
  const tx = db.transaction(STORE, 'readonly')
  const assets = await requestToPromise(tx.objectStore(STORE).getAll()) as MediaAssetRecord[]
  db.close()
  return assets.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function saveMediaAsset(asset: MediaAssetRecord): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(STORE, 'readwrite')
  await requestToPromise(tx.objectStore(STORE).put(asset))
  db.close()
}

export async function updateMediaMetadata(id: string, patch: Partial<MediaAsset>): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(STORE, 'readwrite')
  const store = tx.objectStore(STORE)
  const current = await requestToPromise(store.get(id)) as MediaAssetRecord | undefined
  if (current) await requestToPromise(store.put({ ...current, ...patch, id: current.id, blob: current.blob }))
  db.close()
}

export async function deleteMediaAsset(id: string): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(STORE, 'readwrite')
  await requestToPromise(tx.objectStore(STORE).delete(id))
  db.close()
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
