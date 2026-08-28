import type { CSSProperties } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import Header, { type PageKey } from './components/Header'
import Home from './pages/Home'
import Venues from './pages/Venues'
import ForVenues from './pages/ForVenues'
import SignIn from './pages/SignIn'
import VenuePortal from './pages/VenuePortal'
import Catalog from './pages/Catalog'
import Wedding from './pages/Wedding'
import Planner from './pages/Planner'
import MediaLibrary from './pages/MediaLibrary'
import AiPreview from './pages/AiPreview'
import Messages from './pages/Messages'
import Calendar from './pages/Calendar'
import SetupSheet from './pages/SetupSheet'
import Admin from './pages/Admin'
import ManageEvents from './pages/ManageEvents'
import PlatformAdmin from './pages/PlatformAdmin'
import { PLATFORM_NAME, POWERED_BY_PLATFORM, platformConfig } from './config/platform'
import { isDemoClientWorkspace } from './config/demo'
import { supabase } from './lib/supabase'
import { claimClientEventAccess, claimMyClientEvents, getVenueStaffAccessBySlug, signInWithPassword, signOut as signOutSupabase, signUpWithPassword } from './lib/repositories/auth'
import { appendClientEventMessages, cancelVenueEvent, createVenueEventWorkspace, listVenueEventWorkspaces, markClientEventMessagesRead, permanentDeleteVenueEvent, reopenVenueEvent, resetEventPlanning, restoreVenueEvent, saveClientEventPlanningProfile, saveEventLayoutItems, saveEventMessages, saveEventProfile, setEventSelection, softDeleteVenueEvent } from './lib/repositories/events'
import { loadVenueConfigFromSupabase } from './lib/repositories/venueConfig'
import CoupleAccess from './pages/CoupleAccess'
import { applyVenueConfigOverride, chandelierOaks, foundryRivergate, itemAllowedForTier, juniperStone, packageById, venueConfigById, venueConfigBySlug, venueConfigs } from './data'
import type { MessageContext, MessageRole, PlacedItem, VenueLead, WeddingMessage, WeddingProfile, WeddingStatus, WeddingWorkspace } from './types'


const chandelierMessages: WeddingMessage[] = [
  { id: 'sample-msg-1', senderRole: 'bride', senderName: 'Sarah & John', body: 'Hi! We started looking through the Pinrose Prop Shop. Could we use the gold lanterns around the guest tables?', timestamp: '2026-08-18T14:22:00-05:00', attachments: [], context: { kind: 'inventory', id: 'gold-lantern', label: 'Gold Lantern Set' }, readByBride: true, readByVenue: true },
  { id: 'sample-msg-2', senderRole: 'venue', senderName: 'Chandelier Oaks Team', body: 'Absolutely. Keep that combination in your selections and we can use the final setup sheet when the date gets closer.', timestamp: '2026-08-18T15:06:00-05:00', attachments: [], readByBride: true, readByVenue: true },
  { id: 'sample-msg-3', senderRole: 'bride', senderName: 'Sarah & John', body: 'Perfect. We also started a layout for the Pecan Pavilion so you can see the general table and dance-floor placement.', timestamp: '2026-08-19T10:41:00-05:00', attachments: [], context: { kind: 'area', id: 'pecan-pavilion', label: 'Pecan Pavilion' }, readByBride: true, readByVenue: true },
  { id: 'sample-msg-4', senderRole: 'venue', senderName: 'Chandelier Oaks Team', body: 'I see it. Keep using the designer and this thread for changes so everything stays attached to your wedding workspace.', timestamp: '2026-08-20T09:18:00-05:00', attachments: [], context: { kind: 'area', id: 'pecan-pavilion', label: 'Pecan Pavilion' }, readByBride: false, readByVenue: true },
]

const chandelierPlan: PlacedItem[] = [
  { id: 'starter-1', type: 'round-table', x: 140, y: 115, rotation: 0, scale: 1, label: 'Round table', areaId: 'pecan-pavilion' },
  { id: 'starter-2', type: 'round-table', x: 315, y: 115, rotation: 0, scale: 1, label: 'Round table', areaId: 'pecan-pavilion' },
  { id: 'starter-3', type: 'round-table', x: 140, y: 275, rotation: 0, scale: 1, label: 'Round table', areaId: 'pecan-pavilion' },
  { id: 'starter-4', type: 'round-table', x: 315, y: 275, rotation: 0, scale: 1, label: 'Round table', areaId: 'pecan-pavilion' },
  { id: 'starter-5', type: 'dance-floor', x: 500, y: 175, rotation: 0, scale: 1, label: 'Dance floor', areaId: 'pecan-pavilion' },
  { id: 'starter-6', type: 'bar', x: 600, y: 350, rotation: 0, scale: 1, label: 'Bar', areaId: 'pecan-pavilion' },
  { id: 'starter-7', type: 'arch', x: 330, y: 90, rotation: 0, scale: 1, label: 'Ceremony arch', areaId: 'under-the-oaks' },
]

const juniperPlan: PlacedItem[] = [
  { id: 'juniper-table-1', type: 'banquet-table', x: 145, y: 120, rotation: 0, scale: 1, label: 'Banquet table', areaId: 'glass-hall' },
  { id: 'juniper-table-2', type: 'banquet-table', x: 145, y: 245, rotation: 0, scale: 1, label: 'Banquet table', areaId: 'glass-hall' },
  { id: 'juniper-table-3', type: 'banquet-table', x: 370, y: 120, rotation: 0, scale: 1, label: 'Banquet table', areaId: 'glass-hall' },
  { id: 'juniper-dance', type: 'dance-floor', x: 500, y: 220, rotation: 0, scale: .95, label: 'Dance floor', areaId: 'glass-hall' },
  { id: 'juniper-arch', type: 'arch', x: 330, y: 90, rotation: 0, scale: 1, label: 'Ceremony arch', areaId: 'stone-courtyard' },
]

const foundryPlan: PlacedItem[] = [
  { id: 'foundry-stage', type: 'banquet-table', x: 330, y: 78, rotation: 0, scale: 1.8, label: 'Presentation stage', areaId: 'fr-main-hall' },
  { id: 'foundry-table-1', type: 'banquet-table', x: 155, y: 165, rotation: 0, scale: 1, label: 'Training table', areaId: 'fr-main-hall' },
  { id: 'foundry-table-2', type: 'banquet-table', x: 365, y: 165, rotation: 0, scale: 1, label: 'Training table', areaId: 'fr-main-hall' },
  { id: 'foundry-table-3', type: 'banquet-table', x: 155, y: 285, rotation: 0, scale: 1, label: 'Training table', areaId: 'fr-main-hall' },
  { id: 'foundry-table-4', type: 'banquet-table', x: 365, y: 285, rotation: 0, scale: 1, label: 'Training table', areaId: 'fr-main-hall' },
  { id: 'foundry-bar', type: 'bar', x: 585, y: 345, rotation: 0, scale: 1, label: 'Refreshment station', areaId: 'fr-main-hall' },
]

