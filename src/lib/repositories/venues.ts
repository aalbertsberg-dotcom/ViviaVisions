import { supabase } from '../supabase'

function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase
}

export async function listPublishedVenues() {
  const client = requireSupabase()
  const { data, error } = await client
    .from('venues')
    .select('id, slug, name, short_name, tagline, website, address, phone, email, brand_primary, brand_accent, brand_surface, brand_text, logo_text, location_label, venue_type_label, event_label, client_label')
    .eq('is_published', true)
    .order('name')

  if (error) throw error
  return data
}

export async function getVenueBySlug(slug: string) {
  const client = requireSupabase()
  const { data, error } = await client.from('venues').select('*').eq('slug', slug).maybeSingle()
  if (error) throw error
  return data
}

export async function listVenueEvents(venueId: string) {
  const client = requireSupabase()
  const { data, error } = await client
    .from('events')
    .select('*, clients(*), venue_packages(*)')
    .eq('venue_id', venueId)
    .order('event_date')

  if (error) throw error
  return data
}
