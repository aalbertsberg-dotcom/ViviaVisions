import type {
  MessageAttachment,
  MessageContext,
  PlacedItem,
  PlannerObjectType,
  Selection,
  WeddingMessage,
  WeddingProfile,
  WeddingStatus,
  WeddingWorkspace,
} from '../../types'
import { supabase } from '../supabase'

type CreateVenueEventInput = {
  couple: string
  date: string
  guests: number
  packageId: string
  primaryEmail: string
  partnerEmail?: string
  ceremonyArea: string
  receptionArea: string
}

function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function text(value: unknown, fallback = '') {
  return value === null || value === undefined ? fallback : String(value)
}

function bool(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback
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

function databaseStatus(value: WeddingStatus) {
  switch (value) {
    case 'Designing':
      return 'designing'
    case 'Ready':
      return 'ready'
    case 'Not started':
    default:
      return 'not_started'
  }
}

const plannerTypes = new Set<PlannerObjectType>([
  'round-table',
  'banquet-table',
  'chair',
  'dance-floor',
  'bar',
  'cake-table',
  'arch',
  'decor',
])

function plannerType(value: unknown): PlannerObjectType {
  const candidate = text(value) as PlannerObjectType
  return plannerTypes.has(candidate) ? candidate : 'decor'
}

function parseAttachments(value: unknown): MessageAttachment[] {
  if (!Array.isArray(value)) return []

  return value.flatMap((entry) => {
    const item = asRecord(entry)
    const id = text(item.id)
    const name = text(item.name)
    const mimeType = text(item.mimeType)
    const dataUrl = text(item.dataUrl)
    const size = Number(item.size ?? 0)

    if (!id || !name || !mimeType || !dataUrl) return []

    return [{
      id,
      name,
      mimeType,
      dataUrl,
      size: Number.isFinite(size) ? size : 0,
    }]
  })
}

function parseContext(value: unknown): MessageContext | undefined {
  const item = asRecord(value)
  const kind = item.kind
  const id = text(item.id)
  const label = text(item.label)

  if ((kind === 'inventory' || kind === 'area') && id && label) {
    return { kind, id, label }
  }

  return undefined
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'event'
}

async function venueIdBySlug(slug: string) {
  const client = requireSupabase()
  const { data, error } = await client
    .from('venues')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error(`Venue "${slug}" was not found.`)
  return data.id as string
}

async function eventVenue(eventId: string) {
  const client = requireSupabase()
  const { data, error } = await client
    .from('events')
    .select('venue_id, client_id')
    .eq('id', eventId)
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('The event was not found.')
  return data
}

async function packageUuid(venueId: string, externalKey: string) {
  if (!externalKey) return null
  const client = requireSupabase()
  const { data, error } = await client
    .from('venue_packages')
    .select('id')
    .eq('venue_id', venueId)
    .eq('external_key', externalKey)
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error(`Package "${externalKey}" was not found in the venue database.`)
  return data.id as string
}

async function spaceUuid(venueId: string, externalKey: string) {
  if (!externalKey) return null
  const client = requireSupabase()
  const { data, error } = await client
    .from('venue_spaces')
    .select('id')
    .eq('venue_id', venueId)
    .eq('external_key', externalKey)
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error(`Space "${externalKey}" was not found in the venue database.`)
  return data.id as string
}

export async function listVenueEventWorkspaces(
  venueSlug: string,
  appVenueId: string,
  existingWorkspaces: WeddingWorkspace[] = [],
): Promise<WeddingWorkspace[]> {
  const client = requireSupabase()
  const venueId = await venueIdBySlug(venueSlug)

  const [eventsResult, clientsResult, packagesResult, spacesResult, inventoryResult] = await Promise.all([
    client
      .from('events')
      .select('*')
      .eq('venue_id', venueId)
      .order('event_date'),
    client
      .from('clients')
      .select('id, display_name, primary_email, secondary_email')
      .eq('venue_id', venueId),
    client
      .from('venue_packages')
      .select('id, external_key')
      .eq('venue_id', venueId),
    client
      .from('venue_spaces')
      .select('id, external_key, name')
      .eq('venue_id', venueId),
    client
      .from('inventory_items')
      .select('id, external_key')
      .eq('venue_id', venueId),
  ])

  if (eventsResult.error) throw eventsResult.error
  if (clientsResult.error) throw clientsResult.error
  if (packagesResult.error) throw packagesResult.error
  if (spacesResult.error) throw spacesResult.error
  if (inventoryResult.error) throw inventoryResult.error

  const eventRows = eventsResult.data ?? []
  const eventIds = eventRows.map((row) => row.id)

  let selectionRows: typeof eventRows = []
  let layoutRows: typeof eventRows = []
  let messageRows: typeof eventRows = []
  let layoutItemRows: typeof eventRows = []

  if (eventIds.length) {
    const [selectionsResult, layoutsResult, messagesResult] = await Promise.all([
      client
        .from('event_selections')
        .select('*')
        .in('event_id', eventIds),
      client
        .from('layouts')
        .select('*')
        .in('event_id', eventIds)
        .order('created_at'),
      client
        .from('messages')
        .select('*')
        .in('event_id', eventIds)
        .order('created_at'),
    ])

    if (selectionsResult.error) throw selectionsResult.error
    if (layoutsResult.error) throw layoutsResult.error
    if (messagesResult.error) throw messagesResult.error

    selectionRows = selectionsResult.data ?? []
    layoutRows = layoutsResult.data ?? []
    messageRows = messagesResult.data ?? []

    const layoutIds = layoutRows.map((row) => row.id)
    if (layoutIds.length) {
      const layoutItemsResult = await client
        .from('layout_items')
        .select('*')
        .in('layout_id', layoutIds)
        .order('created_at')

      if (layoutItemsResult.error) throw layoutItemsResult.error
      layoutItemRows = layoutItemsResult.data ?? []
    }
  }

  const clientsById = new Map((clientsResult.data ?? []).map((row) => [row.id, row]))
  const packagesById = new Map((packagesResult.data ?? []).map((row) => [row.id, row.external_key]))
  const spacesById = new Map((spacesResult.data ?? []).map((row) => [row.id, row.external_key]))
  const inventoryById = new Map((inventoryResult.data ?? []).map((row) => [row.id, row.external_key]))
  const existingBySlug = new Map(existingWorkspaces.map((workspace) => [workspace.accessSlug, workspace]))

  const selectionsByEvent = new Map<string, Selection[]>()
  for (const row of selectionRows) {
    const itemId = inventoryById.get(row.inventory_item_id)
    if (!itemId) continue
    const current = selectionsByEvent.get(row.event_id) ?? []
    current.push({ itemId, quantity: Number(row.quantity ?? 0) })
    selectionsByEvent.set(row.event_id, current)
  }

  const layoutItemsByLayout = new Map<string, PlacedItem[]>()
  for (const row of layoutItemRows) {
    const metadata = asRecord(row.metadata)
    const inventoryItemId = row.inventory_item_id
      ? inventoryById.get(row.inventory_item_id)
      : text(metadata.inventory_external_key)
    const parentTableId = text(metadata.parent_app_id)
    const appId = text(metadata.app_id, row.id)

    const item: PlacedItem = {
      id: appId,
      type: plannerType(row.object_type),
      label: text(row.label, 'Item'),
      x: Number(row.x ?? 0),
      y: Number(row.y ?? 0),
      rotation: Number(row.rotation ?? 0),
      scale: Number(row.scale ?? 1),
      ...(inventoryItemId ? { inventoryItemId } : {}),
      ...(parentTableId ? { parentTableId } : {}),
    }

    const current = layoutItemsByLayout.get(row.layout_id) ?? []
    current.push(item)
    layoutItemsByLayout.set(row.layout_id, current)
  }

  const placedItemsByEvent = new Map<string, PlacedItem[]>()
  for (const layout of layoutRows) {
    const areaId = layout.venue_space_id
      ? spacesById.get(layout.venue_space_id)
      : ''
    const items = (layoutItemsByLayout.get(layout.id) ?? []).map((item) => ({
      ...item,
      ...(areaId ? { areaId } : {}),
    }))
    const current = placedItemsByEvent.get(layout.event_id) ?? []
    current.push(...items)
    placedItemsByEvent.set(layout.event_id, current)
  }

  const messagesByEvent = new Map<string, WeddingMessage[]>()
  for (const row of messageRows) {
    const metadata = asRecord(row.metadata)
    const senderRole = row.sender_role === 'venue' ? 'venue' : 'bride'
    const current = messagesByEvent.get(row.event_id) ?? []

    current.push({
      id: text(metadata.app_id, row.id),
      senderRole,
      senderName: text(row.sender_name),
      body: text(row.body),
      timestamp: text(row.created_at),
      attachments: parseAttachments(metadata.attachments),
      context: parseContext(metadata.context),
      readByBride: bool(metadata.read_by_bride, senderRole === 'bride'),
      readByVenue: bool(metadata.read_by_venue, senderRole === 'venue'),
    })

    messagesByEvent.set(row.event_id, current)
  }

  return eventRows.map((row) => {
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
        ceremonyArea: text(row.ceremony_space_id ? spacesById.get(row.ceremony_space_id) : '', ''),
        receptionArea: text(row.reception_space_id ? spacesById.get(row.reception_space_id) : '', ''),
        primaryEmail: text(linkedClient?.primary_email),
        partnerEmail: text(linkedClient?.secondary_email),
        contractSigned: Boolean(row.contract_signed),
        reservationPaid: Boolean(row.reservation_paid),
        notes: text(row.notes),
      },
      selections: selectionsByEvent.get(row.id) ?? [],
      placedItems: placedItemsByEvent.get(row.id) ?? [],
      messages: messagesByEvent.get(row.id) ?? [],
    }
  })
}

