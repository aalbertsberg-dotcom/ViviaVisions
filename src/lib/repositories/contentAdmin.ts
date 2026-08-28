import type { Category, PackageTier } from '../../types'
import { applyVenueConfigOverride, venueConfigBySlug } from '../../data'
import { supabase } from '../supabase'
import { loadVenueConfigFromSupabase } from './venueConfig'

type DbRow = Record<string, unknown>

export type ManagedInventoryItem = {
  id: string
  externalKey: string
  name: string
  category: Category
  color: string
  quantity: number
  dimensions: string
  storageLocation: string
  description: string
  featured: boolean
  accessTier: PackageTier
  packageNote: string
  imageUrl: string
  isPublic: boolean
  isActive: boolean
}

export type ManagedInventoryInput = Omit<ManagedInventoryItem, 'id'> & { id?: string }

export type ManagedPackage = {
  id: string
  externalKey: string
  name: string
  price: number
  duration: string
  maxGuests: number | null
  tier: PackageTier
  description: string
  highlights: string[]
  sortOrder: number
  isPublic: boolean
  isActive: boolean
}

export type ManagedPackageInput = Omit<ManagedPackage, 'id'> & { id?: string }

export type ManagedSpace = {
  id: string
  externalKey: string
  name: string
  kind: 'Ceremony' | 'Reception' | 'Photos' | 'Hospitality'
  description: string
  plannerEnabled: boolean
  visualKey: string
  sortOrder: number
  isPublic: boolean
  isActive: boolean
}

export type ManagedSpaceInput = Omit<ManagedSpace, 'id'> & { id?: string }

export type ManagedVenueProfile = {
  id: string
  slug: string
  name: string
  shortName: string
  tagline: string
  website: string
  address: string
  phone: string
  email: string
  ownerDisplayName: string
  brandPrimary: string
  brandAccent: string
  brandSurface: string
  brandText: string
  logoText: string
  locationLabel: string
  inventoryLabel: string
  venueTypeLabel: string
  eventLabel: string
  eventPluralLabel: string
  clientLabel: string
  clientPluralLabel: string
  portalHeroTitle: string
  portalHeroBody: string
  oneEventPerDate: boolean
  ownerDashboardNote: string
  isPublished: boolean
}

export type ManagedVenueContent = {
  venue: ManagedVenueProfile
  packages: ManagedPackage[]
  spaces: ManagedSpace[]
}

function db() {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase
}

function text(value: unknown, fallback = '') {
  return value === null || value === undefined ? fallback : String(value)
}

function bool(value: unknown, fallback = false) {
  return value === null || value === undefined ? fallback : Boolean(value)
}

function number(value: unknown, fallback = 0) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function tier(value: unknown): PackageTier {
  const numeric = number(value, 1)
  if (numeric >= 3) return 3
  if (numeric >= 2) return 2
  return 1
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item'
}

function jsonObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

async function venueRowBySlug(slug: string) {
  const { data, error } = await db().from('venues').select('*').eq('slug', slug).single()
  if (error) throw error
  return data as DbRow
}

function mapInventory(row: DbRow): ManagedInventoryItem {
  return {
    id: text(row.id),
    externalKey: text(row.external_key),
    name: text(row.name),
    category: text(row.category, 'Miscellaneous') as Category,
    color: text(row.color),
    quantity: Math.max(0, number(row.quantity)),
    dimensions: text(row.dimensions),
    storageLocation: text(row.storage_location),
    description: text(row.description),
    featured: bool(row.featured),
    accessTier: tier(row.access_tier),
    packageNote: text(row.package_note),
    imageUrl: text(row.image_url),
    isPublic: bool(row.is_public, true),
    isActive: bool(row.is_active, true),
  }
}

function mapPackage(row: DbRow): ManagedPackage {
  const highlights = Array.isArray(row.highlights) ? row.highlights.map((entry) => String(entry)) : []
  return {
    id: text(row.id),
    externalKey: text(row.external_key),
    name: text(row.name),
    price: Math.max(0, number(row.price)),
    duration: text(row.duration),
    maxGuests: row.max_guests === null || row.max_guests === undefined ? null : Math.max(0, number(row.max_guests)),
    tier: tier(row.tier),
    description: text(row.description),
    highlights,
    sortOrder: number(row.sort_order),
    isPublic: bool(row.is_public, true),
    isActive: bool(row.is_active, true),
  }
}

function mapSpace(row: DbRow): ManagedSpace {
  const kind = text(row.kind, 'Hospitality')
  const validKind = ['Ceremony', 'Reception', 'Photos', 'Hospitality'].includes(kind)
    ? kind as ManagedSpace['kind']
    : 'Hospitality'
  return {
    id: text(row.id),
    externalKey: text(row.external_key),
    name: text(row.name),
    kind: validKind,
    description: text(row.description),
    plannerEnabled: bool(row.planner_enabled, true),
    visualKey: text(row.visual_key),
    sortOrder: number(row.sort_order),
    isPublic: bool(row.is_public, true),
    isActive: bool(row.is_active, true),
  }
}

