import { useEffect, useState } from 'react'
import { chandelierPartners } from '../config/vendorPartners'
import { loadAnalytics } from '../lib/repositories/analytics'

export default function PlatformAnalytics() {
  const [days, setDays] = useState(30)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    void loadAnalytics(days)
      .then((result) => { if (!cancelled) setData(result) })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load analytics.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [days])

  const vendorName = (key: string) =>
    chandelierPartners.find((partner) => partner.key === key)?.name ?? key

  return (
    <section className="panel vv-admin-section platform-analytics" data-testid="platform-analytics">
      <div className="vv-admin-section__heading platform-analytics__heading">
        <div><p className="eyebrow">ANALYTICS</p><h2>Traffic & partner performance</h2><p>Anonymous first-party usage analytics.</p></div>
        <select value={days} onChange={(event) => setDays(Number(event.target.value))}>
          <option value={7}>7 days</option><option value={30}>30 days</option><option value={90}>90 days</option>
        </select>
      </div>

      {loading ? <div className="analytics-state">Loading analytics…</div> :
       error ? <div className="analytics-state"><strong>Apply Supabase migration 010.</strong><span>{error}</span></div> :
       data && <>
        <div className="analytics-metric-grid">
          <article><span>Page views</span><strong>{data.overview.pageViews.toLocaleString()}</strong></article>
          <article><span>Visits</span><strong>{data.overview.visits.toLocaleString()}</strong><small>anonymous sessions</small></article>
          <article><span>Partner views</span><strong>{data.overview.impressions.toLocaleString()}</strong></article>
          <article><span>Partner clicks</span><strong>{data.overview.clicks.toLocaleString()}</strong><small>{data.overview.ctr.toFixed(1)}% CTR</small></article>
        </div>

        <div className="analytics-layout">
          <div className="analytics-card">
            <strong>Top pages</strong>
            <div className="analytics-ranked-list">
              {data.pages.length ? data.pages.map((row: any) => <div key={row.route}><span>{row.route || '#/'}</span><b>{row.page_views} views · {row.sessions} visits</b></div>) : <span>No traffic yet.</span>}
            </div>
          </div>
          <div className="analytics-card">
            <strong>Partner performance</strong>
            <div className="analytics-ranked-list">
              {data.vendors.length ? data.vendors.map((row: any) => <div key={row.vendor_key}><span>{vendorName(row.vendor_key)}</span><b>{row.impressions} views · {row.clicks} clicks · {Number(row.click_through_rate).toFixed(1)}%</b></div>) : <span>No partner activity yet.</span>}
            </div>
          </div>
        </div>
       </>}
    </section>
  )
}