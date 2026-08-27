import type { CSSProperties } from 'react'
import { useEffect, useMemo, useState } from 'react'
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
import PlatformAdmin from './pages/PlatformAdmin'
import { PLATFORM_NAME, POWERED_BY_PLATFORM, platformConfig } from './config/platform'
import { supabase } from './lib/supabase'
import { getVenueStaffAccessBySlug, signInWithPassword, signOut as signOutSupabase } from './lib/repositories/auth'
import CoupleAccess from './pages/CoupleAccess'
import { chandelierOaks, foundryRivergate, itemAllowedForTier, juniperStone, packageById, venueConfigById, venueConfigBySlug, venueConfigs } from './data'
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
  { id: 'wedding-ashley-mark', venueId: chandelierOaks.id, accessSlug: 'ashley-mark', accessCode: '222222', status: 'Designing', paymentStepsCompleted: 1, profile: { couple: 'Ashley & Mark', date: '2026-10-24', guests: 58, packageId: 'classic', ceremonyArea: 'hilltop-gazebo', receptionArea: 'pecan-pavilion', primaryEmail: 'ashley@example.com', partnerEmail: 'mark@example.com', contractSigned: true, reservationPaid: true, notes: 'Simple ceremony at the gazebo and a traditional reception in the pavilion.' }, selections: [{ itemId: 'gold-lantern', quantity: 8 }, { itemId: 'welcome-easel', quantity: 1 }], placedItems: [{ id: 'ashley-table-1', type: 'round-table', x: 175, y: 145, rotation: 0, scale: 1, label: 'Round table', areaId: 'pecan-pavilion' }, { id: 'ashley-table-2', type: 'round-table', x: 355, y: 145, rotation: 0, scale: 1, label: 'Round table', areaId: 'pecan-pavilion' }, { id: 'ashley-dance', type: 'dance-floor', x: 520, y: 220, rotation: 0, scale: .9, label: 'Dance floor', areaId: 'pecan-pavilion' }], messages: [{ id: 'ashley-msg-1', senderRole: 'bride', senderName: 'Ashley & Mark', body: 'Can we keep the gazebo ceremony very simple and move most of the dÃ©cor to the pavilion?', timestamp: '2026-08-19T16:10:00-05:00', attachments: [], context: { kind: 'area', id: 'hilltop-gazebo', label: 'Hilltop Gazebo' }, readByBride: true, readByVenue: false }] },
  { id: 'wedding-jennifer-matt', venueId: chandelierOaks.id, accessSlug: 'jennifer-matt', accessCode: '333333', status: 'Not started', paymentStepsCompleted: 1, profile: { couple: 'Jennifer & Matt', date: '2026-11-07', guests: 210, packageId: 'luxury', ceremonyArea: 'under-the-oaks', receptionArea: 'pecan-pavilion', primaryEmail: 'jennifer@example.com', partnerEmail: 'matt@example.com', contractSigned: true, reservationPaid: true, notes: '' }, selections: [], placedItems: [], messages: [] },
  { id: 'wedding-olivia-james', venueId: juniperStone.id, accessSlug: 'olivia-james', accessCode: '444444', status: 'Designing', paymentStepsCompleted: 2, profile: { couple: 'Olivia & James', date: '2026-09-12', guests: 132, packageId: 'js-signature', ceremonyArea: 'stone-courtyard', receptionArea: 'glass-hall', primaryEmail: 'olivia@example.com', partnerEmail: 'james@example.com', contractSigned: true, reservationPaid: true, notes: 'Long banquet tables, warm copper accents and a clean ceremony frame.' }, selections: [{ itemId: 'js-smoked-vases', quantity: 20 }, { itemId: 'js-copper-stands', quantity: 8 }, { itemId: 'js-oak-arch', quantity: 1 }], placedItems: juniperPlan, messages: [{ id: 'juniper-msg-1', senderRole: 'bride', senderName: 'Olivia & James', body: 'Can we keep the Glass Hall tables long and clean, with the copper stands only on every other table?', timestamp: '2026-08-20T11:15:00-05:00', attachments: [], context: { kind: 'area', id: 'glass-hall', label: 'Glass Hall' }, readByBride: true, readByVenue: false }] },
  { id: 'wedding-maya-theo', venueId: juniperStone.id, accessSlug: 'maya-theo', accessCode: '555555', status: 'Ready', paymentStepsCompleted: 3, profile: { couple: 'Maya & Theo', date: '2026-11-21', guests: 76, packageId: 'js-essential', ceremonyArea: 'orchard-lawn', receptionArea: 'glass-hall', primaryEmail: 'maya@example.com', partnerEmail: 'theo@example.com', contractSigned: true, reservationPaid: true, notes: 'Simple orchard ceremony with mostly candlelight and bud vases inside.' }, selections: [{ itemId: 'js-smoked-vases', quantity: 28 }, { itemId: 'js-hurricanes', quantity: 24 }], placedItems: [], messages: [] },
  { id: 'event-northstar-summit', venueId: foundryRivergate.id, accessSlug: 'northstar-health-summit', accessCode: '666666', status: 'Designing', paymentStepsCompleted: 2, profile: { couple: 'Northstar Health Leadership Summit', date: '2026-10-08', guests: 180, packageId: 'fr-signature', ceremonyArea: 'fr-gallery', receptionArea: 'fr-main-hall', primaryEmail: 'events@northstar.example', partnerEmail: 'operations@northstar.example', contractSigned: true, reservationPaid: true, notes: 'Classroom seating in the Main Hall, registration in the Gallery, stage centered on the north wall and clear sponsor space near entry.' }, selections: [{ itemId: 'fr-stage', quantity: 6 }, { itemId: 'fr-podium', quantity: 1 }, { itemId: 'fr-uplights', quantity: 18 }], placedItems: foundryPlan, messages: [{ id: 'foundry-msg-1', senderRole: 'bride', senderName: 'Northstar Health Events Team', body: 'Can we keep registration in the Gallery and leave the Main Hall entry clear for sponsor displays?', timestamp: '2026-08-20T13:20:00-05:00', attachments: [], context: { kind: 'area', id: 'fr-gallery', label: 'Gallery' }, readByBride: true, readByVenue: false }] },
  { id: 'event-river-city-gala', venueId: foundryRivergate.id, accessSlug: 'river-city-foundation-gala', accessCode: '777777', status: 'Ready', paymentStepsCompleted: 3, profile: { couple: 'River City Foundation Gala', date: '2026-11-14', guests: 240, packageId: 'fr-buyout', ceremonyArea: 'fr-gallery', receptionArea: 'fr-main-hall', primaryEmail: 'gala@rivercityfoundation.example', partnerEmail: 'director@rivercityfoundation.example', contractSigned: true, reservationPaid: true, notes: 'Black-tie gala with cocktail reception in the Gallery, dinner in Main Hall and rooftop donor reception after awards.' }, selections: [{ itemId: 'fr-cocktail', quantity: 16 }, { itemId: 'fr-uplights', quantity: 28 }, { itemId: 'fr-lounge', quantity: 3 }, { itemId: 'fr-linens', quantity: 24 }], placedItems: [], messages: [] },
]

