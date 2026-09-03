import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type { VenueConfig } from '../types'
import {
  listManagedPartners,
  saveManagedPartner,
  setManagedPartnerActive,
  type ManagedPartner,
  type ManagedPartnerInput,
} from '../lib/repositories/partners'

type Props = {
  venues: VenueConfig[]
  onBack: () => void
}

const BADGES = ['FOUNDING PARTNER', 'PREFERRED PARTNER', 'FEATURED PARTNER', 'PARTNER', 'PARTNER OPENING']
const TIERS = ['Opening', 'Founding', 'Listing', 'Featured', 'Preferred', 'Exclusive']

function emptyPartner(venues: VenueConfig[]): ManagedPartnerInput {
  const firstVenue = venues.find((venue) => !venue.profile.isSample) ?? venues[0]
  return {
    partnerKey: '',
    name: '',
    category: '',
    description: '',
    badge: 'PARTNER',
    websiteUrl: '',
    contactEmail: '',
    serviceArea: '',
    logoUrl: '',
    ctaLabel: 'Request information',
    planTier: 'Listing',
    monthlyPrice: 0,
    startDate: '',
    endDate: '',
    venueSlugs: firstVenue ? [firstVenue.profile.slug] : [],
    sortOrder: 0,
    isActive: true,
    isFeatured: false,
    isPlaceholder: false,
    internalNotes: '',
  }
}

