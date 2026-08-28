import { supabase } from '../supabase'

function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.local.')
  return supabase
}

export async function signInWithPassword(email: string, password: string) {
  const client = requireSupabase()
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signUpWithPassword(email: string, password: string) {
  const client = requireSupabase()
  const { data, error } = await client.auth.signUp({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const client = requireSupabase()
  const { error } = await client.auth.signOut()
  if (error) throw error
}

export async function sendPasswordReset(email: string, redirectTo?: string) {
  const client = requireSupabase()
  const { data, error } = await client.auth.resetPasswordForEmail(email, redirectTo ? { redirectTo } : undefined)
  if (error) throw error
  return data
}

export async function claimClientEventAccess(venueSlug: string, accessSlug: string) {
  const client = requireSupabase()
  const { data, error } = await client.rpc('claim_client_event_access', {
    target_venue_slug: venueSlug,
    target_access_slug: accessSlug,
  })
  if (error) throw error
  if (!data) throw new Error('The client event could not be opened.')
  return String(data)
}

export async function getVenueStaffAccessBySlug(slug: string, userId: string) {
  const client = requireSupabase()

  const { data: venue, error: venueError } = await client
    .from('venues')
    .select('id, slug, short_name')
    .eq('slug', slug)
    .maybeSingle()

  if (venueError) throw venueError
  if (!venue) return { allowed: false, role: null as string | null, venueId: null as string | null }

  const { data: membership, error: membershipError } = await client
    .from('venue_memberships')
    .select('role')
    .eq('venue_id', venue.id)
    .eq('user_id', userId)
    .maybeSingle()

  if (membershipError) throw membershipError

  const role = membership?.role ?? null
  const allowed = role === 'owner' || role === 'staff'
  return { allowed, role, venueId: venue.id }
}