export async function createVenueEventWorkspace(
  venueSlug: string,
  appVenueId: string,
  input: CreateVenueEventInput,
): Promise<WeddingWorkspace> {
  const client = requireSupabase()
  const venueId = await venueIdBySlug(venueSlug)

  const [packageId, ceremonySpaceId, receptionSpaceId] = await Promise.all([
    packageUuid(venueId, input.packageId),
    spaceUuid(venueId, input.ceremonyArea),
    spaceUuid(venueId, input.receptionArea),
  ])

  const baseSlug = slugify(input.couple)
  const { data: existingSlugs, error: slugError } = await client
    .from('events')
    .select('access_slug')
    .eq('venue_id', venueId)
    .like('access_slug', `${baseSlug}%`)

  if (slugError) throw slugError

  const usedSlugs = new Set((existingSlugs ?? []).map((row) => row.access_slug))
  let accessSlug = baseSlug
  let suffix = 2
  while (usedSlugs.has(accessSlug)) accessSlug = `${baseSlug}-${suffix++}`

  const accessCode = String(Math.floor(100000 + Math.random() * 900000))

  const clientId = crypto.randomUUID()
  const eventId = crypto.randomUUID()

  const { error: clientError } = await client
    .from('clients')
    .insert({
      id: clientId,
      venue_id: venueId,
      display_name: input.couple.trim(),
      primary_email: input.primaryEmail.trim() || null,
      secondary_email: input.partnerEmail?.trim() || null,
    })

  if (clientError) throw clientError

  const { error: eventError } = await client
    .from('events')
    .insert({
      id: eventId,
      venue_id: venueId,
      client_id: clientId,
      package_id: packageId,
      access_slug: accessSlug,
      title: input.couple.trim(),
      event_type: 'wedding',
      event_date: input.date,
      guest_count: Math.max(1, input.guests || 1),
      status: 'not_started',
      ceremony_space_id: ceremonySpaceId,
      reception_space_id: receptionSpaceId,
      notes: '',
      contract_signed: true,
      reservation_paid: true,
      payment_steps_completed: 1,
      metadata: {
        preview_access_code: accessCode,
      },
    })

  if (eventError) {
    await client.from('clients').delete().eq('id', clientId)
    throw eventError
  }

  return {
    id: eventId,
    venueId: appVenueId,
    accessSlug,
    accessCode,
    status: 'Not started',
    paymentStepsCompleted: 1,
    profile: {
      couple: input.couple.trim(),
      date: input.date,
      guests: Math.max(1, input.guests || 1),
      packageId: input.packageId,
      ceremonyArea: input.ceremonyArea,
      receptionArea: input.receptionArea,
      primaryEmail: input.primaryEmail.trim(),
      partnerEmail: input.partnerEmail?.trim() ?? '',
      contractSigned: true,
      reservationPaid: true,
      notes: '',
    },
    selections: [],
    placedItems: [],
    messages: [],
  }
}