function mapVenue(row: DbRow): ManagedVenueProfile {
  return {
    id: text(row.id),
    slug: text(row.slug),
    name: text(row.name),
    shortName: text(row.short_name),
    tagline: text(row.tagline),
    website: text(row.website),
    address: text(row.address),
    phone: text(row.phone),
    email: text(row.email),
    ownerDisplayName: text(row.owner_display_name),
    brandPrimary: text(row.brand_primary, '#243248'),
    brandAccent: text(row.brand_accent, '#b68a45'),
    brandSurface: text(row.brand_surface),
    brandText: text(row.brand_text),
    logoText: text(row.logo_text),
    locationLabel: text(row.location_label),
    inventoryLabel: text(row.inventory_label),
    venueTypeLabel: text(row.venue_type_label, 'Event venue'),
    eventLabel: text(row.event_label, 'event'),
    eventPluralLabel: text(row.event_plural_label, 'events'),
    clientLabel: text(row.client_label, 'client'),
    clientPluralLabel: text(row.client_plural_label, 'clients'),
    portalHeroTitle: text(row.portal_hero_title),
    portalHeroBody: text(row.portal_hero_body),
    oneEventPerDate: bool(row.one_event_per_date, true),
    ownerDashboardNote: text(row.owner_dashboard_note),
    isPublished: bool(row.is_published),
  }
}

export async function listManagedInventory(venueSlug: string, includeArchived = false): Promise<ManagedInventoryItem[]> {
  const venue = await venueRowBySlug(venueSlug)

  const result = includeArchived
    ? await db()
        .from('inventory_items')
        .select('*')
        .eq('venue_id', text(venue.id))
        .order('name')
    : await db()
        .from('inventory_items')
        .select('*')
        .eq('venue_id', text(venue.id))
        .eq('is_active', true)
        .order('name')

  if (result.error) throw result.error
  return (result.data ?? []).map((row: DbRow) => mapInventory(row))
}

export async function saveManagedInventoryItem(venueSlug: string, input: ManagedInventoryInput): Promise<ManagedInventoryItem> {
  const venue = await venueRowBySlug(venueSlug)
  const payload = {
    external_key: input.externalKey || `${slugify(input.name)}-${crypto.randomUUID().slice(0, 8)}`,
    name: input.name.trim(),
    category: input.category,
    color: input.color.trim(),
    quantity: Math.max(0, Math.floor(input.quantity || 0)),
    dimensions: input.dimensions.trim(),
    storage_location: input.storageLocation.trim(),
    description: input.description.trim(),
    featured: input.featured,
    access_tier: input.accessTier,
    package_note: input.packageNote.trim(),
    image_url: input.imageUrl || null,
    is_public: input.isPublic,
    is_active: true,
  }

  if (!payload.name) throw new Error('Inventory item name is required.')

  const query = input.id
    ? db().from('inventory_items').update(payload).eq('id', input.id)
    : db().from('inventory_items').upsert(
        { ...payload, venue_id: text(venue.id) },
        { onConflict: 'venue_id,external_key' },
      )

  const { data, error } = await query.select('*').single()
  if (error) throw error
  return mapInventory(data as DbRow)
}

export async function archiveManagedInventoryItem(id: string) {
  const { error } = await db().from('inventory_items').update({ is_active: false }).eq('id', id)
  if (error) throw error
}

export async function restoreManagedInventoryItem(id: string) {
  const { error } = await db().from('inventory_items').update({ is_active: true }).eq('id', id)
  if (error) throw error
}

export async function uploadManagedInventoryImage(venueSlug: string, itemId: string, file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Inventory photos must be image files.')
  if (file.size > 20 * 1024 * 1024) throw new Error('Inventory photos must be 20 MB or smaller.')

  const venue = await venueRowBySlug(venueSlug)
  const { data: itemData, error: itemError } = await db()
    .from('inventory_items')
    .select('metadata')
    .eq('id', itemId)
    .single()

  if (itemError) throw itemError

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '-')
  const storagePath = `venues/${text(venue.id)}/inventory/${itemId}/${Date.now()}-${safeName}`
  const { error: uploadError } = await db().storage.from('inventory-public').upload(storagePath, file, {
    cacheControl: '3600',
    contentType: file.type || 'image/jpeg',
    upsert: false,
  })

  if (uploadError) throw uploadError

  const publicUrl = db().storage.from('inventory-public').getPublicUrl(storagePath).data.publicUrl
  const metadata = jsonObject((itemData as DbRow).metadata)
  const oldPath = text(metadata.image_path)
  const nextMetadata = { ...metadata, image_path: storagePath }

  const { error: updateError } = await db()
    .from('inventory_items')
    .update({ image_url: publicUrl, metadata: nextMetadata })
    .eq('id', itemId)

  if (updateError) {
    await db().storage.from('inventory-public').remove([storagePath])
    throw updateError
  }

  if (oldPath && oldPath !== storagePath) {
    await db().storage.from('inventory-public').remove([oldPath])
  }

  return publicUrl
}