export default function PlatformPartners({ venues, onBack }: Props) {
  const [partners, setPartners] = useState<ManagedPartner[]>([])
  const [editing, setEditing] = useState<ManagedPartnerInput | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')

  const refresh = async () => {
    setLoading(true)
    setError('')
    try {
      setPartners(await listManagedPartners())
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load partners.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  const visible = useMemo(
    () => partners.filter((partner) => showArchived ? !partner.isActive : partner.isActive),
    [partners, showArchived],
  )

  const counts = useMemo(() => ({
    active: partners.filter((partner) => partner.isActive).length,
    featured: partners.filter((partner) => partner.isActive && partner.isFeatured).length,
    archived: partners.filter((partner) => !partner.isActive).length,
  }), [partners])

  const beginEdit = (partner: ManagedPartner) => {
    setEditing({ ...partner })
    setError('')
    setStatus('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleVenue = (slug: string) => {
    if (!editing) return
    const venueSlugs = editing.venueSlugs.includes(slug)
      ? editing.venueSlugs.filter((entry) => entry !== slug)
      : [...editing.venueSlugs, slug]
    setEditing({ ...editing, venueSlugs })
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!editing) return

    setSaving(true)
    setError('')
    setStatus('')

    try {
      const saved = await saveManagedPartner(editing)
      setStatus(`${saved.name} saved.`)
      setEditing(null)
      await refresh()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save the partner.')
    } finally {
      setSaving(false)
    }
  }

  const changeActive = async (partner: ManagedPartner, next: boolean) => {
    const action = next ? 'restore' : 'archive'
    if (!next && !window.confirm(`Archive ${partner.name}? It will stop appearing on public venue pages.`)) return

    setError('')
    setStatus('')
    try {
      await setManagedPartnerActive(partner.id, next)
      setStatus(`${partner.name} ${action}d.`)
      await refresh()
    } catch (changeError) {
      setError(changeError instanceof Error ? changeError.message : `Unable to ${action} the partner.`)
    }
  }

  return (
    <main className="page-main shell platform-partners-page">
      <div className="platform-manager-heading">
        <div>
          <p className="eyebrow">VIVIAVISIONS ADMIN</p>
          <h1>Partner Management</h1>
          <p>Manage partner listings, venue placement, pricing notes and the public profile shown to couples and event clients.</p>
        </div>
        <div className="platform-manager-heading__actions">
          <button className="button button--ghost" type="button" onClick={onBack}>← Admin</button>
          <button className="button button--primary" type="button" onClick={() => setEditing(emptyPartner(venues))}>Add partner</button>
        </div>
      </div>

      <section className="partner-admin-metrics">
        <article><span>Active partners</span><strong>{counts.active}</strong></article>
        <article><span>Featured</span><strong>{counts.featured}</strong></article>
        <article><span>Archived</span><strong>{counts.archived}</strong></article>
      </section>

      {editing && (
        <form className="panel partner-editor" onSubmit={submit}>
          <div className="partner-editor__heading">
            <div>
              <p className="eyebrow">{editing.id ? 'EDIT PARTNER' : 'NEW PARTNER'}</p>
              <h2>{editing.id ? editing.name : 'Create partner listing'}</h2>
            </div>
            <button className="text-link" type="button" onClick={() => setEditing(null)}>Cancel</button>
          </div>

          <div className="partner-editor__grid">
            <label>
              <span>Partner name</span>
              <input value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} required />
            </label>

            <label>
              <span>Category</span>
              <input value={editing.category} onChange={(event) => setEditing({ ...editing, category: event.target.value })} placeholder="Luxury Restrooms" required />
            </label>

            <label>
              <span>Badge</span>
              <select value={editing.badge} onChange={(event) => setEditing({ ...editing, badge: event.target.value })}>
                {BADGES.map((badge) => <option key={badge}>{badge}</option>)}
              </select>
            </label>

            <label>
              <span>Partner plan</span>
              <select value={editing.planTier} onChange={(event) => setEditing({ ...editing, planTier: event.target.value })}>
                {TIERS.map((tier) => <option key={tier}>{tier}</option>)}
              </select>
            </label>

            <label>
              <span>Monthly price</span>
              <div className="partner-money-input"><span>$</span><input type="number" min="0" step="1" value={editing.monthlyPrice} onChange={(event) => setEditing({ ...editing, monthlyPrice: Number(event.target.value) })} /></div>
            </label>

            <label>
              <span>Sort order</span>
              <input type="number" value={editing.sortOrder} onChange={(event) => setEditing({ ...editing, sortOrder: Number(event.target.value) })} />
            </label>

            <label>
              <span>Website / booking URL</span>
              <input type="url" value={editing.websiteUrl} onChange={(event) => setEditing({ ...editing, websiteUrl: event.target.value })} placeholder="https://..." />
            </label>

            <label>
              <span>Partner contact email</span>
              <input type="email" value={editing.contactEmail} onChange={(event) => setEditing({ ...editing, contactEmail: event.target.value })} />
            </label>

            <label>
              <span>Service area</span>
              <input value={editing.serviceArea} onChange={(event) => setEditing({ ...editing, serviceArea: event.target.value })} placeholder="Mississippi Gulf Coast" />
            </label>

            <label>
              <span>Public CTA</span>
              <input value={editing.ctaLabel} onChange={(event) => setEditing({ ...editing, ctaLabel: event.target.value })} placeholder="Visit website" />
            </label>

            <label className="partner-editor__wide">
              <span>Logo / image URL</span>
              <input type="url" value={editing.logoUrl} onChange={(event) => setEditing({ ...editing, logoUrl: event.target.value })} placeholder="https://..." />
            </label>

            <label className="partner-editor__wide">
              <span>Public description</span>
              <textarea rows={4} value={editing.description} onChange={(event) => setEditing({ ...editing, description: event.target.value })} />
            </label>

            <div className="partner-editor__wide">
              <span className="partner-editor__label">Venue placement</span>
              <div className="partner-venue-checks">
                {venues.map((venue) => (
                  <label key={venue.profile.id}>
                    <input type="checkbox" checked={editing.venueSlugs.includes(venue.profile.slug)} onChange={() => toggleVenue(venue.profile.slug)} />
                    <span>{venue.profile.shortName}{venue.profile.isSample ? ' · Demo' : ''}</span>
                  </label>
                ))}
              </div>
            </div>

            <label>
              <span>Start date</span>
              <input type="date" value={editing.startDate} onChange={(event) => setEditing({ ...editing, startDate: event.target.value })} />
            </label>

            <label>
              <span>End date</span>
              <input type="date" value={editing.endDate} onChange={(event) => setEditing({ ...editing, endDate: event.target.value })} />
            </label>

            <label className="partner-editor__wide">
              <span>Internal notes</span>
              <textarea rows={3} value={editing.internalNotes} onChange={(event) => setEditing({ ...editing, internalNotes: event.target.value })} placeholder="Billing, contacts, negotiated terms, follow-up notes..." />
            </label>
          </div>

          <div className="partner-editor__toggles">
            <label><input type="checkbox" checked={editing.isFeatured} onChange={(event) => setEditing({ ...editing, isFeatured: event.target.checked })} /> Featured placement</label>
            <label><input type="checkbox" checked={editing.isPlaceholder} onChange={(event) => setEditing({ ...editing, isPlaceholder: event.target.checked })} /> Placeholder / open category</label>
          </div>

          {error && <div className="owner-access-error" role="alert">{error}</div>}

          <div className="partner-editor__actions">
            <button className="button button--primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save partner'}</button>
            <button className="button button--ghost" type="button" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </form>
      )}

      {status && <div className="client-auth-status partner-admin-status" role="status">{status}</div>}
      {!editing && error && <div className="owner-access-error" role="alert">{error}</div>}

      <section className="panel partner-admin-list">
        <div className="partner-admin-list__heading">
          <div>
            <p className="eyebrow">{showArchived ? 'ARCHIVED' : 'ACTIVE'}</p>
            <h2>{showArchived ? 'Archived partners' : 'Partner listings'}</h2>
          </div>
          <div className="partner-admin-tabs">
            <button className={!showArchived ? 'active' : ''} type="button" onClick={() => setShowArchived(false)}>Active ({counts.active})</button>
            <button className={showArchived ? 'active' : ''} type="button" onClick={() => setShowArchived(true)}>Archived ({counts.archived})</button>
          </div>
        </div>

        {loading ? (
          <div className="analytics-state">Loading partners…</div>
        ) : visible.length ? (
          <div className="partner-admin-rows">
            {visible.map((partner) => (
              <article className="partner-admin-row" key={partner.id}>
                <div className="partner-admin-row__mark">
                  {partner.logoUrl
                    ? <img src={partner.logoUrl} alt="" />
                    : partner.name.split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase()}
                </div>

                <div className="partner-admin-row__identity">
                  <div><h3>{partner.name}</h3><span>{partner.badge}</span></div>
                  <p>{partner.category}{partner.serviceArea ? ` · ${partner.serviceArea}` : ''}</p>
                  <small>{partner.venueSlugs.join(', ') || 'No venue placement'}</small>
                </div>

                <div className="partner-admin-row__commercial">
                  <strong>{partner.planTier}</strong>
                  <span>{partner.monthlyPrice > 0 ? `$${partner.monthlyPrice.toLocaleString()}/mo` : 'No monthly fee'}</span>
                  {partner.isFeatured && <b>Featured</b>}
                </div>

                <div className="partner-admin-row__actions">
                  <button className="button button--ghost button--small" type="button" onClick={() => beginEdit(partner)}>Edit</button>
                  <button className="text-link" type="button" onClick={() => void changeActive(partner, !partner.isActive)}>
                    {partner.isActive ? 'Archive' : 'Restore'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="analytics-state">{showArchived ? 'No archived partners.' : 'No active partners yet.'}</div>
        )}
      </section>
    </main>
  )
}