const previewWeddings: WeddingWorkspace[] = [
  { id: 'wedding-sarah-john', venueId: chandelierOaks.id, accessSlug: 'sarah-john', accessCode: '111111', status: 'Designing', paymentStepsCompleted: 2, profile: { couple: 'Sarah & John', date: '2026-10-17', guests: 125, packageId: 'weekend', ceremonyArea: 'under-the-oaks', receptionArea: 'pecan-pavilion', primaryEmail: 'sarah@example.com', partnerEmail: 'john@example.com', contractSigned: true, reservationPaid: true, notes: 'Use warm lanterns and greenery on guest tables. Keep the pavilion entrance simple and leave plenty of dance-floor space.' }, selections: [{ itemId: 'gold-lantern', quantity: 12 }, { itemId: 'french-doors', quantity: 1 }, { itemId: 'green-wall', quantity: 1 }], placedItems: chandelierPlan, messages: chandelierMessages },
  { id: 'wedding-ashley-mark', venueId: chandelierOaks.id, accessSlug: 'ashley-mark', accessCode: '222222', status: 'Designing', paymentStepsCompleted: 1, profile: { couple: 'Ashley & Mark', date: '2026-10-24', guests: 58, packageId: 'classic', ceremonyArea: 'hilltop-gazebo', receptionArea: 'pecan-pavilion', primaryEmail: 'ashley@example.com', partnerEmail: 'mark@example.com', contractSigned: true, reservationPaid: true, notes: 'Simple ceremony at the gazebo and a traditional reception in the pavilion.' }, selections: [{ itemId: 'gold-lantern', quantity: 8 }, { itemId: 'welcome-easel', quantity: 1 }], placedItems: [{ id: 'ashley-table-1', type: 'round-table', x: 175, y: 145, rotation: 0, scale: 1, label: 'Round table', areaId: 'pecan-pavilion' }, { id: 'ashley-table-2', type: 'round-table', x: 355, y: 145, rotation: 0, scale: 1, label: 'Round table', areaId: 'pecan-pavilion' }, { id: 'ashley-dance', type: 'dance-floor', x: 520, y: 220, rotation: 0, scale: .9, label: 'Dance floor', areaId: 'pecan-pavilion' }], messages: [{ id: 'ashley-msg-1', senderRole: 'bride', senderName: 'Ashley & Mark', body: 'Can we keep the gazebo ceremony very simple and move most of the décor to the pavilion?', timestamp: '2026-08-19T16:10:00-05:00', attachments: [], context: { kind: 'area', id: 'hilltop-gazebo', label: 'Hilltop Gazebo' }, readByBride: true, readByVenue: false }] },
  { id: 'wedding-jennifer-matt', venueId: chandelierOaks.id, accessSlug: 'jennifer-matt', accessCode: '333333', status: 'Not started', paymentStepsCompleted: 1, profile: { couple: 'Jennifer & Matt', date: '2026-11-07', guests: 210, packageId: 'luxury', ceremonyArea: 'under-the-oaks', receptionArea: 'pecan-pavilion', primaryEmail: 'jennifer@example.com', partnerEmail: 'matt@example.com', contractSigned: true, reservationPaid: true, notes: '' }, selections: [], placedItems: [], messages: [] },
  { id: 'wedding-olivia-james', venueId: juniperStone.id, accessSlug: 'olivia-james', accessCode: '444444', status: 'Designing', paymentStepsCompleted: 2, profile: { couple: 'Olivia & James', date: '2026-09-12', guests: 132, packageId: 'js-signature', ceremonyArea: 'stone-courtyard', receptionArea: 'glass-hall', primaryEmail: 'olivia@example.com', partnerEmail: 'james@example.com', contractSigned: true, reservationPaid: true, notes: 'Long banquet tables, warm copper accents and a clean ceremony frame.' }, selections: [{ itemId: 'js-smoked-vases', quantity: 20 }, { itemId: 'js-copper-stands', quantity: 8 }, { itemId: 'js-oak-arch', quantity: 1 }], placedItems: juniperPlan, messages: [{ id: 'juniper-msg-1', senderRole: 'bride', senderName: 'Olivia & James', body: 'Can we keep the Glass Hall tables long and clean, with the copper stands only on every other table?', timestamp: '2026-08-20T11:15:00-05:00', attachments: [], context: { kind: 'area', id: 'glass-hall', label: 'Glass Hall' }, readByBride: true, readByVenue: false }] },
  { id: 'wedding-maya-theo', venueId: juniperStone.id, accessSlug: 'maya-theo', accessCode: '555555', status: 'Ready', paymentStepsCompleted: 3, profile: { couple: 'Maya & Theo', date: '2026-11-21', guests: 76, packageId: 'js-essential', ceremonyArea: 'orchard-lawn', receptionArea: 'glass-hall', primaryEmail: 'maya@example.com', partnerEmail: 'theo@example.com', contractSigned: true, reservationPaid: true, notes: 'Simple orchard ceremony with mostly candlelight and bud vases inside.' }, selections: [{ itemId: 'js-smoked-vases', quantity: 28 }, { itemId: 'js-hurricanes', quantity: 24 }], placedItems: [], messages: [] },
  { id: 'event-northstar-summit', venueId: foundryRivergate.id, accessSlug: 'northstar-health-summit', accessCode: '666666', status: 'Designing', paymentStepsCompleted: 2, profile: { couple: 'Northstar Health Leadership Summit', date: '2026-10-08', guests: 180, packageId: 'fr-signature', ceremonyArea: 'fr-gallery', receptionArea: 'fr-main-hall', primaryEmail: 'events@northstar.example', partnerEmail: 'operations@northstar.example', contractSigned: true, reservationPaid: true, notes: 'Classroom seating in the Main Hall, registration in the Gallery, stage centered on the north wall and clear sponsor space near entry.' }, selections: [{ itemId: 'fr-stage', quantity: 6 }, { itemId: 'fr-podium', quantity: 1 }, { itemId: 'fr-uplights', quantity: 18 }], placedItems: foundryPlan, messages: [{ id: 'foundry-msg-1', senderRole: 'bride', senderName: 'Northstar Health Events Team', body: 'Can we keep registration in the Gallery and leave the Main Hall entry clear for sponsor displays?', timestamp: '2026-08-20T13:20:00-05:00', attachments: [], context: { kind: 'area', id: 'fr-gallery', label: 'Gallery' }, readByBride: true, readByVenue: false }] },
  { id: 'event-river-city-gala', venueId: foundryRivergate.id, accessSlug: 'river-city-foundation-gala', accessCode: '777777', status: 'Ready', paymentStepsCompleted: 3, profile: { couple: 'River City Foundation Gala', date: '2026-11-14', guests: 240, packageId: 'fr-buyout', ceremonyArea: 'fr-gallery', receptionArea: 'fr-main-hall', primaryEmail: 'gala@rivercityfoundation.example', partnerEmail: 'director@rivercityfoundation.example', contractSigned: true, reservationPaid: true, notes: 'Black-tie gala with cocktail reception in the Gallery, dinner in Main Hall and rooftop donor reception after awards.' }, selections: [{ itemId: 'fr-cocktail', quantity: 16 }, { itemId: 'fr-uplights', quantity: 28 }, { itemId: 'fr-lounge', quantity: 3 }, { itemId: 'fr-linens', quantity: 24 }], placedItems: [], messages: [] },
]

type RouteState = { page: PageKey; coupleSlug: string | null; venueSlug: string | null }
const scopedPages: PageKey[] = ['catalog','wedding','planner','media','ai-preview','messages','calendar','summary','manage-events']
const venueAdminPages: PageKey[] = ['admin','calendar','manage-events','catalog','wedding','planner','media','ai-preview','messages','summary']
const CLIENT_PORTAL_SLUG = '__client_portal__'

function parseRoute(): RouteState {
  const value = window.location.hash.replace(/^#\/?/, '')
  const parts = value.split('/').filter(Boolean)
  if (!parts.length) return { page: 'home', coupleSlug: null, venueSlug: null }
  if (parts[0] === 'couple' && parts[1]) return { page: 'wedding', coupleSlug: decodeURIComponent(parts[1]), venueSlug: chandelierOaks.slug }
  if (parts[0] === 'venue' && parts[1]) {
    const venueSlug = decodeURIComponent(parts[1])
    if ((parts[2] === 'couple' || parts[2] === 'client') && parts[3]) return { page: 'wedding', coupleSlug: decodeURIComponent(parts[3]), venueSlug }
    if (parts[2] === 'couple' || parts[2] === 'client') return { page: 'wedding', coupleSlug: CLIENT_PORTAL_SLUG, venueSlug }
    if (parts[2] === 'owner') return { page: 'admin', coupleSlug: null, venueSlug }
    if (parts[2] && scopedPages.includes(parts[2] as PageKey)) return { page: parts[2] as PageKey, coupleSlug: null, venueSlug }
    return { page: 'venue', coupleSlug: null, venueSlug }
  }
  const allowed: PageKey[] = ['home','venues','for-venues','signin','platform']
  return { page: allowed.includes(parts[0] as PageKey) ? parts[0] as PageKey : 'home', coupleSlug: null, venueSlug: null }
}

function readLocal<T>(key: string, fallback: T): T { try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback } catch { return fallback } }
function readSession<T>(key: string, fallback: T): T { try { const value = sessionStorage.getItem(key); return value ? JSON.parse(value) as T : fallback } catch { return fallback } }

