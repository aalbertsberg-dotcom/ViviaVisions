import type { VendorPartner } from '../../config/vendorPartners'
import { supabase } from '../supabase'

type Row = Record<string, unknown>

export type ManagedPartner = {
  id: string
  partnerKey: string
  name: string
  category: string
  description: string
  badge: string
  websiteUrl: string
  contactEmail: string
  serviceArea: string
  logoUrl: string
  ctaLabel: string
  planTier: string
  monthlyPrice: number
  startDate: string
  endDate: string
  venueSlugs: string[]
  sortOrder: number
  isActive: boolean
  isFeatured: boolean
  isPlaceholder: boolean
  internalNotes: string
}

export type ManagedPartnerInput = Omit<ManagedPartner, 'id'> & { id?: string }

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
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || `partner-${Date.now()}`
}

function mapManaged(row: Row): ManagedPartner {
  return {
    id: text(row.id),
    partnerKey: text(row.partner_key),
    name: text(row.name),
    category: text(row.category),
    description: text(row.description),
    badge: text(row.badge, 'PARTNER'),
    websiteUrl: text(row.website_url),
    contactEmail: text(row.contact_email),
    serviceArea: text(row.service_area),
    logoUrl: text(row.logo_url),
    ctaLabel: text(row.cta_label, 'View partner'),
    planTier: text(row.plan_tier, 'Listing'),
    monthlyPrice: Math.max(0, number(row.monthly_price_cents) / 100),
    startDate: text(row.start_date),
    endDate: text(row.end_date),
    venueSlugs: Array.isArray(row.venue_slugs) ? row.venue_slugs.map(String) : [],
    sortOrder: number(row.sort_order),
    isActive: bool(row.is_active, true),
    isFeatured: bool(row.is_featured),
    isPlaceholder: bool(row.is_placeholder),
    internalNotes: text(row.internal_notes),
  }
}

function publicHref(partner: ManagedPartner) {
  if (partner.websiteUrl) return partner.websiteUrl
  return `mailto:hello@viviavisions.com?subject=${encodeURIComponent(`ViviaVisions partner inquiry: ${partner.name}`)}`
}

export function managedPartnerToPublic(partner: ManagedPartner): VendorPartner {
  return {
    key: partner.partnerKey,
    name: partner.name,
    category: partner.category,
    description: partner.description,
    badge: partner.badge,
    href: publicHref(partner),
    cta: partner.ctaLabel || (partner.websiteUrl ? 'Visit website' : 'Request information'),
    placeholder: partner.isPlaceholder,
    logoUrl: partner.logoUrl || undefined,
    serviceArea: partner.serviceArea || undefined,
    websiteUrl: partner.websiteUrl || undefined,
    venueSlugs: partner.venueSlugs,
    planTier: partner.planTier,
    featured: partner.isFeatured,
  }
}

export async function listPublicPartners(venueSlug: string): Promise<VendorPartner[]> {
  const { data, error } = await db()
    .from('vendor_partners')
    .select('*')
    .eq('is_active', true)
    .contains('venue_slugs', [venueSlug])
    .order('sort_order')
    .order('name')

  if (error) throw error
  return (data ?? []).map((row: Row) => managedPartnerToPublic(mapManaged(row)))
}

export async function listManagedPartners(): Promise<ManagedPartner[]> {
  const { data, error } = await db()
    .from('vendor_partners')
    .select('*')
    .order('is_active', { ascending: false })
    .order('sort_order')
    .order('name')

  if (error) throw error
  return (data ?? []).map((row: Row) => mapManaged(row))
}

export async function saveManagedPartner(input: ManagedPartnerInput): Promise<ManagedPartner> {
  const name = input.name.trim()
  if (!name) throw new Error('Partner name is required.')
  if (!input.category.trim()) throw new Error('Partner category is required.')
  if (!input.venueSlugs.length) throw new Error('Choose at least one venue placement.')

  const payload = {
    partner_key: input.partnerKey.trim() || slugify(name),
    name,
    category: input.category.trim(),
    description: input.description.trim(),
    badge: input.badge.trim() || 'PARTNER',
    website_url: input.websiteUrl.trim(),
    contact_email: input.contactEmail.trim().toLowerCase(),
    service_area: input.serviceArea.trim(),
    logo_url: input.logoUrl.trim(),
    cta_label: input.ctaLabel.trim() || (input.websiteUrl.trim() ? 'Visit website' : 'Request information'),
    plan_tier: input.planTier.trim() || 'Listing',
    monthly_price_cents: Math.max(0, Math.round((input.monthlyPrice || 0) * 100)),
    start_date: input.startDate || null,
    end_date: input.endDate || null,
    venue_slugs: input.venueSlugs,
    sort_order: Math.floor(input.sortOrder || 0),
    is_active: input.isActive,
    is_featured: input.isFeatured,
    is_placeholder: input.isPlaceholder,
    internal_notes: input.internalNotes.trim(),
    updated_at: new Date().toISOString(),
  }

  const query = input.id
    ? db().from('vendor_partners').update(payload).eq('id', input.id)
    : db().from('vendor_partners').insert(payload)

  const { data, error } = await query.select('*').single()
  if (error) throw error
  return mapManaged(data as Row)
}

export async function setManagedPartnerActive(id: string, isActive: boolean) {
  const { error } = await db()
    .from('vendor_partners')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}