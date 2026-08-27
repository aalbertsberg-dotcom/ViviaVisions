import type { Category, PackageTier, VenueArea, VenueConfig } from '../../types'
import { supabase } from '../supabase'

const validCategories = new Set<Category>([
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
])

const validAreaKinds = new Set<VenueArea['kind']>([
  'Ceremony',
  'Reception',
  'Photos',
  'Hospitality',
])

function packageTier(value: unknown): PackageTier {
  const numeric = Number(value)
  if (numeric >= 3) return 3
  if (numeric >= 2) return 2
  return 1
}

function category(value: unknown): Category {
  const candidate = String(value ?? 'Miscellaneous') as Category
  return validCategories.has(candidate) ? candidate : 'Miscellaneous'
}

function areaKind(value: unknown): VenueArea['kind'] {
  const candidate = String(value ?? 'Hospitality') as VenueArea['kind']
  return validAreaKinds.has(candidate) ? candidate : 'Hospitality'
}

function text(value: unknown, fallback = '') {
  return value === null || value === undefined ? fallback : String(value)
}

function optionalText(value: unknown, fallback?: string) {
  return value === null || value === undefined ? fallback : String(value)
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((entry) => String(entry)) : []
}

export async function loadVenueConfigFromSupabase(slug: string, fallback: VenueConfig): Promise<VenueConfig | null> {
  if (!supabase) return null

  const { data: venue, error: venueError } = await supabase
    .from('venues')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (venueError) throw venueError
  if (!venue) return null

  const [packagesResult, spacesResult, inventoryResult] = await Promise.all([
    supabase
      .from('venue_packages')
      .select('*')
      .eq('venue_id', venue.id)
      .eq('is_active', true)
      .order('sort_order'),
    supabase
      .from('venue_spaces')
      .select('*')
      .eq('venue_id', venue.id)
      .eq('is_active', true)
      .order('sort_order'),
    supabase
      .from('inventory_items')
      .select('*')
      .eq('venue_id', venue.id)
      .eq('is_active', true)
      .order('name'),
  ])

  if (packagesResult.error) throw packagesResult.error
  if (spacesResult.error) throw spacesResult.error
  if (inventoryResult.error) throw inventoryResult.error

  const packages = (packagesResult.data ?? []).map((row) => ({
    id: text(row.external_key, row.id),
    name: text(row.name),
    price: Number(row.price ?? 0),
    duration: text(row.duration),
    maxGuests: row.max_guests === null || row.max_guests === undefined ? null : Number(row.max_guests),
    tier: packageTier(row.tier),
    description: text(row.description),
    highlights: stringArray(row.highlights),
  }))

  const areas = (spacesResult.data ?? []).map((row) => ({
    id: text(row.external_key, row.id),
    name: text(row.name),
    kind: areaKind(row.kind),
    description: text(row.description),
    plannerEnabled: row.planner_enabled !== false,
    visual: text(row.visual_key, text(row.external_key, 'venue-space')),
  }))

  const inventory = (inventoryResult.data ?? []).map((row) => ({
    id: text(row.external_key, row.id),
    name: text(row.name),
    category: category(row.category),
    color: text(row.color),
    quantity: Math.max(0, Number(row.quantity ?? 0)),
    dimensions: text(row.dimensions),
    storage: text(row.storage_location),
    description: text(row.description),
    imageStyle: text(row.image_style, text(row.external_key, 'decor')),
    featured: Boolean(row.featured),
    accessTier: packageTier(row.access_tier),
    packageNote: optionalText(row.package_note),
  }))

  return {
    profile: {
      ...fallback.profile,
      // Keep the app's stable venue ID until event/client rows are migrated.
      id: fallback.profile.id,
      slug: text(venue.slug, fallback.profile.slug),
      name: text(venue.name, fallback.profile.name),
      shortName: text(venue.short_name, fallback.profile.shortName),
      tagline: text(venue.tagline, fallback.profile.tagline),
      website: text(venue.website, fallback.profile.website),
      address: text(venue.address, fallback.profile.address),
      phone: text(venue.phone, fallback.profile.phone),
      email: text(venue.email, fallback.profile.email),
      ownerName: text(venue.owner_display_name, fallback.profile.ownerName),
      brandPrimary: text(venue.brand_primary, fallback.profile.brandPrimary),
      brandAccent: text(venue.brand_accent, fallback.profile.brandAccent),
      brandSurface: optionalText(venue.brand_surface, fallback.profile.brandSurface),
      brandText: optionalText(venue.brand_text, fallback.profile.brandText),
      logoText: text(venue.logo_text, fallback.profile.logoText),
      locationLabel: optionalText(venue.location_label, fallback.profile.locationLabel),
      inventoryLabel: optionalText(venue.inventory_label, fallback.profile.inventoryLabel),
      previewLabel: optionalText(venue.preview_label, fallback.profile.previewLabel),
      venueTypeLabel: optionalText(venue.venue_type_label, fallback.profile.venueTypeLabel),
      eventLabel: optionalText(venue.event_label, fallback.profile.eventLabel),
      eventPluralLabel: optionalText(venue.event_plural_label, fallback.profile.eventPluralLabel),
      clientLabel: optionalText(venue.client_label, fallback.profile.clientLabel),
      clientPluralLabel: optionalText(venue.client_plural_label, fallback.profile.clientPluralLabel),
      portalHeroTitle: optionalText(venue.portal_hero_title, fallback.profile.portalHeroTitle),
      portalHeroBody: optionalText(venue.portal_hero_body, fallback.profile.portalHeroBody),
      isSample: false,
    },
    packages: packages.length ? packages : fallback.packages,
    areas: areas.length ? areas : fallback.areas,
    inventory: inventory.length ? inventory : fallback.inventory,
    ownerAccessCode: fallback.ownerAccessCode,
    oneEventPerDate: venue.one_event_per_date ?? fallback.oneEventPerDate,
    ownerDashboardNote: text(venue.owner_dashboard_note, fallback.ownerDashboardNote),
  }
}