function dedupeWorkspaces(workspaces: WeddingWorkspace[]) {
  const byVenueAndSlug = new Map<string, WeddingWorkspace>()

  for (const workspace of workspaces) {
    const key = `${workspace.venueId}:${workspace.accessSlug}`
    const existing = byVenueAndSlug.get(key)

    if (!existing) {
      byVenueAndSlug.set(key, workspace)
      continue
    }

    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    const existingIsDatabase = uuidPattern.test(existing.id)
    const candidateIsDatabase = uuidPattern.test(workspace.id)

    if (candidateIsDatabase && !existingIsDatabase) {
      byVenueAndSlug.set(key, workspace)
      continue
    }

    if (candidateIsDatabase === existingIsDatabase) {
      const existingActivity = existing.selections.length + existing.placedItems.length + existing.messages.length
      const candidateActivity = workspace.selections.length + workspace.placedItems.length + workspace.messages.length
      if (candidateActivity > existingActivity) byVenueAndSlug.set(key, workspace)
    }
  }

  return Array.from(byVenueAndSlug.values())
}
function slugify(value: string) { return value.toLowerCase().trim().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'event' }
function loadWeddings() {
  const saved = readLocal<WeddingWorkspace[]>('venueVisions.saas.weddings.v3', readLocal<WeddingWorkspace[]>('venueVisions.saas.weddings.v2', []))
  const safeSaved = saved.filter((wedding) => {
    const venue = venueConfigById(wedding.venueId).profile
    return venue.isSample || isDemoClientWorkspace(venue.slug, wedding.accessSlug)
  })
  if (!safeSaved.length) return previewWeddings
  const byId = new Map(safeSaved.map((wedding) => [wedding.id, wedding]))
  return previewWeddings.map((seed) => byId.get(seed.id) ?? seed).concat(safeSaved.filter((wedding) => !previewWeddings.some((seed) => seed.id === wedding.id)))
}

async function withOperationTimeout<T>(promise: PromiseLike<T>, label: string, ms = 15000): Promise<T> {
  let timer: number | undefined
  try {
    return await Promise.race([
      Promise.resolve(promise),
      new Promise<never>((_, reject) => {
        timer = window.setTimeout(() => reject(new Error(`${label} timed out. Please try again.`)), ms)
      }),
    ])
  } finally {
    if (timer !== undefined) window.clearTimeout(timer)
  }
}