export async function getManagedVenueContent(venueSlug: string): Promise<ManagedVenueContent> {
  const venue = await venueRowBySlug(venueSlug)

  const [packagesResult, spacesResult] = await Promise.all([
    db().from('venue_packages').select('*').eq('venue_id', text(venue.id)).eq('is_active', true).order('sort_order'),
    db().from('venue_spaces').select('*').eq('venue_id', text(venue.id)).eq('is_active', true).order('sort_order'),
  ])

  if (packagesResult.error) throw packagesResult.error
  if (spacesResult.error) throw spacesResult.error

  return {
    venue: mapVenue(venue),
    packages: (packagesResult.data ?? []).map((row: DbRow) => mapPackage(row)),
    spaces: (spacesResult.data ?? []).map((row: DbRow) => mapSpace(row)),
  }
}

export async function saveManagedVenueProfile(venueSlug: string, input: ManagedVenueProfile): Promise<ManagedVenueProfile> {
  const payload = {
    name: input.name.trim(),
    short_name: input.shortName.trim(),
    tagline: input.tagline.trim(),
    website: input.website.trim(),
    address: input.address.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
    owner_display_name: input.ownerDisplayName.trim(),
    brand_primary: input.brandPrimary.trim(),
    brand_accent: input.brandAccent.trim(),
    brand_surface: input.brandSurface.trim() || null,
    brand_text: input.brandText.trim() || null,
    logo_text: input.logoText.trim(),
    location_label: input.locationLabel.trim(),
    inventory_label: input.inventoryLabel.trim(),
    venue_type_label: input.venueTypeLabel.trim(),
    event_label: input.eventLabel.trim(),
    event_plural_label: input.eventPluralLabel.trim(),
    client_label: input.clientLabel.trim(),
    client_plural_label: input.clientPluralLabel.trim(),
    portal_hero_title: input.portalHeroTitle.trim(),
    portal_hero_body: input.portalHeroBody.trim(),
    one_event_per_date: input.oneEventPerDate,
    owner_dashboard_note: input.ownerDashboardNote.trim(),
    is_published: input.isPublished,
  }

  if (!payload.name || !payload.short_name) throw new Error('Venue name and short name are required.')

  const { data, error } = await db().from('venues').update(payload).eq('slug', venueSlug).select('*').single()
  if (error) throw error
  return mapVenue(data as DbRow)
}

export async function saveManagedPackage(venueSlug: string, input: ManagedPackageInput): Promise<ManagedPackage> {
  const venue = await venueRowBySlug(venueSlug)
  const payload = {
    external_key: input.externalKey || `${slugify(input.name)}-${crypto.randomUUID().slice(0, 8)}`,
    name: input.name.trim(),
    price: Math.max(0, input.price || 0),
    duration: input.duration.trim(),
    max_guests: input.maxGuests === null ? null : Math.max(0, Math.floor(input.maxGuests)),
    tier: input.tier,
    description: input.description.trim(),
    highlights: input.highlights.filter(Boolean),
    sort_order: Math.floor(input.sortOrder || 0),
    is_public: input.isPublic,
    is_active: true,
  }

  if (!payload.name) throw new Error('Package name is required.')

  const query = input.id
    ? db().from('venue_packages').update(payload).eq('id', input.id)
    : db().from('venue_packages').insert({ ...payload, venue_id: text(venue.id) })

  const { data, error } = await query.select('*').single()
  if (error) throw error
  return mapPackage(data as DbRow)
}

export async function archiveManagedPackage(id: string) {
  const { error } = await db().from('venue_packages').update({ is_active: false }).eq('id', id)
  if (error) throw error
}

export async function saveManagedSpace(venueSlug: string, input: ManagedSpaceInput): Promise<ManagedSpace> {
  const venue = await venueRowBySlug(venueSlug)
  const payload = {
    external_key: input.externalKey || `${slugify(input.name)}-${crypto.randomUUID().slice(0, 8)}`,
    name: input.name.trim(),
    kind: input.kind,
    description: input.description.trim(),
    planner_enabled: input.plannerEnabled,
    visual_key: input.visualKey.trim() || input.externalKey || slugify(input.name),
    sort_order: Math.floor(input.sortOrder || 0),
    is_public: input.isPublic,
    is_active: true,
  }

  if (!payload.name) throw new Error('Space name is required.')

  const query = input.id
    ? db().from('venue_spaces').update(payload).eq('id', input.id)
    : db().from('venue_spaces').insert({ ...payload, venue_id: text(venue.id) })

  const { data, error } = await query.select('*').single()
  if (error) throw error
  return mapSpace(data as DbRow)
}

export async function archiveManagedSpace(id: string) {
  const { error } = await db().from('venue_spaces').update({ is_active: false }).eq('id', id)
  if (error) throw error
}

export async function refreshRuntimeVenueConfig(venueSlug: string) {
  const fallback = venueConfigBySlug(venueSlug)
  const updated = await loadVenueConfigFromSupabase(venueSlug, fallback)
  if (updated) applyVenueConfigOverride(updated)
  return updated
}