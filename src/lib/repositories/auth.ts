import { supabase } from '../supabase'

export type ClientAccessStatus = {
  contactType: 'primary' | 'partner'
  email: string
  accountExists: boolean
  emailConfirmed: boolean
  accessGranted: boolean
  revoked: boolean
}

export type ClientPortalMatch = {
  eventId: string
  accessSlug: string
  title: string
  eventDate: string
}

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

export async function signUpWithPassword(email: string, password: string, redirectTo?: string) {
  const client = requireSupabase()
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
  })
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

export async function updatePassword(password: string) {
  const client = requireSupabase()
  const { data, error } = await client.auth.updateUser({ password })
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

export async function claimMyClientEvents(venueSlug: string): Promise<ClientPortalMatch[]> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('claim_my_client_events', {
    target_venue_slug: venueSlug,
  })

  if (error) throw error

  return ((data ?? []) as Record<string, unknown>[]).map((row): ClientPortalMatch => ({
    eventId: String(row.event_id ?? ''),
    accessSlug: String(row.access_slug ?? ''),
    title: String(row.title ?? ''),
    eventDate: String(row.event_date ?? ''),
  })).filter((row: ClientPortalMatch) => Boolean(row.eventId && row.accessSlug))
}

export async function getEventClientAccessStatus(eventId: string): Promise<ClientAccessStatus[]> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('event_client_access_status', {
    target_event_id: eventId,
  })

  if (error) throw error

  return (data ?? []).map((row: Record<string, unknown>) => ({
    contactType: row.contact_type === 'partner' ? 'partner' : 'primary',
    email: String(row.email ?? ''),
    accountExists: row.account_exists === true,
    emailConfirmed: row.email_confirmed === true,
    accessGranted: row.access_granted === true,
    revoked: row.revoked === true,
  }))
}

export async function setEventClientAccess(eventId: string, email: string, allowed: boolean) {
  const client = requireSupabase()
  const { error } = await client.rpc('set_event_client_access', {
    target_event_id: eventId,
    target_email: email,
    target_allowed: allowed,
  })
  if (error) throw error
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