import type { WeddingStatus, WeddingWorkspace } from '../../types'
import { supabase } from '../supabase'

function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase
}

function workspaceStatus(value: unknown): WeddingStatus {
  switch (String(value ?? '').toLowerCase()) {
    case 'designing':
      return 'Designing'
    case 'ready':
    case 'completed':
      return 'Ready'
    case 'not_started':
    case 'cancelled':
    default:
      return 'Not started'
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function text(value: unknown, fallback = '') {
  return value === null || value === undefined ? fallback : String(value)
}

export async function listVenueEventWorkspaces(
  venueSlug: string,
  appVenueId: string,
  existingWorkspaces: WeddingWorkspace[] = [],
): Promise<WeddingWorkspace[]> {
  const client = requireSupabase()

  const { data: venue, error: venueError } = await client
    .from('venues')
    .select('id')
    .eq('slug', venueSlug)
    .maybeSingle()

  if (venueError) throw venueError
  if (!venue) throw new Error(`Venue "${venueSlug}" was not found.`)

  const [eventsResult, clientsResult, packagesResult, spacesResult] = await Promise.all([
    client
      .from('events')
      .select('*')
      .eq('venue_id', venue.id)
      .order('event_date'),
    client
      .from('clients')
      .select('id, display_name, primary_email, secondary_email')
      .eq('venue_id', venue.id),
    client
      .from('venue_packages')
      .select('id, external_key')
      .eq('venue_id', venue.id),
    client
      .from('venue_spaces')
      .select('id, external_key')
      .eq('venue_id', venue.id),
  ])

  if (eventsResult.error) throw eventsResult.error
  if (clientsResult.error) throw clientsResult.error
  if (packagesResult.error) throw packagesResult.error
  if (spacesResult.error) throw spacesResult.error

  const clientsById = new Map((clientsResult.data ?? []).map((row) => [row.id, row]))
  const packagesById = new Map((packagesResult.data ?? []).map((row) => [row.id, row.external_key]))
  const spacesById = new Map((spacesResult.data ?? []).map((row) => [row.id, row.external_key]))
  const existingBySlug = new Map(existingWorkspaces.map((workspace) => [workspace.accessSlug, workspace]))

  return (eventsResult.data ?? []).map((row) => {
    const accessSlug = text(row.access_slug, row.id)
    const previous = existingBySlug.get(accessSlug)
    const linkedClient = row.client_id ? clientsById.get(row.client_id) : undefined
    const metadata = asRecord(row.metadata)

    return {
      id: row.id,
      venueId: appVenueId,
      accessSlug,
      accessCode: text(metadata.preview_access_code, previous?.accessCode ?? ''),
      status: workspaceStatus(row.status),
      paymentStepsCompleted: Number(row.payment_steps_completed ?? 0),
      profile: {
        couple: text(linkedClient?.display_name, text(row.title)),
        date: text(row.event_date),
        guests: Number(row.guest_count ?? 0),
        packageId: text(row.package_id ? packagesById.get(row.package_id) : '', previous?.profile.packageId ?? ''),
        ceremonyArea: text(row.ceremony_space_id ? spacesById.get(row.ceremony_space_id) : '', previous?.profile.ceremonyArea ?? ''),
        receptionArea: text(row.reception_space_id ? spacesById.get(row.reception_space_id) : '', previous?.profile.receptionArea ?? ''),
        primaryEmail: text(linkedClient?.primary_email, previous?.profile.primaryEmail ?? ''),
        partnerEmail: text(linkedClient?.secondary_email, previous?.profile.partnerEmail ?? ''),
        contractSigned: Boolean(row.contract_signed),
        reservationPaid: Boolean(row.reservation_paid),
        notes: text(row.notes),
      },
      // These are migrated in later backend steps. Preserve current preview
      // content while the event/client records become database-backed.
      selections: previous?.selections ?? [],
      placedItems: previous?.placedItems ?? [],
      messages: previous?.messages ?? [],
    }
  })
}