export async function saveEventProfile(eventId: string, profile: WeddingProfile) {
  const client = requireSupabase()
  const event = await eventVenue(eventId)

  const [packageId, ceremonySpaceId, receptionSpaceId] = await Promise.all([
    packageUuid(event.venue_id, profile.packageId),
    spaceUuid(event.venue_id, profile.ceremonyArea),
    spaceUuid(event.venue_id, profile.receptionArea),
  ])

  const { error: eventError } = await client
    .from('events')
    .update({
      package_id: packageId,
      title: profile.couple.trim(),
      event_date: profile.date,
      guest_count: Math.max(1, profile.guests || 1),
      ceremony_space_id: ceremonySpaceId,
      reception_space_id: receptionSpaceId,
      notes: profile.notes,
      contract_signed: profile.contractSigned,
      reservation_paid: profile.reservationPaid,
    })
    .eq('id', eventId)

  if (eventError) throw eventError

  if (event.client_id) {
    const { error: clientError } = await client
      .from('clients')
      .update({
        display_name: profile.couple.trim(),
        primary_email: profile.primaryEmail.trim() || null,
        secondary_email: profile.partnerEmail.trim() || null,
      })
      .eq('id', event.client_id)

    if (clientError) throw clientError
  }
}

export async function setEventSelection(eventId: string, inventoryExternalKey: string, quantity: number) {
  const client = requireSupabase()
  const event = await eventVenue(eventId)

  const { data: inventoryItem, error: inventoryError } = await client
    .from('inventory_items')
    .select('id')
    .eq('venue_id', event.venue_id)
    .eq('external_key', inventoryExternalKey)
    .maybeSingle()

  if (inventoryError) throw inventoryError
  if (!inventoryItem) throw new Error(`Inventory item "${inventoryExternalKey}" was not found.`)

  if (quantity <= 0) {
    const { error } = await client
      .from('event_selections')
      .delete()
      .eq('event_id', eventId)
      .eq('inventory_item_id', inventoryItem.id)

    if (error) throw error
    return
  }

  const { error } = await client
    .from('event_selections')
    .upsert({
      event_id: eventId,
      inventory_item_id: inventoryItem.id,
      quantity,
    }, {
      onConflict: 'event_id,inventory_item_id',
    })

  if (error) throw error

  const { error: statusError } = await client
    .from('events')
    .update({ status: databaseStatus('Designing') })
    .eq('id', eventId)

  if (statusError) throw statusError
}

