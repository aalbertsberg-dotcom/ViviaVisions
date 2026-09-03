import { supabase } from '../supabase'

const SESSION_KEY = 'viviavisions.analytics.session'

function sessionId() {
  try {
    const current = sessionStorage.getItem(SESSION_KEY)
    if (current) return current
    const next = crypto.randomUUID()
    sessionStorage.setItem(SESSION_KEY, next)
    return next
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`
  }
}

async function track(
  eventType: 'page_view' | 'vendor_impression' | 'vendor_click',
  route: string,
  venueSlug?: string | null,
  vendorKey?: string | null,
) {
  if (!supabase) return
  try {
    await supabase.rpc('track_analytics_event', {
      p_event_type: eventType,
      p_session_id: sessionId(),
      p_route: route.slice(0, 500),
      p_venue_slug: venueSlug ?? null,
      p_vendor_key: vendorKey ?? null,
    })
  } catch {
    // Analytics never blocks the user experience.
  }
}

export const trackPageView = (route: string, venueSlug?: string | null) =>
  track('page_view', route, venueSlug)

export function trackVendorImpression(vendorKey: string, venueSlug: string) {
  const key = `viviavisions.analytics.impression.${venueSlug}.${vendorKey}`
  try {
    if (sessionStorage.getItem(key)) return Promise.resolve()
    sessionStorage.setItem(key, '1')
  } catch {}
  return track('vendor_impression', location.hash || '#/', venueSlug, vendorKey)
}

export const trackVendorClick = (vendorKey: string, venueSlug: string) =>
  track('vendor_click', location.hash || '#/', venueSlug, vendorKey)

const n = (value: unknown) => Number(value ?? 0)

export async function loadAnalytics(days = 30) {
  if (!supabase) throw new Error('Supabase is not configured.')
  const range = Math.max(1, Math.min(365, days))
  const [overview, pages, vendors] = await Promise.all([
    supabase.rpc('analytics_overview', { p_days: range }),
    supabase.rpc('analytics_top_pages', { p_days: range, p_limit: 8 }),
    supabase.rpc('analytics_vendor_stats', { p_days: range }),
  ])
  const error = overview.error ?? pages.error ?? vendors.error
  if (error) throw new Error(error.message)

  const row: any = Array.isArray(overview.data) ? overview.data[0] : overview.data
  return {
    overview: {
      pageViews: n(row?.page_views),
      visits: n(row?.sessions),
      impressions: n(row?.vendor_impressions),
      clicks: n(row?.vendor_clicks),
      ctr: n(row?.click_through_rate),
    },
    pages: (pages.data ?? []) as any[],
    vendors: (vendors.data ?? []) as any[],
  }
}