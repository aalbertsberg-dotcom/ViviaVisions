import { useEffect, useState } from 'react'
import { chandelierPartners } from '../config/vendorPartners'
import { loadAnalytics } from '../lib/repositories/analytics'
import { listManagedPartners } from '../lib/repositories/partners'

export default function PlatformAnalytics() {
  const [days, setDays] = useState(30)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [managedNames, setManagedNames] = useState<Record<string, string>>({})

  useEffect(() => {
    void listManagedPartners()
      .then((partners) => setManagedNames(Object.fromEntries(partners.map((partner) => [partner.partnerKey, partner.name]))))
      .catch(() => {})
  }, [])

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
    managedNames[key] ?? chandelierPartners.find((partner) => partner.key === key)?.name ?? key

  const pagesPerVisit = data?.overview.visits
    ? data.overview.pageViews / data.overview.visits
    : 0

  return (
    <section className="panel vv-admin-section platform-analytics" data-testid="platform-analytics">
      <div className="vv-admin-section__heading platform-analytics__heading">
        <div>
          <p className="eyebrow">ANALYTICS</p>
          <h2>ViviaVisions site analytics</h2>
          <p>Whole-site first-party traffic plus separate partner performance. Your own browsing and testing is included.</p>
        </div>
        <select value={days} onChange={(event) => setDays(Number(event.target.value))}>
          <option value={7}>7 days</option>
          <option value={30}>30 days</option>
          <option value={90}>90 days</option>
        </select>
      </div>

      {loading ? <div className="analytics-state">Loading analytics…</div> :
       error ? <div className="analytics-state"><strong>Analytics could not load.</strong><span>{error}</span></div> :
       data && <>
        <div className="analytics-subheading">
          <div><span>SITE TRAFFIC</span><strong>Whole ViviaVisions site</strong></div>
          <small>Visits are anonymous browser sessions, not guaranteed unique people.</small>
        </div>

        <div className="analytics-metric-grid analytics-metric-grid--site">
          <article><span>Page views</span><strong>{data.overview.pageViews.toLocaleString()}</strong><small>all tracked pages</small></article>
          <article><span>Visits / sessions</span><strong>{data.overview.visits.toLocaleString()}</strong><small>anonymous browser sessions</small></article>
          <article><span>Pages per visit</span><strong>{pagesPerVisit.toFixed(1)}</strong><small>average tracked pages</small></article>
        </div>

        <div className="analytics-card analytics-card--top-pages">
          <div className="analytics-card__title"><strong>Top pages across ViviaVisions</strong><span>Views · visits</span></div>
          <div className="analytics-ranked-list">
            {data.pages.length ? data.pages.map((row: any) => (
              <div key={row.route}>
                <span>{row.route || '#/'}</span>
                <b>{row.page_views} views · {row.sessions} visits</b>
              </div>
            )) : <span>No traffic yet.</span>}
          </div>
        </div>

        <div className="analytics-subheading analytics-subheading--partners">
          <div><span>PARTNER ANALYTICS</span><strong>Visibility & engagement</strong></div>
          <small>A partner view is a listing impression. A partner click is a click into that partner’s detail card.</small>
        </div>

        <div className="analytics-metric-grid analytics-metric-grid--partners">
          <article><span>Partner views</span><strong>{data.overview.impressions.toLocaleString()}</strong><small>listing impressions</small></article>
          <article><span>Partner card clicks</span><strong>{data.overview.clicks.toLocaleString()}</strong><small>detail opens</small></article>
          <article><span>Partner CTR</span><strong>{data.overview.ctr.toFixed(1)}%</strong><small>clicks ÷ listing views</small></article>
        </div>

        <div className="analytics-card">
          <div className="analytics-card__title"><strong>Partner performance</strong><span>Views · card clicks · CTR</span></div>
          <div className="analytics-ranked-list">
            {data.vendors.length ? data.vendors.map((row: any) => (
              <div key={row.vendor_key}>
                <span>{vendorName(row.vendor_key)}</span>
                <b>{row.impressions} views · {row.clicks} clicks · {Number(row.click_through_rate).toFixed(1)}%</b>
              </div>
            )) : <span>No partner activity yet.</span>}
          </div>
        </div>

        <p className="analytics-footnote">Analytics began when v1.17 was deployed and is not retroactive. Early numbers include development and testing traffic.</p>
       </>}
    </section>
  )
}