type RouteState = { page: PageKey; coupleSlug: string | null; venueSlug: string | null }
const scopedPages: PageKey[] = ['catalog','wedding','planner','media','ai-preview','messages','calendar','summary']

function parseRoute(): RouteState {
  const value = window.location.hash.replace(/^#\/?/, '')
  const parts = value.split('/').filter(Boolean)
  if (!parts.length) return { page: 'home', coupleSlug: null, venueSlug: null }
  if (parts[0] === 'couple' && parts[1]) return { page: 'wedding', coupleSlug: decodeURIComponent(parts[1]), venueSlug: chandelierOaks.slug }
  if (parts[0] === 'venue' && parts[1]) {
    const venueSlug = decodeURIComponent(parts[1])
    if ((parts[2] === 'couple' || parts[2] === 'client') && parts[3]) return { page: 'wedding', coupleSlug: decodeURIComponent(parts[3]), venueSlug }
    if (parts[2] === 'owner') return { page: 'admin', coupleSlug: null, venueSlug }
    if (parts[2] && scopedPages.includes(parts[2] as PageKey)) return { page: parts[2] as PageKey, coupleSlug: null, venueSlug }
    return { page: 'venue', coupleSlug: null, venueSlug }
  }
  const allowed: PageKey[] = ['home','venues','for-venues','signin','platform']
  return { page: allowed.includes(parts[0] as PageKey) ? parts[0] as PageKey : 'home', coupleSlug: null, venueSlug: null }
}

function readLocal<T>(key: string, fallback: T): T { try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback } catch { return fallback } }
function readSession<T>(key: string, fallback: T): T { try { const value = sessionStorage.getItem(key); return value ? JSON.parse(value) as T : fallback } catch { return fallback } }
function slugify(value: string) { return value.toLowerCase().trim().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'event' }
function loadWeddings() {
  const saved = readLocal<WeddingWorkspace[]>('venueVisions.saas.weddings.v3', readLocal<WeddingWorkspace[]>('venueVisions.saas.weddings.v2', []))
  if (!saved.length) return previewWeddings
  const byId = new Map(saved.map((wedding) => [wedding.id, wedding]))
  return previewWeddings.map((seed) => byId.get(seed.id) ?? seed).concat(saved.filter((wedding) => !previewWeddings.some((seed) => seed.id === wedding.id)))
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
  const [venueLeads, setVenueLeads] = useState<VenueLead[]>(() => readLocal('venueVisions.saas.leads.v1', []))

  const activeVenue = venueConfigById(activeVenueId)
  const venueWeddings = useMemo(() => weddings.filter((wedding) => wedding.venueId === activeVenueId), [weddings, activeVenueId])
  const activeWedding = venueWeddings.find((wedding) => wedding.id === activeWeddingId) ?? venueWeddings[0]
  const selections = activeWedding?.selections ?? []
  const profile = activeWedding?.profile
  const placedItems = activeWedding?.placedItems ?? []
  const messages = activeWedding?.messages ?? []
  const packageInfo = profile ? packageById(profile.packageId, activeVenueId) : activeVenue.packages[0]
  const ownerAuthenticated = ownerAuthenticatedVenueId === activeVenueId
  const hasWorkspaceAccess = Boolean(activeWedding && (ownerAuthenticated || coupleAuthenticatedWeddingId === activeWedding.id))

  useEffect(() => {
    const onHashChange = () => {
      const next = parseRoute()
      setPage(next.page); setRequestedCoupleSlug(next.coupleSlug)
      if (next.venueSlug) setActiveVenueId(venueConfigBySlug(next.venueSlug).profile.id)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    if (!requestedCoupleSlug) return
    const wedding = weddings.find((item) => item.venueId === activeVenueId && item.accessSlug === requestedCoupleSlug)
    if (wedding) setActiveWeddingId(wedding.id)
  }, [requestedCoupleSlug, weddings, activeVenueId])

  useEffect(() => {
    if (!venueWeddings.length) return
    if (!venueWeddings.some((wedding) => wedding.id === activeWeddingId)) setActiveWeddingId(venueWeddings[0].id)
  }, [activeVenueId, venueWeddings, activeWeddingId])

  useEffect(() => localStorage.setItem('venueVisions.saas.weddings.v3', JSON.stringify(weddings)), [weddings])
  useEffect(() => localStorage.setItem('venueVisions.saas.activeWeddingId', JSON.stringify(activeWeddingId)), [activeWeddingId])
  useEffect(() => localStorage.setItem('venueVisions.saas.activeVenueId', JSON.stringify(activeVenueId)), [activeVenueId])
  useEffect(() => localStorage.setItem('venueVisions.saas.notifications', JSON.stringify(notificationsEnabled)), [notificationsEnabled])
  useEffect(() => localStorage.setItem('venueVisions.saas.leads.v1', JSON.stringify(venueLeads)), [venueLeads])
  useEffect(() => { if (coupleAuthenticatedWeddingId) sessionStorage.setItem('venueVisions.saas.coupleSessionWeddingId', JSON.stringify(coupleAuthenticatedWeddingId)); else sessionStorage.removeItem('venueVisions.saas.coupleSessionWeddingId') }, [coupleAuthenticatedWeddingId])
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


  const updateActiveWedding = (updater: (current: WeddingWorkspace) => WeddingWorkspace) => setWeddings((current) => current.map((wedding) => wedding.id === activeWedding?.id ? updater(wedding) : wedding))

  useEffect(() => {
    if (page !== 'messages' || !activeWedding || !hasWorkspaceAccess) return
    const role: MessageRole = ownerAuthenticated ? 'venue' : 'bride'
    const nextMessages = activeWedding.messages.map((message) => {
      if (message.senderRole === role) return message
      if (role === 'bride' && !message.readByBride) return { ...message, readByBride: true }
      if (role === 'venue' && !message.readByVenue) return { ...message, readByVenue: true }
      return message
    })
    if (nextMessages.some((message, index) => message !== activeWedding.messages[index])) updateActiveWedding((wedding) => ({ ...wedding, messages: nextMessages }))
  }, [page, ownerAuthenticated, activeWedding?.id, hasWorkspaceAccess])

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

  const openCoupleByWeddingId = (id: string) => {
    const wedding = weddings.find((entry) => entry.id === id); if (!wedding) return
    const venue = venueConfigById(wedding.venueId)
    setActiveVenueId(wedding.venueId); setActiveWeddingId(wedding.id); setCoupleAuthenticatedWeddingId(null); setOwnerAuthenticatedVenueId(null); setPlatformAuthenticated(false)
    const accessSegment = (venue.profile.clientLabel ?? 'client') === 'couple' ? 'couple' : 'client'
    window.location.hash = `#/venue/${venue.profile.slug}/${accessSegment}/${encodeURIComponent(wedding.accessSlug)}`; setPage('wedding'); setRequestedCoupleSlug(wedding.accessSlug); window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openCoupleBySlug = (venueSlug: string, coupleSlug: string) => {
    const venue = venueConfigBySlug(venueSlug)
    const wedding = weddings.find((entry) => entry.venueId === venue.profile.id && entry.accessSlug === coupleSlug)
    if (wedding) openCoupleByWeddingId(wedding.id)
  }

  const openFirstCouple = () => { if (venueWeddings[0]) openCoupleByWeddingId(venueWeddings[0].id) }
  const openMessageContext = (context: MessageContext) => { if (context.kind === 'inventory') { localStorage.setItem('venueVisions.catalogFocus', context.id); navigate('catalog') } else { localStorage.setItem('venueVisions.plannerArea', context.id); navigate('planner') } }

  const setQuantity = (itemId: string, requested: number) => {
    if (!hasWorkspaceAccess) { navigate('wedding'); return }
    const item = activeVenue.inventory.find((entry) => entry.id === itemId)
    if (!item || !itemAllowedForTier(item, packageInfo.tier)) return
    const quantity = Math.max(0, Math.min(requested, item.quantity))
    updateActiveWedding((wedding) => {
      const current = wedding.selections
      const next = quantity === 0 ? current.filter((entry) => entry.itemId !== itemId) : current.some((entry) => entry.itemId === itemId) ? current.map((entry) => entry.itemId === itemId ? { ...entry, quantity } : entry) : [...current, { itemId, quantity }]
      return { ...wedding, selections: next, status: next.length ? 'Designing' : wedding.status }
    })
  }

  const updateProfile = (next: WeddingProfile) => {
    if (!hasWorkspaceAccess || !activeWedding) return
    if (next.date && venueWeddings.some((wedding) => wedding.id !== activeWedding.id && wedding.profile.date === next.date)) {
      const conflict = venueWeddings.find((wedding) => wedding.id !== activeWedding.id && wedding.profile.date === next.date)
      window.alert(`${next.date} is already booked for ${conflict?.profile.couple} at ${activeVenue.profile.shortName}. Choose another date.`); return
    }
    const nextPackage = packageById(next.packageId, activeVenueId)
    if (nextPackage.maxGuests !== null && next.guests > nextPackage.maxGuests) { window.alert(`${nextPackage.name} is configured for a maximum of ${nextPackage.maxGuests} guests.`); return }
    updateActiveWedding((wedding) => ({ ...wedding, profile: next }))
  }

  const setPlacedItems = (next: PlacedItem[] | ((current: PlacedItem[]) => PlacedItem[])) => { if (!hasWorkspaceAccess) return; updateActiveWedding((wedding) => ({ ...wedding, placedItems: typeof next === 'function' ? next(wedding.placedItems) : next, status: 'Designing' })) }
  const setMessages = (next: WeddingMessage[] | ((current: WeddingMessage[]) => WeddingMessage[])) => { if (!hasWorkspaceAccess) return; updateActiveWedding((wedding) => ({ ...wedding, messages: typeof next === 'function' ? next(wedding.messages) : next })) }
  const selectActiveWedding = (id: string) => { if (venueWeddings.some((wedding) => wedding.id === id)) setActiveWeddingId(id) }
  const openWedding = (id: string, destination: PageKey = 'wedding') => { const wedding = weddings.find((entry) => entry.id === id); if (!wedding) return; setActiveVenueId(wedding.venueId); setActiveWeddingId(id); const venue = venueConfigById(wedding.venueId); const hash = destination === 'admin' ? `#/venue/${venue.profile.slug}/owner` : `#/venue/${venue.profile.slug}/${destination}`; window.location.hash = hash; setPage(destination); setRequestedCoupleSlug(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  const addWedding = (input: { couple: string; date: string; guests: number; packageId: string; primaryEmail: string }): string | null => {
    const eventLabel = activeVenue.profile.eventLabel ?? 'event'
    const clientLabel = activeVenue.profile.clientLabel ?? 'client'
    const cleanCouple = input.couple.trim(); if (!cleanCouple) return `Enter the ${clientLabel} or ${eventLabel} name.`; if (!input.date) return `Choose an ${eventLabel} date.`
    const conflict = venueWeddings.find((wedding) => wedding.profile.date === input.date); if (conflict) return `${input.date} is already booked for ${conflict.profile.couple} at ${activeVenue.profile.shortName}.`
    const pkg = packageById(input.packageId, activeVenueId); if (pkg.maxGuests !== null && input.guests > pkg.maxGuests) return `${pkg.name} is configured for a maximum of ${pkg.maxGuests} guests.`
    const id = `${eventLabel}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; const baseSlug = slugify(cleanCouple); let accessSlug = baseSlug; let suffix = 2; while (venueWeddings.some((wedding) => wedding.accessSlug === accessSlug)) accessSlug = `${baseSlug}-${suffix++}`
    const secondary = activeVenue.areas.find((area) => area.kind === 'Ceremony')?.id ?? activeVenue.areas.find((area) => area.kind === 'Hospitality')?.id ?? ''
    const primary = activeVenue.areas.find((area) => area.kind === 'Reception')?.id ?? activeVenue.areas[0]?.id ?? ''
    const newWedding: WeddingWorkspace = { id, venueId: activeVenueId, accessSlug, accessCode: String(Math.floor(100000 + Math.random() * 900000)), status: 'Not started' as WeddingStatus, paymentStepsCompleted: 1, profile: { couple: cleanCouple, date: input.date, guests: Math.max(1, input.guests || 1), packageId: input.packageId, ceremonyArea: secondary, receptionArea: primary, primaryEmail: input.primaryEmail.trim(), partnerEmail: '', contractSigned: true, reservationPaid: true, notes: '' }, selections: [], placedItems: [], messages: [] }
    setWeddings((current) => [...current, newWedding]); setActiveWeddingId(id); return null
  }

  const authenticateOwner = async (emailOrCode: string, password?: string): Promise<{ ok: boolean; error?: string }> => {
    const usesRealAuth = activeVenue.profile.slug === 'chandelier-oaks'
    if (!usesRealAuth) {
      if (emailOrCode.trim() !== activeVenue.ownerAccessCode) return { ok: false, error: 'Incorrect preview password.' }
      setOwnerAuthenticatedVenueId(activeVenueId)
      setCoupleAuthenticatedWeddingId(null)
      return { ok: true }
    }

    if (!supabase) return { ok: false, error: 'Supabase is not configured on this deployment.' }

    try {
      const login = await signInWithPassword(emailOrCode.trim(), password ?? '')
      if (!login.user?.id) {
        setOwnerAuthenticatedVenueId(null)
        return { ok: false, error: 'Unable to identify the signed-in account.' }
      }
      const access = await getVenueStaffAccessBySlug(activeVenue.profile.slug, login.user.id)
      if (!access.allowed) {
        await signOutSupabase()
        setOwnerAuthenticatedVenueId(null)
        return { ok: false, error: `This account does not have access to ${activeVenue.profile.shortName}.` }
      }

      setOwnerAuthenticatedVenueId(activeVenueId)
      setCoupleAuthenticatedWeddingId(null)
      return { ok: true }
    } catch (error) {
      setOwnerAuthenticatedVenueId(null)
      return { ok: false, error: error instanceof Error ? error.message : 'Unable to sign in.' }
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
      return { ok: true }
    } catch (error) {
      setPlatformAuthenticated(false)
      return { ok: false, error: error instanceof Error ? error.message : 'Unable to sign in.' }
    }
  }
  const authenticateCouple = (code: string) => { if (!activeWedding || code.trim() !== activeWedding.accessCode) return false; setCoupleAuthenticatedWeddingId(activeWedding.id); setOwnerAuthenticatedVenueId(null); return true }
  const logoutOwner = async () => { setOwnerAuthenticatedVenueId(null); try { if (activeVenue.profile.slug === 'chandelier-oaks' && supabase) await signOutSupabase() } finally { navigate('venue') } }
  const logoutPlatform = async () => { try { if (supabase) await signOutSupabase() } finally { setPlatformAuthenticated(false); navigate('home') } }
  const logoutCouple = () => { setCoupleAuthenticatedWeddingId(null); navigate('venue') }

  const selectionCount = useMemo(() => selections.reduce((sum, item) => sum + item.quantity, 0), [selections])
  const unreadMessages = useMemo(() => messages.filter((message) => { const role: MessageRole = ownerAuthenticated ? 'venue' : 'bride'; if (message.senderRole === role) return false; return role === 'bride' ? !message.readByBride : !message.readByVenue }).length, [messages, ownerAuthenticated])
  const protectedPage = page === 'wedding' || page === 'planner' || page === 'media' || page === 'ai-preview' || page === 'messages' || page === 'summary'
  const showCoupleGate = protectedPage && !hasWorkspaceAccess
  const showCalendarGate = page === 'calendar' && !ownerAuthenticated

  const resetPreview = () => {
    if (!window.confirm('Reset all venue showcases, event workspaces, uploads and saved venue-request examples?')) return
    setWeddings(previewWeddings); setActiveVenueId(chandelierOaks.id); setActiveWeddingId('wedding-sarah-john'); setNotificationsEnabled(false); setOwnerAuthenticatedVenueId(null); setPlatformAuthenticated(false); setCoupleAuthenticatedWeddingId(null); setVenueLeads([])
    Object.keys(localStorage).filter((key) => key.startsWith('venueVisions.saas.') || key.startsWith('venueVisions.poc.')).forEach((key) => localStorage.removeItem(key))
    Object.keys(sessionStorage).filter((key) => key.startsWith('venueVisions.saas.')).forEach((key) => sessionStorage.removeItem(key))
    try { indexedDB.deleteDatabase('venueVisionsMediaDemo') } catch { /* preview cleanup only */ }
    window.location.hash = '#/'; setPage('home')
  }

  return (
    <div className="app-shell" style={{ '--venue-primary': activeVenue.profile.brandPrimary, '--venue-accent': activeVenue.profile.brandAccent, '--venue-surface': activeVenue.profile.brandSurface ?? '#f5f5f5', '--venue-text': activeVenue.profile.brandText ?? activeVenue.profile.brandPrimary } as CSSProperties}>
      <Header page={page} onNavigate={navigate} selectionCount={selectionCount} unreadMessages={unreadMessages} activeWeddingName={profile?.couple ?? ''} weddings={venueWeddings} activeWeddingId={activeWedding?.id ?? ''} activeVenue={activeVenue.profile} ownerAuthenticated={ownerAuthenticated} coupleAuthenticated={coupleAuthenticatedWeddingId === activeWedding?.id} platformAuthenticated={platformAuthenticated} onSelectWedding={selectActiveWedding} onOwnerLogout={logoutOwner} onCoupleLogout={logoutCouple} onPlatformLogout={logoutPlatform} onResetPreview={resetPreview} />

      {showCoupleGate && activeWedding && <CoupleAccess wedding={activeWedding} venueId={activeVenueId} onSubmitCode={authenticateCouple} onBackHome={() => navigate('venue')} />}
      {showCalendarGate && <Admin venueId={activeVenueId} weddings={venueWeddings} activeWeddingId={activeWedding?.id ?? ''} onSelectWedding={selectActiveWedding} onOpenWedding={openWedding} onAddWedding={addWedding} authenticated={ownerAuthenticated} authLoading={ownerAuthLoading} onAuthenticate={authenticateOwner} onExitPreview={() => navigate('venue')} onLogout={logoutOwner} onNavigate={navigate} />}

      {!showCoupleGate && !showCalendarGate && page === 'home' && <Home onNavigate={navigate} onOpenVenue={openVenueBySlug} venues={venueConfigs} />}
      {!showCoupleGate && !showCalendarGate && page === 'venues' && <Venues venues={venueConfigs} weddings={weddings} onOpenVenue={openVenueBySlug} onOpenCouple={openCoupleBySlug} onForVenues={() => navigate('for-venues')} />}
      {!showCoupleGate && !showCalendarGate && page === 'for-venues' && <ForVenues leads={venueLeads} setLeads={setVenueLeads} onBackHome={() => navigate('home')} onViewVenueDemo={() => navigate('venues')} />}
      {!showCoupleGate && !showCalendarGate && page === 'signin' && <SignIn venues={venueConfigs} activeVenueId={activeVenueId} onSelectVenue={selectVenue} onVenueOwner={() => navigate('admin')} onCouple={openFirstCouple} onBackHome={() => navigate('home')} />}
      {!showCoupleGate && !showCalendarGate && page === 'venue' && <VenuePortal venueId={activeVenueId} weddings={venueWeddings} onNavigate={navigate} onOpenCouple={openCoupleByWeddingId} />}
      {!showCoupleGate && !showCalendarGate && page === 'catalog' && <Catalog venueId={activeVenueId} selections={selections} onSetQuantity={setQuantity} canEdit={hasWorkspaceAccess} onRequireAccess={openFirstCouple} packageTier={packageInfo.tier} packageName={packageInfo.name} />}
      {!showCoupleGate && !showCalendarGate && page === 'wedding' && profile && activeWedding && <Wedding venueId={activeVenueId} profile={profile} selections={selections} unreadMessages={unreadMessages} paymentStepsCompleted={activeWedding.paymentStepsCompleted} onProfileChange={updateProfile} onSetQuantity={setQuantity} onNavigate={navigate} ownerMode={ownerAuthenticated} />}
      {!showCoupleGate && !showCalendarGate && page === 'planner' && profile && <Planner venueId={activeVenueId} selections={selections} placedItems={placedItems} setPlacedItems={setPlacedItems} onSetQuantity={setQuantity} packageTier={packageInfo.tier} preferredAreaId={profile.receptionArea || activeVenue.areas[0]?.id} onNavigate={navigate} />}
      {!showCoupleGate && !showCalendarGate && page === 'media' && activeWedding && <MediaLibrary venueId={activeVenueId} weddingId={activeWedding.id} weddingName={activeWedding.profile.couple} ownerMode={ownerAuthenticated} onNavigate={navigate} />}
      {!showCoupleGate && !showCalendarGate && page === 'ai-preview' && activeWedding && <AiPreview venueId={activeVenueId} weddingId={activeWedding.id} weddingName={activeWedding.profile.couple} preferredAreaId={activeWedding.profile.receptionArea || activeVenue.areas[0]?.id} placedItems={placedItems} selections={selections} ownerMode={ownerAuthenticated} onNavigate={navigate} />}
      {!showCoupleGate && !showCalendarGate && page === 'messages' && profile && <Messages venueId={activeVenueId} profile={profile} selections={selections} placedItems={placedItems} messages={messages} setMessages={setMessages} currentRole={ownerAuthenticated ? 'venue' : 'bride'} notificationsEnabled={notificationsEnabled} setNotificationsEnabled={setNotificationsEnabled} onOpenContext={openMessageContext} />}
      {!showCoupleGate && !showCalendarGate && page === 'summary' && activeWedding && <SetupSheet venueId={activeVenueId} wedding={activeWedding} />}
      {!showCoupleGate && !showCalendarGate && page === 'calendar' && ownerAuthenticated && <Calendar venueId={activeVenueId} weddings={venueWeddings} activeWeddingId={activeWedding?.id ?? ''} onSelectWedding={selectActiveWedding} />}
      {page === 'admin' && <Admin venueId={activeVenueId} weddings={venueWeddings} activeWeddingId={activeWedding?.id ?? ''} onSelectWedding={selectActiveWedding} onOpenWedding={openWedding} onAddWedding={addWedding} authenticated={ownerAuthenticated} authLoading={ownerAuthLoading} onAuthenticate={authenticateOwner} onExitPreview={() => navigate('venue')} onLogout={logoutOwner} onNavigate={navigate} />}
      {page === 'platform' && <PlatformAdmin authenticated={platformAuthenticated} authLoading={platformAuthLoading} onAuthenticate={authenticatePlatform} onLogout={logoutPlatform} onNavigate={navigate} leads={venueLeads} weddings={weddings} venues={venueConfigs} onOpenVenue={openVenueBySlug} />}

      <footer className="site-footer saas-footer">
        <div className="shell">
          <div className="site-footer__context">
            {ownerAuthenticated || coupleAuthenticatedWeddingId === activeWedding?.id || page === 'venue'
              ? <><span>{activeVenue.profile.shortName}</span><span>{POWERED_BY_PLATFORM}</span></>
              : platformAuthenticated
                ? <><span>{PLATFORM_NAME} Admin</span><span>Internal proof of concept Â· {venueConfigs.length} venue profiles</span></>
                : <><span>{PLATFORM_NAME}</span><span>Event venue management & planning Â· venue-first private client workspaces</span></>}
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