export async function saveEventLayoutItems(eventId: string, placedItems: PlacedItem[]) {
  const client = requireSupabase()
  const event = await eventVenue(eventId)

  const [spacesResult, inventoryResult] = await Promise.all([
    client
      .from('venue_spaces')
      .select('id, external_key, name')
      .eq('venue_id', event.venue_id),
    client
      .from('inventory_items')
      .select('id, external_key')
      .eq('venue_id', event.venue_id),
  ])

  if (spacesResult.error) throw spacesResult.error
  if (inventoryResult.error) throw inventoryResult.error

  const spacesByKey = new Map((spacesResult.data ?? []).map((row) => [row.external_key, row]))
  const inventoryByKey = new Map((inventoryResult.data ?? []).map((row) => [row.external_key, row.id]))

  const { error: deleteError } = await client
    .from('layouts')
    .delete()
    .eq('event_id', eventId)

  if (deleteError) throw deleteError
  if (!placedItems.length) return

  const grouped = new Map<string, PlacedItem[]>()
  for (const item of placedItems) {
    const areaKey = item.areaId ?? ''
    const current = grouped.get(areaKey) ?? []
    current.push(item)
    grouped.set(areaKey, current)
  }

  let layoutIndex = 0
  for (const [areaKey, items] of grouped) {
    const space = spacesByKey.get(areaKey)
    const { data: layout, error: layoutError } = await client
      .from('layouts')
      .insert({
        event_id: eventId,
        venue_space_id: space?.id ?? null,
        name: space?.name ? `${space.name} Layout` : 'Event Layout',
        is_primary: layoutIndex === 0,
      })
      .select('id')
      .single()

    if (layoutError) throw layoutError

    const rows = items.map((item) => ({
      layout_id: layout.id,
      inventory_item_id: item.inventoryItemId ? inventoryByKey.get(item.inventoryItemId) ?? null : null,
      parent_item_id: null,
      object_type: item.type,
      label: item.label,
      x: item.x,
      y: item.y,
      rotation: item.rotation,
      scale: item.scale ?? 1,
      metadata: {
        app_id: item.id,
        parent_app_id: item.parentTableId ?? null,
        inventory_external_key: item.inventoryItemId ?? null,
        area_external_key: (item.areaId ?? areaKey) || null,
      },
    }))

    if (rows.length) {
      const { error: itemsError } = await client
        .from('layout_items')
        .insert(rows)

      if (itemsError) throw itemsError
    }

    layoutIndex += 1
  }

  const { error: statusError } = await client
    .from('events')
    .update({ status: databaseStatus('Designing') })
    .eq('id', eventId)

  if (statusError) throw statusError
}

export async function saveEventMessages(eventId: string, messages: WeddingMessage[]) {
  const client = requireSupabase()

  const { error: deleteError } = await client
    .from('messages')
    .delete()
    .eq('event_id', eventId)

  if (deleteError) throw deleteError
  if (!messages.length) return

  const rows = messages.map((message) => ({
    event_id: eventId,
    sender_user_id: null,
    sender_role: message.senderRole === 'venue' ? 'venue' : 'client',
    sender_name: message.senderName,
    body: message.body,
    context_kind: message.context?.kind ?? null,
    context_id: null,
    context_label: message.context?.label ?? null,
    created_at: message.timestamp,
    metadata: {
      app_id: message.id,
      attachments: message.attachments,
      context: message.context ?? null,
      read_by_bride: message.readByBride,
      read_by_venue: message.readByVenue,
    },
  }))

  const { error } = await client
    .from('messages')
    .insert(rows)

  if (error) throw error
}