export default function App() {
  const initialRoute = parseRoute()
  const initialVenue = initialRoute.venueSlug ? venueConfigBySlug(initialRoute.venueSlug) : venueConfigById(readLocal('venueVisions.saas.activeVenueId', chandelierOaks.id))
  const [page, setPage] = useState<PageKey>(initialRoute.page)
  const [requestedCoupleSlug, setRequestedCoupleSlug] = useState<string | null>(initialRoute.coupleSlug)
  const [activeVenueId, setActiveVenueId] = useState(initialVenue.profile.id)
  const [weddings, setWeddings] = useState<WeddingWorkspace[]>(loadWeddings)
  const [activeWeddingId, setActiveWeddingId] = useState<string>(() => readLocal('venueVisions.saas.activeWeddingId', 'wedding-sarah-john'))
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => readLocal('venueVisions.saas.notifications', false))
  const [ownerAuthenticatedVenueId, setOwnerAuthenticatedVenueId] = useState<string | null>(null)
  const [platformAuthenticated, setPlatformAuthenticated] = useState(false)
  const [platformAuthLoading, setPlatformAuthLoading] = useState(Boolean(supabase))
  const [ownerAuthLoading, setOwnerAuthLoading] = useState(false)
  const [coupleAuthenticatedWeddingId, setCoupleAuthenticatedWeddingId] = useState<string | null>(() => readSession('venueVisions.saas.coupleSessionWeddingId', null))
  const [realClientAuthenticatedEventId, setRealClientAuthenticatedEventId] = useState<string | null>(() => readSession('venueVisions.saas.realClientEventId', null))
  const [venueLeads, setVenueLeads] = useState<VenueLead[]>(() => readLocal('venueVisions.saas.leads.v1', []))
  const [, setVenueConfigRevision] = useState(0)
  const profileSaveTimerRef = useRef<number | null>(null)
  const layoutSaveTimerRef = useRef<number | null>(null)

  const activeVenue = venueConfigById(activeVenueId)
  const dedupedWeddings = useMemo(() => dedupeWorkspaces(weddings), [weddings])
  const venueWeddingsAll = useMemo(() => dedupedWeddings.filter((wedding) => wedding.venueId === activeVenueId), [dedupedWeddings, activeVenueId])
  const venueWeddings = useMemo(() => venueWeddingsAll.filter((wedding) => !wedding.deletedAt && wedding.status !== 'Cancelled'), [venueWeddingsAll])
  const activeWedding = venueWeddings.find((wedding) => wedding.id === activeWeddingId) ?? venueWeddings[0]
  const accessWedding = requestedCoupleSlug
    ? venueWeddings.find((wedding) => wedding.accessSlug === requestedCoupleSlug)
    : activeWedding
  const selections = activeWedding?.selections ?? []
  const profile = activeWedding?.profile
  const placedItems = activeWedding?.placedItems ?? []
  const messages = activeWedding?.messages ?? []
  const packageInfo = profile ? packageById(profile.packageId, activeVenueId) : activeVenue.packages[0]
  const ownerAuthenticated = ownerAuthenticatedVenueId === activeVenueId
  /* v1.9.3 platform admins inherit venue admin access */
  const platformVenueAccess = platformAuthenticated && venueAdminPages.includes(page)
  const venueAdminAuthenticated = ownerAuthenticated || platformVenueAccess
  const databaseOwnerSession = venueAdminAuthenticated && !activeVenue.profile.isSample
  const realClientAuthenticated = realClientAuthenticatedEventId === activeWedding?.id
  const databaseWorkspaceSession = databaseOwnerSession || realClientAuthenticated
  const clientAccessSlug = requestedCoupleSlug ?? accessWedding?.accessSlug ?? ''
  const demoClientRoute = isDemoClientWorkspace(activeVenue.profile.slug, clientAccessSlug)
  const clientPortalDemoWeddings = useMemo(
    () => venueWeddings.filter((wedding) => isDemoClientWorkspace(activeVenue.profile.slug, wedding.accessSlug)),
    [venueWeddings, activeVenue.profile.slug],
  )
  const activeWeddingMatchesRoute = !requestedCoupleSlug || activeWedding?.accessSlug === requestedCoupleSlug
  const hasWorkspaceAccess = Boolean(activeWedding && activeWeddingMatchesRoute && (venueAdminAuthenticated || coupleAuthenticatedWeddingId === activeWedding.id || realClientAuthenticated))

  useEffect(() => {
    const onHashChange = () => {
      const next = parseRoute()
      setPage(next.page); setRequestedCoupleSlug(next.coupleSlug)
      if (next.venueSlug) setActiveVenueId(venueConfigBySlug(next.venueSlug).profile.id)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  /* v1.9.1 mobile scroll reset */
  useEffect(() => {
    const resetScroll = () => window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    resetScroll()
    const frame = window.requestAnimationFrame(resetScroll)
    return () => window.cancelAnimationFrame(frame)
  }, [page, ownerAuthenticatedVenueId, coupleAuthenticatedWeddingId, platformAuthenticated])

  useEffect(() => {
    if (!requestedCoupleSlug) return
    const wedding = weddings.find((item) => item.venueId === activeVenueId && item.accessSlug === requestedCoupleSlug)
    if (wedding) setActiveWeddingId(wedding.id)
  }, [requestedCoupleSlug, weddings, activeVenueId])

  useEffect(() => {
    if (!venueWeddings.length) return
    if (!venueWeddings.some((wedding) => wedding.id === activeWeddingId)) setActiveWeddingId(venueWeddings[0].id)
  }, [activeVenueId, venueWeddings, activeWeddingId])

  useEffect(() => {
    const safeWeddings = weddings.filter((wedding) => {
      const venue = venueConfigById(wedding.venueId).profile
      return venue.isSample || isDemoClientWorkspace(venue.slug, wedding.accessSlug)
    })
    localStorage.setItem('venueVisions.saas.weddings.v3', JSON.stringify(safeWeddings))
  }, [weddings])
  useEffect(() => localStorage.setItem('venueVisions.saas.activeWeddingId', JSON.stringify(activeWeddingId)), [activeWeddingId])
  useEffect(() => localStorage.setItem('venueVisions.saas.activeVenueId', JSON.stringify(activeVenueId)), [activeVenueId])
  useEffect(() => localStorage.setItem('venueVisions.saas.notifications', JSON.stringify(notificationsEnabled)), [notificationsEnabled])
  useEffect(() => localStorage.setItem('venueVisions.saas.leads.v1', JSON.stringify(venueLeads)), [venueLeads])
  useEffect(() => { if (coupleAuthenticatedWeddingId) sessionStorage.setItem('venueVisions.saas.coupleSessionWeddingId', JSON.stringify(coupleAuthenticatedWeddingId)); else sessionStorage.removeItem('venueVisions.saas.coupleSessionWeddingId') }, [coupleAuthenticatedWeddingId])
  useEffect(() => { if (realClientAuthenticatedEventId) sessionStorage.setItem('venueVisions.saas.realClientEventId', JSON.stringify(realClientAuthenticatedEventId)); else sessionStorage.removeItem('venueVisions.saas.realClientEventId') }, [realClientAuthenticatedEventId])
  useEffect(() => {
    if (!supabase) {
      setPlatformAuthenticated(false)
      setPlatformAuthLoading(false)
      return
    }

    const client = supabase
    let cancelled = false

    const refreshPlatformAccess = async () => {
      const { data: sessionData } = await client.auth.getSession()
      if (!sessionData.session) {
        if (!cancelled) {
          setPlatformAuthenticated(false)
          setPlatformAuthLoading(false)
        }
        return
      }

      const { data, error } = await client.rpc('is_platform_admin')
      if (!cancelled) {
        setPlatformAuthenticated(!error && data === true)
        setPlatformAuthLoading(false)
      }
    }

    void refreshPlatformAccess()

    const { data: listener } = client.auth.onAuthStateChange(() => {
      window.setTimeout(() => { void refreshPlatformAccess() }, 0)
    })

    return () => {
      cancelled = true
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    setOwnerAuthLoading(false)
  }, [activeVenueId])

  /* v1.10.2 auto-load real venue events for authenticated admins */
  useEffect(() => {
    if (!databaseOwnerSession || !supabase) return

    let cancelled = false

    const loadAuthenticatedVenueEvents = async () => {
      try {
        const fallback = weddings.filter((wedding) => wedding.venueId === activeVenueId)
        const refreshed = await listVenueEventWorkspaces(
          activeVenue.profile.slug,
          activeVenueId,
          fallback,
        )

        if (cancelled) return

        setWeddings((current) => [
          ...current.filter((wedding) => wedding.venueId !== activeVenueId),
          ...refreshed,
        ])

        if (!refreshed.some((wedding) => wedding.id === activeWeddingId)) {
          const firstActive = refreshed.find((wedding) => !wedding.deletedAt && wedding.status !== 'Cancelled')
          if (firstActive) setActiveWeddingId(firstActive.id)
        }
      } catch (error) {
        console.error(`Unable to load ${activeVenue.profile.shortName} events for the authenticated admin session.`, error)
      }
    }

    void loadAuthenticatedVenueEvents()

    return () => {
      cancelled = true
    }
  }, [databaseOwnerSession, activeVenueId, activeVenue.profile.slug])

  useEffect(() => {
    if (!supabase) return

    let cancelled = false

    const refreshVenueConfig = async () => {
      try {
        const fallback = venueConfigBySlug('chandelier-oaks')
        const config = await loadVenueConfigFromSupabase('chandelier-oaks', fallback)
        if (cancelled || !config) return

        applyVenueConfigOverride(config)
        setVenueConfigRevision((current) => current + 1)
      } catch (error) {
        console.error('Unable to load Chandelier Oaks configuration from Supabase.', error)
      }
    }

    void refreshVenueConfig()

    return () => {
      cancelled = true
    }
  }, [ownerAuthenticatedVenueId])


  const updateActiveWedding = (updater: (current: WeddingWorkspace) => WeddingWorkspace) => setWeddings((current) => current.map((wedding) => wedding.id === activeWedding?.id ? updater(wedding) : wedding))

  const clearPrivateClientData = () => {
    setWeddings((current) => current.filter((wedding) => {
      const venue = venueConfigById(wedding.venueId).profile
      return venue.isSample || isDemoClientWorkspace(venue.slug, wedding.accessSlug)
    }))
  }

  useEffect(() => {
    if (page !== 'messages' || !activeWedding || !hasWorkspaceAccess) return
    const role: MessageRole = venueAdminAuthenticated ? 'venue' : 'bride'
    const nextMessages = activeWedding.messages.map((message) => {
      if (message.senderRole === role) return message
      if (role === 'bride' && !message.readByBride) return { ...message, readByBride: true }
      if (role === 'venue' && !message.readByVenue) return { ...message, readByVenue: true }
      return message
    })
    if (nextMessages.some((message, index) => message !== activeWedding.messages[index])) {
      updateActiveWedding((wedding) => ({ ...wedding, messages: nextMessages }))
      if (databaseOwnerSession) {
        void saveEventMessages(activeWedding.id, nextMessages).catch((error) => {
          console.error('Unable to save message read state to Supabase.', error)
        })
      } else if (realClientAuthenticated) {
        void markClientEventMessagesRead(activeWedding.id).catch((error) => {
          console.error('Unable to save client message read state to Supabase.', error)
        })
      }
    }
  }, [page, venueAdminAuthenticated, activeWedding?.id, hasWorkspaceAccess, databaseOwnerSession, realClientAuthenticated])

  const routeFor = (next: PageKey) => {
    if (next === 'home') return '#/'
    if (next === 'venues' || next === 'for-venues' || next === 'signin' || next === 'platform') return `#/${next}`
    if (next === 'venue') return `#/venue/${activeVenue.profile.slug}`
    if (next === 'admin') return `#/venue/${activeVenue.profile.slug}/owner`
    return `#/venue/${activeVenue.profile.slug}/${next}`
  }

  const navigate = (next: PageKey) => {
    window.location.hash = routeFor(next); setPage(next); setRequestedCoupleSlug(null); window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const selectVenue = (venueId: string) => {
    const config = venueConfigById(venueId)
    setActiveVenueId(config.profile.id)
    const first = weddings.find((wedding) => wedding.venueId === config.profile.id)
    if (first) setActiveWeddingId(first.id)
  }

  const openVenueBySlug = (slug: string) => {
    const config = venueConfigBySlug(slug)
    selectVenue(config.profile.id)
    window.location.hash = `#/venue/${config.profile.slug}`; setPage('venue'); setRequestedCoupleSlug(null); window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openVenueAsPlatformAdmin = async (slug: string) => {
    if (!platformAuthenticated) {
      openVenueBySlug(slug)
      return
    }

    const config = venueConfigBySlug(slug)
    const venueId = config.profile.id
    setActiveVenueId(venueId)
    setRequestedCoupleSlug(null)
    setCoupleAuthenticatedWeddingId(null)
    setRealClientAuthenticatedEventId(null)
    setOwnerAuthenticatedVenueId(null)

    if (!config.profile.isSample && supabase) {
      try {
        const fallback = weddings.filter((wedding) => wedding.venueId === venueId)
        const databaseWeddings = await withOperationTimeout(
          listVenueEventWorkspaces(config.profile.slug, venueId, fallback),
          'Loading venue workspaces',
          20000,
        )

        setWeddings((current) => [
          ...current.filter((wedding) => wedding.venueId !== venueId),
          ...databaseWeddings,
        ])

        const firstActive = databaseWeddings.find((wedding) => !wedding.deletedAt && wedding.status !== 'Cancelled')
        if (firstActive) setActiveWeddingId(firstActive.id)
      } catch (error) {
        console.error(`Unable to load ${config.profile.shortName} for platform administration.`, error)
        window.alert(`The ${config.profile.shortName} venue data could not be loaded. Please try again.`)
        return
      }
    } else {
      const first = weddings.find((wedding) => wedding.venueId === venueId && !wedding.deletedAt && wedding.status !== 'Cancelled')
      if (first) setActiveWeddingId(first.id)
    }

    window.location.hash = `#/venue/${config.profile.slug}/owner`
    setPage('admin')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openCoupleByWeddingId = (id: string) => {
    const wedding = weddings.find((entry) => entry.id === id); if (!wedding) return
    const venue = venueConfigById(wedding.venueId)
    setActiveVenueId(wedding.venueId); setActiveWeddingId(wedding.id); setCoupleAuthenticatedWeddingId(null); setRealClientAuthenticatedEventId(null); setOwnerAuthenticatedVenueId(null); setPlatformAuthenticated(false)
    const accessSegment = (venue.profile.clientLabel ?? 'client') === 'couple' ? 'couple' : 'client'
    window.location.hash = `#/venue/${venue.profile.slug}/${accessSegment}/${encodeURIComponent(wedding.accessSlug)}`; setPage('wedding'); setRequestedCoupleSlug(wedding.accessSlug); window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openCoupleBySlug = (venueSlug: string, coupleSlug: string) => {
    const venue = venueConfigBySlug(venueSlug)
    const wedding = weddings.find((entry) => entry.venueId === venue.profile.id && entry.accessSlug === coupleSlug)
    if (wedding) openCoupleByWeddingId(wedding.id)
  }

  const openFirstCouple = () => { if (venueWeddings[0]) openCoupleByWeddingId(venueWeddings[0].id) }

  const openClientPortal = () => {
    if (activeVenue.profile.isSample) {
      openFirstCouple()
      return
    }

    const accessSegment = (activeVenue.profile.clientLabel ?? 'client') === 'couple' ? 'couple' : 'client'
    setCoupleAuthenticatedWeddingId(null)
    setRealClientAuthenticatedEventId(null)
    setOwnerAuthenticatedVenueId(null)
    setRequestedCoupleSlug(CLIENT_PORTAL_SLUG)
    window.location.hash = `#/venue/${activeVenue.profile.slug}/${accessSegment}`
    setPage('wedding')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openMessageContext = (context: MessageContext) => { if (context.kind === 'inventory') { localStorage.setItem('venueVisions.catalogFocus', context.id); navigate('catalog') } else { localStorage.setItem('venueVisions.plannerArea', context.id); navigate('planner') } }

  const setQuantity = (itemId: string, requested: number) => {
    if (!hasWorkspaceAccess || !activeWedding) { navigate('wedding'); return }
    const item = activeVenue.inventory.find((entry) => entry.id === itemId)
    if (!item || !itemAllowedForTier(item, packageInfo.tier)) return
    const quantity = Math.max(0, Math.min(requested, item.quantity))
    const current = activeWedding.selections
    const nextSelections = quantity === 0
      ? current.filter((entry) => entry.itemId !== itemId)
      : current.some((entry) => entry.itemId === itemId)
        ? current.map((entry) => entry.itemId === itemId ? { ...entry, quantity } : entry)
        : [...current, { itemId, quantity }]

    updateActiveWedding((wedding) => ({
      ...wedding,
      selections: nextSelections,
      status: nextSelections.length ? 'Designing' : wedding.status,
    }))

    if (databaseWorkspaceSession) {
      void setEventSelection(activeWedding.id, itemId, quantity).catch((error) => {
        console.error('Unable to save the resource selection to Supabase.', error)
        window.alert('The selection changed on screen, but it could not be saved to the database. Please refresh and try again.')
      })
    }
  }

  const updateProfile = (next: WeddingProfile) => {
    if (!hasWorkspaceAccess || !activeWedding) return
    if (next.date && venueWeddings.some((wedding) => wedding.id !== activeWedding.id && wedding.profile.date === next.date)) {
      const conflict = venueWeddings.find((wedding) => wedding.id !== activeWedding.id && wedding.profile.date === next.date)
      window.alert(`${next.date} is already booked for ${conflict?.profile.couple} at ${activeVenue.profile.shortName}. Choose another date.`); return
    }
    const nextPackage = packageById(next.packageId, activeVenueId)
    if (nextPackage.maxGuests !== null && next.guests > nextPackage.maxGuests) {
      window.alert(`${nextPackage.name} is configured for a maximum of ${nextPackage.maxGuests} guests.`); return
    }

    updateActiveWedding((wedding) => ({ ...wedding, profile: next }))

    if (databaseOwnerSession) {
      if (profileSaveTimerRef.current !== null) window.clearTimeout(profileSaveTimerRef.current)
      const eventId = activeWedding.id
      profileSaveTimerRef.current = window.setTimeout(() => {
        void saveEventProfile(eventId, next).catch((error) => {
          console.error('Unable to save event details to Supabase.', error)
          window.alert('Those event details could not be saved to the database. Please refresh the owner portal and try again.')
        })
      }, 500)
    } else if (realClientAuthenticated) {
      if (profileSaveTimerRef.current !== null) window.clearTimeout(profileSaveTimerRef.current)
      const eventId = activeWedding.id
      profileSaveTimerRef.current = window.setTimeout(() => {
        void saveClientEventPlanningProfile(eventId, next).catch((error) => {
          console.error('Unable to save client planning details to Supabase.', error)
          window.alert('Those planning details could not be saved. Please refresh and try again.')
        })
      }, 500)
    }
  }

  const setPlacedItems = (next: PlacedItem[] | ((current: PlacedItem[]) => PlacedItem[])) => {
    if (!hasWorkspaceAccess || !activeWedding) return
    const nextItems = typeof next === 'function' ? next(activeWedding.placedItems) : next

    updateActiveWedding((wedding) => ({
      ...wedding,
      placedItems: nextItems,
      status: 'Designing',
    }))

    if (databaseWorkspaceSession) {
      if (layoutSaveTimerRef.current !== null) window.clearTimeout(layoutSaveTimerRef.current)
      const eventId = activeWedding.id
      layoutSaveTimerRef.current = window.setTimeout(() => {
        void saveEventLayoutItems(eventId, nextItems).catch((error) => {
          console.error('Unable to save the layout to Supabase.', error)
          window.alert(`The layout could not be saved: ${error instanceof Error ? error.message : 'Unknown database error'}`)
        })
      }, 650)
    }
  }

  const setMessages = (next: WeddingMessage[] | ((current: WeddingMessage[]) => WeddingMessage[])) => {
    if (!hasWorkspaceAccess || !activeWedding) return
    const nextMessages = typeof next === 'function' ? next(activeWedding.messages) : next

    updateActiveWedding((wedding) => ({ ...wedding, messages: nextMessages }))

    if (databaseOwnerSession) {
      void saveEventMessages(activeWedding.id, nextMessages).catch((error) => {
        console.error('Unable to save messages to Supabase.', error)
        window.alert('The message changed on screen, but it could not be saved to the database. Please refresh and try again.')
      })
    } else if (realClientAuthenticated) {
      const existingIds = new Set(activeWedding.messages.map((message) => message.id))
      const addedMessages = nextMessages.filter((message) => !existingIds.has(message.id) && message.senderRole !== 'venue')
      if (addedMessages.length) {
        void appendClientEventMessages(activeWedding.id, addedMessages).catch((error) => {
          console.error('Unable to save the client message to Supabase.', error)
          window.alert('Your message could not be saved. Please refresh and try again.')
        })
      }
    }
  }

  const selectActiveWedding = (id: string) => { if (venueWeddings.some((wedding) => wedding.id === id)) setActiveWeddingId(id) }
  const openWedding = (id: string, destination: PageKey = 'wedding') => { const wedding = weddings.find((entry) => entry.id === id); if (!wedding) return; setActiveVenueId(wedding.venueId); setActiveWeddingId(id); const venue = venueConfigById(wedding.venueId); const hash = destination === 'admin' ? `#/venue/${venue.profile.slug}/owner` : `#/venue/${venue.profile.slug}/${destination}`; window.location.hash = hash; setPage(destination); setRequestedCoupleSlug(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  const addWedding = async (input: { couple: string; date: string; guests: number; packageId: string; primaryEmail: string; partnerEmail?: string }): Promise<string | null> => {
    const eventLabel = activeVenue.profile.eventLabel ?? 'event'
    const clientLabel = activeVenue.profile.clientLabel ?? 'client'
    const cleanCouple = input.couple.trim()
    if (!cleanCouple) return `Enter the ${clientLabel} or ${eventLabel} name.`
    if (!input.date) return `Choose an ${eventLabel} date.`
    if (!activeVenue.profile.isSample && !input.primaryEmail.trim()) return `Enter the primary ${clientLabel} email for secure portal access.`

    const conflict = venueWeddings.find((wedding) => wedding.profile.date === input.date)
    if (conflict) return `${input.date} is already booked for ${conflict.profile.couple} at ${activeVenue.profile.shortName}.`

    const pkg = packageById(input.packageId, activeVenueId)
    if (pkg.maxGuests !== null && input.guests > pkg.maxGuests) {
      return `${pkg.name} is configured for a maximum of ${pkg.maxGuests} guests.`
    }

    const secondary = activeVenue.areas.find((area) => area.kind === 'Ceremony')?.id
      ?? activeVenue.areas.find((area) => area.kind === 'Hospitality')?.id
      ?? ''
    const primary = activeVenue.areas.find((area) => area.kind === 'Reception')?.id
      ?? activeVenue.areas[0]?.id
      ?? ''

    if (databaseOwnerSession) {
      try {
        const newWedding = await createVenueEventWorkspace(
          activeVenue.profile.slug,
          activeVenueId,
          {
            couple: cleanCouple,
            date: input.date,
            guests: input.guests,
            packageId: input.packageId,
            primaryEmail: input.primaryEmail,
            partnerEmail: input.partnerEmail,
            ceremonyArea: secondary,
            receptionArea: primary,
          },
        )

        setWeddings((current) => [...current, newWedding])
        setActiveWeddingId(newWedding.id)
        return null
      } catch (error) {
        console.error('Unable to create the Chandelier Oaks event in Supabase.', error)
        return error instanceof Error ? error.message : 'Unable to create the event in the database.'
      }
    }

    const id = `${eventLabel}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const baseSlug = slugify(cleanCouple)
    let accessSlug = baseSlug
    let suffix = 2
    while (venueWeddings.some((wedding) => wedding.accessSlug === accessSlug)) {
      accessSlug = `${baseSlug}-${suffix++}`
    }

    const newWedding: WeddingWorkspace = {
      id,
      venueId: activeVenueId,
      accessSlug,
      accessCode: String(Math.floor(100000 + Math.random() * 900000)),
      status: 'Not started' as WeddingStatus,
      paymentStepsCompleted: 1,
      profile: {
        couple: cleanCouple,
        date: input.date,
        guests: Math.max(1, input.guests || 1),
        packageId: input.packageId,
        ceremonyArea: secondary,
        receptionArea: primary,
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

    setWeddings((current) => [...current, newWedding])
    setActiveWeddingId(id)
    return null
  }

  const refreshDatabaseVenueEvents = async () => {
    const refreshed = await listVenueEventWorkspaces(activeVenue.profile.slug, activeVenueId, venueWeddingsAll)
    setWeddings((current) => [
      ...current.filter((wedding) => wedding.venueId !== activeVenueId),
      ...refreshed,
    ])
    return refreshed
  }

  const cancelManagedEvent = async (id: string): Promise<string | null> => {
    try {
      if (databaseOwnerSession) {
        await cancelVenueEvent(id)
        await refreshDatabaseVenueEvents()
      } else {
        setWeddings((current) => current.map((wedding) => wedding.id === id ? { ...wedding, status: 'Cancelled' as WeddingStatus } : wedding))
      }
      return null
    } catch (error) {
      console.error('Unable to cancel the event.', error)
      return error instanceof Error ? error.message : 'The event could not be cancelled.'
    }
  }

  const reopenManagedEvent = async (id: string): Promise<string | null> => {
    try {
      if (databaseOwnerSession) {
        await reopenVenueEvent(id)
        await refreshDatabaseVenueEvents()
      } else {
        setWeddings((current) => current.map((wedding) => {
          if (wedding.id !== id) return wedding
          const nextStatus: WeddingStatus = wedding.selections.length || wedding.placedItems.length ? 'Designing' : 'Not started'
          return { ...wedding, status: nextStatus }
        }))
      }
      return null
    } catch (error) {
      console.error('Unable to reopen the event.', error)
      return error instanceof Error ? error.message : 'The event could not be reopened.'
    }
  }

  const trashManagedEvent = async (id: string): Promise<string | null> => {
    try {
      if (databaseOwnerSession) {
        await softDeleteVenueEvent(id)
        await refreshDatabaseVenueEvents()
      } else {
        const deletedAt = new Date().toISOString()
        setWeddings((current) => current.map((wedding) => wedding.id === id ? { ...wedding, deletedAt } : wedding))
      }
      return null
    } catch (error) {
      console.error('Unable to move the event to Trash.', error)
      return error instanceof Error ? error.message : 'The event could not be moved to Trash.'
    }
  }

  const restoreManagedEvent = async (id: string): Promise<string | null> => {
    try {
      if (databaseOwnerSession) {
        await restoreVenueEvent(id)
        await refreshDatabaseVenueEvents()
      } else {
        setWeddings((current) => current.map((wedding) => wedding.id === id ? { ...wedding, deletedAt: undefined } : wedding))
      }
      return null
    } catch (error) {
      console.error('Unable to restore the event.', error)
      return error instanceof Error ? error.message : 'The event could not be restored.'
    }
  }

  const permanentlyDeleteManagedEvent = async (id: string): Promise<string | null> => {
    try {
      if (databaseOwnerSession) {
        await permanentDeleteVenueEvent(id)
        await refreshDatabaseVenueEvents()
      } else {
        const target = weddings.find((wedding) => wedding.id === id)
        if (!target?.deletedAt) return 'Move the event to Trash first.'
        const retentionMs = 30 * 24 * 60 * 60 * 1000
        if (Date.now() - new Date(target.deletedAt).getTime() < retentionMs) return 'This event is still inside the 30-day recovery period.'
        setWeddings((current) => current.filter((wedding) => wedding.id !== id))
      }
      return null
    } catch (error) {
      console.error('Unable to permanently delete the event.', error)
      return error instanceof Error ? error.message : 'The event could not be permanently deleted.'
    }
  }

  const scrollToTopAfterAuth = () => {
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    })
  }

  const authenticateOwner = async (emailOrCode: string, password?: string): Promise<{ ok: boolean; error?: string }> => {
    const usesRealAuth = activeVenue.profile.slug === 'chandelier-oaks'

    if (!usesRealAuth) {
      if (emailOrCode.trim() !== activeVenue.ownerAccessCode) return { ok: false, error: 'Incorrect preview password.' }
      setOwnerAuthenticatedVenueId(activeVenueId)
      setCoupleAuthenticatedWeddingId(null)
      scrollToTopAfterAuth()
      return { ok: true }
    }

    if (!supabase) return { ok: false, error: 'Supabase is not configured on this deployment.' }

    const email = emailOrCode.trim().toLowerCase()
    if (!email) return { ok: false, error: 'Enter your email address.' }
    if (!password) return { ok: false, error: 'Enter your password.' }

    try {
      const sessionResult = await withOperationTimeout(
        supabase.auth.getSession(),
        'Checking your current session',
      )

      const existingUser = sessionResult.data.session?.user ?? null
      const existingEmail = (existingUser?.email ?? '').toLowerCase()
      const reuseCurrentSession = Boolean(existingUser?.id && existingEmail === email)

      let user = existingUser

      if (!reuseCurrentSession) {
        const login = await withOperationTimeout(
          signInWithPassword(email, password),
          'Signing in',
        )
        user = login.user ?? null
      }

      if (!user?.id) {
        setOwnerAuthenticatedVenueId(null)
        return { ok: false, error: 'Unable to identify the signed-in account.' }
      }

      const access = await withOperationTimeout(
        getVenueStaffAccessBySlug(activeVenue.profile.slug, user.id),
        'Checking venue access',
      )

      if (!access.allowed) {
        if (!reuseCurrentSession) {
          try { await withOperationTimeout(signOutSupabase(), 'Signing out') } catch { /* preserve the useful access error */ }
        }
        setOwnerAuthenticatedVenueId(null)
        return { ok: false, error: `This account does not have owner or staff access to ${activeVenue.profile.shortName}.` }
      }

      const databaseWeddings = await withOperationTimeout(
        listVenueEventWorkspaces(
          activeVenue.profile.slug,
          activeVenueId,
          weddings.filter((wedding) => wedding.venueId === activeVenueId),
        ),
        'Loading venue workspaces',
        20000,
      )

      setWeddings((current) => [
        ...current.filter((wedding) => wedding.venueId !== activeVenueId),
        ...databaseWeddings,
      ])

      const firstActive = databaseWeddings.find((wedding) => !wedding.deletedAt && wedding.status !== 'Cancelled')
      if (firstActive) setActiveWeddingId(firstActive.id)

      setOwnerAuthenticatedVenueId(activeVenueId)
      setCoupleAuthenticatedWeddingId(null)
      setRealClientAuthenticatedEventId(null)
      return { ok: true }
    } catch (error) {
      console.error('Unable to authenticate venue owner.', error)
      setOwnerAuthenticatedVenueId(null)
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Unable to sign in.',
      }
    }
  }

  const authenticatePlatform = async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    if (!supabase) return { ok: false, error: 'Supabase is not configured on this deployment.' }
    try {
      await signInWithPassword(email.trim(), password)
      const { data, error } = await supabase.rpc('is_platform_admin')
      if (error || data !== true) {
        await signOutSupabase()
        setPlatformAuthenticated(false)
        return { ok: false, error: 'This account is not authorized as a ViviaVisions platform administrator.' }
      }
      setPlatformAuthenticated(true)
      setOwnerAuthenticatedVenueId(null)
      setCoupleAuthenticatedWeddingId(null)
      setRealClientAuthenticatedEventId(null)
      scrollToTopAfterAuth()
      return { ok: true }
    } catch (error) {
      setPlatformAuthenticated(false)
      return { ok: false, error: error instanceof Error ? error.message : 'Unable to sign in.' }
    }
  }
  const authenticateDemoCouple = (code: string) => {
    const target = accessWedding ?? activeWedding
    if (!target || code.trim() !== target.accessCode) return false
    setActiveWeddingId(target.id)
    setCoupleAuthenticatedWeddingId(target.id)
    setRealClientAuthenticatedEventId(null)
    setOwnerAuthenticatedVenueId(null)
    return true
  }

  const finishRealClientAccess = async (accessSlug: string) => {
    const eventId = await claimClientEventAccess(activeVenue.profile.slug, accessSlug)
    const databaseWeddings = await listVenueEventWorkspaces(
      activeVenue.profile.slug,
      activeVenueId,
      weddings.filter((wedding) => wedding.venueId === activeVenueId),
    )
    const target = databaseWeddings.find((wedding) => wedding.id === eventId || wedding.accessSlug === accessSlug)
    if (!target) throw new Error('Your event could not be loaded after sign-in.')

    setWeddings((current) => [
      ...current.filter((wedding) => wedding.venueId !== activeVenueId || isDemoClientWorkspace(activeVenue.profile.slug, wedding.accessSlug)),
      target,
    ])
    setActiveWeddingId(target.id)
    setCoupleAuthenticatedWeddingId(target.id)
    setRealClientAuthenticatedEventId(target.id)
    setOwnerAuthenticatedVenueId(null)
    setPlatformAuthenticated(false)
    scrollToTopAfterAuth()
  }

  const finishGenericClientPortalAccess = async () => {
    const matches = await claimMyClientEvents(activeVenue.profile.slug)
    if (!matches.length) {
      throw new Error(`No active ${activeVenue.profile.eventLabel ?? 'event'} portal is assigned to this email at ${activeVenue.profile.shortName}.`)
    }

    const databaseWeddings = await listVenueEventWorkspaces(
      activeVenue.profile.slug,
      activeVenueId,
      [],
    )

    const allowedIds = new Set(matches.map((match) => match.eventId))
    const accessible = databaseWeddings
      .filter((wedding) => allowedIds.has(wedding.id) && !wedding.deletedAt && wedding.status !== 'Cancelled')
      .sort((a, b) => a.profile.date.localeCompare(b.profile.date))

    const target = accessible[0]
    if (!target) {
      throw new Error('Your account matched a client record, but the active workspace could not be loaded.')
    }

    setWeddings((current) => [
      ...current.filter((wedding) => wedding.venueId !== activeVenueId || isDemoClientWorkspace(activeVenue.profile.slug, wedding.accessSlug)),
      ...accessible,
    ])
    setActiveWeddingId(target.id)
    setCoupleAuthenticatedWeddingId(target.id)
    setRealClientAuthenticatedEventId(target.id)
    setOwnerAuthenticatedVenueId(null)
    setPlatformAuthenticated(false)
    setRequestedCoupleSlug(target.accessSlug)

    const accessSegment = (activeVenue.profile.clientLabel ?? 'client') === 'couple' ? 'couple' : 'client'
    window.location.hash = `#/venue/${activeVenue.profile.slug}/${accessSegment}/${encodeURIComponent(target.accessSlug)}`
    setPage('wedding')
    scrollToTopAfterAuth()
  }

  const authenticateRealClient = async (email: string, password: string, accessSlug: string): Promise<{ ok: boolean; error?: string }> => {
    if (!supabase) return { ok: false, error: 'Secure client authentication is not configured on this deployment.' }
    if (!email) return { ok: false, error: 'Enter your email address.' }
    if (!password) return { ok: false, error: 'Enter your password.' }

    try {
      await signInWithPassword(email.toLowerCase(), password)
      if (accessSlug === CLIENT_PORTAL_SLUG) await finishGenericClientPortalAccess()
      else await finishRealClientAccess(accessSlug)
      return { ok: true }
    } catch (error) {
      try { await signOutSupabase() } catch { /* preserve the useful sign-in error */ }
      setCoupleAuthenticatedWeddingId(null)
      setRealClientAuthenticatedEventId(null)
      return { ok: false, error: error instanceof Error ? error.message : 'Unable to sign in to this client portal.' }
    }
  }

  const registerRealClient = async (email: string, password: string, accessSlug: string): Promise<{ ok: boolean; error?: string; pending?: boolean; message?: string }> => {
    if (!supabase) return { ok: false, error: 'Secure client authentication is not configured on this deployment.' }
    if (!email) return { ok: false, error: 'Enter the email address the venue has on file.' }
    if (password.length < 8) return { ok: false, error: 'Use a password with at least 8 characters.' }

    try {
      const accessSegment = (activeVenue.profile.clientLabel ?? 'client') === 'couple' ? 'couple' : 'client'
      const signupRedirect = `${window.location.origin}${window.location.pathname}#/venue/${activeVenue.profile.slug}/${accessSegment}${accessSlug === CLIENT_PORTAL_SLUG ? '' : `/${encodeURIComponent(accessSlug)}`}`
      const signup = await signUpWithPassword(email.toLowerCase(), password, signupRedirect)
      if (signup.user && Array.isArray(signup.user.identities) && signup.user.identities.length === 0) {
        return { ok: false, error: 'An account already exists for that email. Use Sign in instead.' }
      }

      if (!signup.session) {
        return {
          ok: true,
          pending: true,
          message: 'Account created. Check your email for the confirmation message, then return to this portal and sign in.',
        }
      }

      if (accessSlug === CLIENT_PORTAL_SLUG) await finishGenericClientPortalAccess()
      else await finishRealClientAccess(accessSlug)
      return { ok: true }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Unable to create the client account.' }
    }
  }

  const logoutOwner = async () => {
    setOwnerAuthenticatedVenueId(null)
    clearPrivateClientData()
    if (platformAuthenticated) {
      navigate('platform')
      return
    }
    try {
      if (!activeVenue.profile.isSample && supabase) await signOutSupabase()
    } finally {
      navigate('venue')
    }
  }
  const logoutPlatform = async () => { try { if (supabase) await signOutSupabase() } finally { setPlatformAuthenticated(false); setCoupleAuthenticatedWeddingId(null); setRealClientAuthenticatedEventId(null); clearPrivateClientData(); navigate('home') } }
  const logoutCouple = async () => {
    const wasRealClient = Boolean(realClientAuthenticatedEventId)
    setCoupleAuthenticatedWeddingId(null)
    setRealClientAuthenticatedEventId(null)
    clearPrivateClientData()
    try {
      if (wasRealClient && supabase) await signOutSupabase()
    } finally {
      navigate('venue')
    }
  }

  const selectionCount = useMemo(() => selections.reduce((sum, item) => sum + item.quantity, 0), [selections])
  const unreadMessages = useMemo(() => messages.filter((message) => { const role: MessageRole = venueAdminAuthenticated ? 'venue' : 'bride'; if (message.senderRole === role) return false; return role === 'bride' ? !message.readByBride : !message.readByVenue }).length, [messages, venueAdminAuthenticated])
  const protectedPage = page === 'wedding' || page === 'planner' || page === 'media' || page === 'ai-preview' || page === 'messages' || page === 'summary'
  const showCoupleGate = protectedPage && !hasWorkspaceAccess
  const showOwnerGate = (page === 'calendar' || page === 'manage-events') && !venueAdminAuthenticated

  const resetPreview = async () => {
    if (venueAdminAuthenticated && activeWedding && !activeVenue.profile.isSample) {
      if (!window.confirm(`Reset planning for ${activeWedding.profile.couple}? Resource selections and 2D layouts will be cleared. Event details and messages will stay.`)) return
      try {
        if (databaseOwnerSession) await resetEventPlanning(activeWedding.id)
        setWeddings((current) => current.map((wedding) => wedding.id === activeWedding.id
          ? { ...wedding, selections: [], placedItems: [], status: wedding.status === 'Cancelled' ? wedding.status : 'Not started' as WeddingStatus }
          : wedding))
      } catch (error) {
        console.error('Unable to reset workspace planning.', error)
        window.alert('The workspace could not be reset. Please refresh and try again.')
      }
      return
    }

    if (!window.confirm('Reset the demo venue data back to its starting state?')) return
    const demoVenueIds = new Set(venueConfigs.filter((config) => config.profile.isSample).map((config) => config.profile.id))
    const demoWeddings = previewWeddings.filter((wedding) => demoVenueIds.has(wedding.venueId))
    setWeddings((current) => [...current.filter((wedding) => !demoVenueIds.has(wedding.venueId)), ...demoWeddings])
    setNotificationsEnabled(false)
    setCoupleAuthenticatedWeddingId(null)
    Object.keys(localStorage).filter((key) => key.startsWith('venueVisions.poc.')).forEach((key) => localStorage.removeItem(key))
    try { indexedDB.deleteDatabase('venueVisionsMediaDemo') } catch { /* demo cleanup only */ }
  }

  return (
    <div className="app-shell" style={{ '--venue-primary': activeVenue.profile.brandPrimary, '--venue-accent': activeVenue.profile.brandAccent, '--venue-surface': activeVenue.profile.brandSurface ?? '#f5f5f5', '--venue-text': activeVenue.profile.brandText ?? activeVenue.profile.brandPrimary } as CSSProperties}>
      <Header page={page} onNavigate={navigate} selectionCount={selectionCount} unreadMessages={unreadMessages} activeWeddingName={profile?.couple ?? ''} weddings={venueWeddings} activeWeddingId={activeWedding?.id ?? ''} activeVenue={activeVenue.profile} ownerAuthenticated={venueAdminAuthenticated} coupleAuthenticated={coupleAuthenticatedWeddingId === activeWedding?.id} platformAuthenticated={platformAuthenticated} onSelectWedding={selectActiveWedding} onOwnerLogout={logoutOwner} onCoupleLogout={logoutCouple} onPlatformLogout={logoutPlatform} onResetPreview={resetPreview} />

      {showCoupleGate && <CoupleAccess wedding={accessWedding} venueId={activeVenueId} accessSlug={clientAccessSlug} demoMode={demoClientRoute} portalMode={clientAccessSlug === CLIENT_PORTAL_SLUG} demoWeddings={clientPortalDemoWeddings.map((wedding) => ({ id: wedding.id, name: wedding.profile.couple, date: wedding.profile.date }))} onOpenDemo={openCoupleByWeddingId} onSubmitCode={authenticateDemoCouple} onSignIn={authenticateRealClient} onCreateAccount={registerRealClient} onBackHome={() => navigate('venue')} />}
      {showOwnerGate && <Admin venueId={activeVenueId} weddings={venueWeddings} activeWeddingId={activeWedding?.id ?? ''} onSelectWedding={selectActiveWedding} onOpenWedding={openWedding} onAddWedding={addWedding} authenticated={venueAdminAuthenticated} authLoading={ownerAuthLoading} onAuthenticate={authenticateOwner} onExitPreview={() => navigate('venue')} onLogout={logoutOwner} onNavigate={navigate} platformAdminAccess={platformAuthenticated} />}

      {!showCoupleGate && !showOwnerGate && page === 'home' && <Home onNavigate={navigate} onOpenVenue={openVenueBySlug} venues={venueConfigs} />}
      {!showCoupleGate && !showOwnerGate && page === 'venues' && <Venues venues={venueConfigs} weddings={weddings} onOpenVenue={openVenueBySlug} onOpenCouple={openCoupleBySlug} onForVenues={() => navigate('for-venues')} />}
      {!showCoupleGate && !showOwnerGate && page === 'for-venues' && <ForVenues leads={venueLeads} setLeads={setVenueLeads} onBackHome={() => navigate('home')} onViewVenueDemo={() => navigate('venues')} />}
      {!showCoupleGate && !showOwnerGate && page === 'signin' && <SignIn venues={venueConfigs} activeVenueId={activeVenueId} onSelectVenue={selectVenue} onVenueOwner={() => navigate('admin')} onCouple={openClientPortal} onBackHome={() => navigate('home')} />}
      {!showCoupleGate && !showOwnerGate && page === 'venue' && <VenuePortal venueId={activeVenueId} weddings={venueWeddings} onNavigate={navigate} onOpenCouple={openCoupleByWeddingId} onOpenClientPortal={openClientPortal} />}
      {!showCoupleGate && !showOwnerGate && page === 'catalog' && <Catalog venueId={activeVenueId} selections={selections} onSetQuantity={setQuantity} canEdit={hasWorkspaceAccess} onRequireAccess={openFirstCouple} packageTier={packageInfo.tier} packageName={packageInfo.name} onNavigate={navigate} />}
      {!showCoupleGate && !showOwnerGate && page === 'wedding' && profile && activeWedding && <Wedding venueId={activeVenueId} profile={profile} selections={selections} unreadMessages={unreadMessages} paymentStepsCompleted={activeWedding.paymentStepsCompleted} onProfileChange={updateProfile} onSetQuantity={setQuantity} onNavigate={navigate} ownerMode={venueAdminAuthenticated} clientAuthenticated={realClientAuthenticated} />}
      {!showCoupleGate && !showOwnerGate && page === 'planner' && profile && <Planner venueId={activeVenueId} selections={selections} placedItems={placedItems} setPlacedItems={setPlacedItems} onSetQuantity={setQuantity} packageTier={packageInfo.tier} preferredAreaId={profile.receptionArea || activeVenue.areas[0]?.id} onNavigate={navigate} />}
      {!showCoupleGate && !showOwnerGate && page === 'media' && activeWedding && <MediaLibrary venueId={activeVenueId} weddingId={activeWedding.id} weddingName={activeWedding.profile.couple} ownerMode={venueAdminAuthenticated} onNavigate={navigate} />}
      {!showCoupleGate && !showOwnerGate && page === 'ai-preview' && activeWedding && <AiPreview venueId={activeVenueId} weddingId={activeWedding.id} weddingName={activeWedding.profile.couple} preferredAreaId={activeWedding.profile.receptionArea || activeVenue.areas[0]?.id} placedItems={placedItems} selections={selections} ownerMode={venueAdminAuthenticated} onNavigate={navigate} />}
      {!showCoupleGate && !showOwnerGate && page === 'messages' && profile && <Messages venueId={activeVenueId} profile={profile} selections={selections} placedItems={placedItems} messages={messages} setMessages={setMessages} currentRole={venueAdminAuthenticated ? 'venue' : 'bride'} notificationsEnabled={notificationsEnabled} setNotificationsEnabled={setNotificationsEnabled} onOpenContext={openMessageContext} weddings={venueAdminAuthenticated ? venueWeddings : undefined} activeWeddingId={activeWedding?.id ?? ''} onSelectWedding={selectActiveWedding} onOpenPlanning={() => activeWedding && openWedding(activeWedding.id, 'wedding')} />}
      {!showCoupleGate && !showOwnerGate && page === 'summary' && activeWedding && <SetupSheet venueId={activeVenueId} wedding={activeWedding} />}
      {!showCoupleGate && !showOwnerGate && page === 'manage-events' && venueAdminAuthenticated && <ManageEvents eventLabel={activeVenue.profile.eventLabel ?? 'event'} clientLabel={activeVenue.profile.clientLabel ?? 'client'} weddings={venueWeddingsAll} onOpen={(id) => openWedding(id, 'wedding')} onBack={() => navigate('admin')} onCancel={cancelManagedEvent} onReopen={reopenManagedEvent} onTrash={trashManagedEvent} onRestore={restoreManagedEvent} onPermanentDelete={permanentlyDeleteManagedEvent} />}
      {!showCoupleGate && !showOwnerGate && page === 'calendar' && venueAdminAuthenticated && <Calendar venueId={activeVenueId} weddings={venueWeddings} activeWeddingId={activeWedding?.id ?? ''} onSelectWedding={selectActiveWedding} />}
      {page === 'admin' && <Admin venueId={activeVenueId} weddings={venueWeddings} activeWeddingId={activeWedding?.id ?? ''} onSelectWedding={selectActiveWedding} onOpenWedding={openWedding} onAddWedding={addWedding} authenticated={venueAdminAuthenticated} authLoading={ownerAuthLoading} onAuthenticate={authenticateOwner} onExitPreview={() => navigate('venue')} onLogout={logoutOwner} onNavigate={navigate} platformAdminAccess={platformAuthenticated} />}
      {page === 'platform' && <PlatformAdmin authenticated={platformAuthenticated} authLoading={platformAuthLoading} onAuthenticate={authenticatePlatform} onLogout={logoutPlatform} onNavigate={navigate} leads={venueLeads} weddings={dedupedWeddings} venues={venueConfigs} onOpenVenue={openVenueBySlug} onManageVenue={openVenueAsPlatformAdmin} />}

      <footer className="site-footer saas-footer">
        <div className="shell">
          <div className="site-footer__context">
            {venueAdminAuthenticated || coupleAuthenticatedWeddingId === activeWedding?.id || page === 'venue'
              ? <><span>{activeVenue.profile.shortName}</span><span>{POWERED_BY_PLATFORM}</span></>
              : platformAuthenticated
                ? <><span>{PLATFORM_NAME} Admin</span><span>Platform operations · {venueConfigs.length} venue profiles</span></>
                : <><span>{PLATFORM_NAME}</span><span>Event venue management & planning · venue-first private client workspaces</span></>}
          </div>
          <div className="site-footer__creator">
            <img src={platformConfig.creator.logoPath} alt="" />
            <span>Created by <a href={platformConfig.creator.url} target="_blank" rel="noopener noreferrer" aria-label="A cubed website"><strong>{platformConfig.creator.name}</strong></a></span>
          </div>
        </div>
      </footer>
    </div>
  )
}



