import { useEffect, useState } from 'react'
import { venueConfigById } from '../data'
import type { VenuePackage, VenueArea } from '../types'
import {
  archiveManagedPackage,
  archiveManagedSpace,
  getManagedVenueContent,
  refreshRuntimeVenueConfig,
  saveManagedPackage,
  saveManagedSpace,
  saveManagedVenueProfile,
  type ManagedPackageInput,
  type ManagedSpaceInput,
  type ManagedVenueContent,
  type ManagedVenueProfile,
} from '../lib/repositories/contentAdmin'

type VenueContentManagerProps = {
  venueId: string
  onBack: () => void
}

function sampleSnapshot(venueId: string): ManagedVenueContent {
  const config = venueConfigById(venueId)
  const p = config.profile
  return {
    venue: {
      id: p.id,
      slug: p.slug,
      name: p.name,
      shortName: p.shortName,
      tagline: p.tagline,
      website: p.website,
      address: p.address,
      phone: p.phone,
      email: p.email,
      ownerDisplayName: p.ownerName,
      brandPrimary: p.brandPrimary,
      brandAccent: p.brandAccent,
      brandSurface: p.brandSurface ?? '',
      brandText: p.brandText ?? '',
      logoText: p.logoText,
      locationLabel: p.locationLabel ?? '',
      inventoryLabel: p.inventoryLabel ?? '',
      venueTypeLabel: p.venueTypeLabel ?? 'Event venue',
      eventLabel: p.eventLabel ?? 'event',
      eventPluralLabel: p.eventPluralLabel ?? 'events',
      clientLabel: p.clientLabel ?? 'client',
      clientPluralLabel: p.clientPluralLabel ?? 'clients',
      portalHeroTitle: p.portalHeroTitle ?? '',
      portalHeroBody: p.portalHeroBody ?? '',
      oneEventPerDate: config.oneEventPerDate,
      ownerDashboardNote: config.ownerDashboardNote,
      isPublished: true,
    },
    packages: config.packages.map((pkg, index) => ({
      id: pkg.id,
      externalKey: pkg.id,
      name: pkg.name,
      price: pkg.price,
      duration: pkg.duration,
      maxGuests: pkg.maxGuests,
      tier: pkg.tier,
      description: pkg.description,
      highlights: pkg.highlights,
      sortOrder: index,
      isPublic: true,
      isActive: true,
    })),
    spaces: config.areas.map((space, index) => ({
      id: space.id,
      externalKey: space.id,
      name: space.name,
      kind: space.kind,
      description: space.description,
      plannerEnabled: space.plannerEnabled,
      visualKey: space.visual,
      sortOrder: index,
      isPublic: true,
      isActive: true,
    })),
  }
}

function blankPackage(): ManagedPackageInput {
  return {
    externalKey: '',
    name: '',
    price: 0,
    duration: '',
    maxGuests: null,
    tier: 1,
    description: '',
    highlights: [],
    sortOrder: 0,
    isPublic: true,
    isActive: true,
  }
}

function blankSpace(): ManagedSpaceInput {
  return {
    externalKey: '',
    name: '',
    kind: 'Reception',
    description: '',
    plannerEnabled: true,
    visualKey: '',
    sortOrder: 0,
    isPublic: true,
    isActive: true,
  }
}

export default function VenueContentManager({ venueId, onBack }: VenueContentManagerProps) {
  const config = venueConfigById(venueId)
  const canEdit = !config.profile.isSample
  const [snapshot, setSnapshot] = useState<ManagedVenueContent | null>(null)
  const [profile, setProfile] = useState<ManagedVenueProfile | null>(null)
  const [tab, setTab] = useState<'profile' | 'packages' | 'spaces'>('profile')
  const [packageDraft, setPackageDraft] = useState<ManagedPackageInput | null>(null)
  const [spaceDraft, setSpaceDraft] = useState<ManagedSpaceInput | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')

  const load = async () => {
    setError('')
    try {
      const next = config.profile.isSample ? sampleSnapshot(venueId) : await getManagedVenueContent(config.profile.slug)
      setSnapshot(next)
      setProfile(next.venue)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load venue setup.')
    }
  }

  useEffect(() => {
    void load()
  }, [venueId])

  const saveProfile = async () => {
    if (!profile || !canEdit) return
    setBusy(true)
    setError('')
    setStatus('')
    try {
      const saved = await saveManagedVenueProfile(config.profile.slug, profile)
      setProfile(saved)
      await refreshRuntimeVenueConfig(config.profile.slug)
      await load()
      setStatus('Venue profile saved.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save venue profile.')
    } finally {
      setBusy(false)
    }
  }

  const savePackage = async () => {
    if (!packageDraft || !canEdit) return
    setBusy(true)
    setError('')
    setStatus('')
    try {
      const saved = await saveManagedPackage(config.profile.slug, packageDraft)
      await refreshRuntimeVenueConfig(config.profile.slug)
      await load()
      setPackageDraft(null)
      setStatus(`${saved.name} saved.`)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save package.')
    } finally {
      setBusy(false)
    }
  }

  const saveSpace = async () => {
    if (!spaceDraft || !canEdit) return
    setBusy(true)
    setError('')
    setStatus('')
    try {
      const saved = await saveManagedSpace(config.profile.slug, spaceDraft)
      await refreshRuntimeVenueConfig(config.profile.slug)
      await load()
      setSpaceDraft(null)
      setStatus(`${saved.name} saved.`)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save space.')
    } finally {
      setBusy(false)
    }
  }

  const archivePackage = async (pkg: VenuePackage | ManagedVenueContent['packages'][number]) => {
    if (!canEdit || !('id' in pkg)) return
    if (!window.confirm(`Archive ${pkg.name}? Existing events keep their historical package reference.`)) return
    setBusy(true)
    setError('')
    try {
      await archiveManagedPackage(pkg.id)
      await refreshRuntimeVenueConfig(config.profile.slug)
      await load()
      setStatus(`${pkg.name} archived.`)
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : 'Unable to archive package.')
    } finally {
      setBusy(false)
    }
  }

  const archiveSpace = async (space: VenueArea | ManagedVenueContent['spaces'][number]) => {
    if (!canEdit || !('id' in space)) return
    if (!window.confirm(`Archive ${space.name}? Existing event/layout history is preserved.`)) return
    setBusy(true)
    setError('')
    try {
      await archiveManagedSpace(space.id)
      await refreshRuntimeVenueConfig(config.profile.slug)
      await load()
      setStatus(`${space.name} archived.`)
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : 'Unable to archive space.')
    } finally {
      setBusy(false)
    }
  }

  if (!snapshot || !profile) {
    return <main className="page-main shell content-manager-page"><section className="panel content-manager-loading">{error || 'Loading venue setup…'}</section></main>
  }

  return (
    <main className="page-main shell content-manager-page">
      <section className="page-intro page-intro--split content-manager-heading">
        <div>
          <p className="eyebrow">{config.profile.shortName.toUpperCase()} · VENUE CONTENT</p>
          <h1>Venue setup & content.</h1>
          <p>Maintain the venue profile, packages and planning spaces that power the public site, owner dashboard and client workspaces.</p>
        </div>
        <button className="button button--ghost" onClick={onBack}>Back to dashboard</button>
      </section>

      {!canEdit && (
        <section className="panel content-manager-note">
          <strong>Showcase venue</strong>
          <p>This demo venue is read-only. The same editor becomes live automatically when the venue is onboarded into Supabase.</p>
        </section>
      )}

      <section className="content-manager-tabs" role="tablist" aria-label="Venue setup sections">
        <button className={tab === 'profile' ? 'active' : ''} onClick={() => setTab('profile')}>Profile</button>
        <button className={tab === 'packages' ? 'active' : ''} onClick={() => setTab('packages')}>Packages <b>{snapshot.packages.length}</b></button>
        <button className={tab === 'spaces' ? 'active' : ''} onClick={() => setTab('spaces')}>Spaces <b>{snapshot.spaces.length}</b></button>
      </section>

      {status && <div className="client-auth-status" role="status">{status}</div>}
      {error && <div className="owner-access-error" role="alert">{error}</div>}

      {tab === 'profile' && (
        <section className="panel venue-profile-editor">
          <div className="panel__heading">
            <div><p className="eyebrow">PUBLIC + OPERATIONS PROFILE</p><h2>{profile.shortName}</h2><p>These values feed venue branding and public/client portal copy.</p></div>
            {canEdit && <button className="button button--primary button--small" disabled={busy} onClick={() => { void saveProfile() }}>{busy ? 'Saving…' : 'Save profile'}</button>}
          </div>

          <div className="form-grid two-col">
            <label><span>Venue name</span><input disabled={!canEdit} value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} /></label>
            <label><span>Short name</span><input disabled={!canEdit} value={profile.shortName} onChange={(event) => setProfile({ ...profile, shortName: event.target.value })} /></label>
            <label><span>Owner display name</span><input disabled={!canEdit} value={profile.ownerDisplayName} onChange={(event) => setProfile({ ...profile, ownerDisplayName: event.target.value })} /></label>
            <label><span>Location label</span><input disabled={!canEdit} value={profile.locationLabel} onChange={(event) => setProfile({ ...profile, locationLabel: event.target.value })} /></label>
            <label><span>Email</span><input disabled={!canEdit} type="email" value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} /></label>
            <label><span>Phone</span><input disabled={!canEdit} value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} /></label>
            <label><span>Website</span><input disabled={!canEdit} value={profile.website} onChange={(event) => setProfile({ ...profile, website: event.target.value })} /></label>
            <label><span>Inventory name</span><input disabled={!canEdit} value={profile.inventoryLabel} onChange={(event) => setProfile({ ...profile, inventoryLabel: event.target.value })} /></label>
            <label><span>Event label</span><input disabled={!canEdit} value={profile.eventLabel} onChange={(event) => setProfile({ ...profile, eventLabel: event.target.value })} /></label>
            <label><span>Event plural</span><input disabled={!canEdit} value={profile.eventPluralLabel} onChange={(event) => setProfile({ ...profile, eventPluralLabel: event.target.value })} /></label>
            <label><span>Client label</span><input disabled={!canEdit} value={profile.clientLabel} onChange={(event) => setProfile({ ...profile, clientLabel: event.target.value })} /></label>
            <label><span>Client plural</span><input disabled={!canEdit} value={profile.clientPluralLabel} onChange={(event) => setProfile({ ...profile, clientPluralLabel: event.target.value })} /></label>
            <label><span>Primary brand color</span><input disabled={!canEdit} type="color" value={profile.brandPrimary || '#243248'} onChange={(event) => setProfile({ ...profile, brandPrimary: event.target.value })} /></label>
            <label><span>Accent brand color</span><input disabled={!canEdit} type="color" value={profile.brandAccent || '#b68a45'} onChange={(event) => setProfile({ ...profile, brandAccent: event.target.value })} /></label>
            <label><span>Logo letters</span><input disabled={!canEdit} value={profile.logoText} onChange={(event) => setProfile({ ...profile, logoText: event.target.value })} /></label>
            <label><span>Venue type</span><input disabled={!canEdit} value={profile.venueTypeLabel} onChange={(event) => setProfile({ ...profile, venueTypeLabel: event.target.value })} /></label>
          </div>

          <label className="notes-field"><span>Address</span><textarea disabled={!canEdit} value={profile.address} onChange={(event) => setProfile({ ...profile, address: event.target.value })} /></label>
          <label className="notes-field"><span>Tagline</span><textarea disabled={!canEdit} value={profile.tagline} onChange={(event) => setProfile({ ...profile, tagline: event.target.value })} /></label>
          <label className="notes-field"><span>Client portal headline</span><textarea disabled={!canEdit} value={profile.portalHeroTitle} onChange={(event) => setProfile({ ...profile, portalHeroTitle: event.target.value })} /></label>
          <label className="notes-field"><span>Client portal description</span><textarea disabled={!canEdit} value={profile.portalHeroBody} onChange={(event) => setProfile({ ...profile, portalHeroBody: event.target.value })} /></label>
          <label className="notes-field"><span>Owner dashboard note</span><textarea disabled={!canEdit} value={profile.ownerDashboardNote} onChange={(event) => setProfile({ ...profile, ownerDashboardNote: event.target.value })} /></label>

          <div className="content-editor-checks">
            <label><input disabled={!canEdit} type="checkbox" checked={profile.oneEventPerDate} onChange={(event) => setProfile({ ...profile, oneEventPerDate: event.target.checked })} /><span>Only one active event per date</span></label>
            <label><input disabled={!canEdit} type="checkbox" checked={profile.isPublished} onChange={(event) => setProfile({ ...profile, isPublished: event.target.checked })} /><span>Published venue</span></label>
          </div>
        </section>
      )}

      {tab === 'packages' && (
        <section className="panel content-list-panel">
          <div className="panel__heading">
            <div><p className="eyebrow">PACKAGES</p><h2>Venue packages</h2><p>Pricing, guest caps and package tiers drive client entitlements.</p></div>
            {canEdit && <button className="button button--primary button--small" onClick={() => setPackageDraft(blankPackage())}>+ Add package</button>}
          </div>

          <div className="content-record-grid">
            {snapshot.packages.map((pkg) => (
              <article className="content-record-card" key={pkg.id}>
                <span className="mini-label">TIER {pkg.tier} · SORT {pkg.sortOrder}</span>
                <h3>{pkg.name}</h3>
                <strong>${pkg.price.toLocaleString()}</strong>
                <p>{pkg.duration} · {pkg.maxGuests === null ? 'No guest cap' : `Up to ${pkg.maxGuests} guests`}</p>
                <small>{pkg.description}</small>
                <div className="content-record-card__actions">
                  {canEdit ? <>
                    <button className="button button--primary button--small" onClick={() => setPackageDraft({ ...pkg })}>Edit</button>
                    <button className="text-link manage-action-danger" disabled={busy} onClick={() => { void archivePackage(pkg) }}>Archive</button>
                  </> : <span className="status-pill">Read only</span>}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === 'spaces' && (
        <section className="panel content-list-panel">
          <div className="panel__heading">
            <div><p className="eyebrow">SPACES</p><h2>Venue planning spaces</h2><p>Spaces appear in ceremony/reception choices and the 2D Designer.</p></div>
            {canEdit && <button className="button button--primary button--small" onClick={() => setSpaceDraft(blankSpace())}>+ Add space</button>}
          </div>

          <div className="content-record-grid">
            {snapshot.spaces.map((space) => (
              <article className="content-record-card" key={space.id}>
                <span className="mini-label">{space.kind.toUpperCase()} · SORT {space.sortOrder}</span>
                <h3>{space.name}</h3>
                <p>{space.description}</p>
                <small>{space.plannerEnabled ? '2D Designer enabled' : '2D Designer disabled'} · {space.isPublic ? 'Public' : 'Private'}</small>
                <div className="content-record-card__actions">
                  {canEdit ? <>
                    <button className="button button--primary button--small" onClick={() => setSpaceDraft({ ...space })}>Edit</button>
                    <button className="text-link manage-action-danger" disabled={busy} onClick={() => { void archiveSpace(space) }}>Archive</button>
                  </> : <span className="status-pill">Read only</span>}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {packageDraft && canEdit && (
        <div className="content-editor-backdrop" role="presentation" onMouseDown={() => !busy && setPackageDraft(null)}>
          <section className="content-editor-modal" role="dialog" aria-modal="true" aria-label="Package editor" onMouseDown={(event) => event.stopPropagation()}>
            <div className="content-editor-modal__heading"><div><span className="mini-label">PACKAGE</span><h2>{packageDraft.id ? 'Edit package' : 'Add package'}</h2></div><button onClick={() => setPackageDraft(null)}>×</button></div>
            <div className="form-grid two-col">
              <label><span>Name</span><input value={packageDraft.name} onChange={(event) => setPackageDraft({ ...packageDraft, name: event.target.value })} /></label>
              <label><span>Price</span><input type="number" min="0" value={packageDraft.price} onChange={(event) => setPackageDraft({ ...packageDraft, price: Number(event.target.value) || 0 })} /></label>
              <label><span>Duration</span><input value={packageDraft.duration} onChange={(event) => setPackageDraft({ ...packageDraft, duration: event.target.value })} /></label>
              <label><span>Max guests</span><input type="number" min="0" value={packageDraft.maxGuests ?? ''} onChange={(event) => setPackageDraft({ ...packageDraft, maxGuests: event.target.value ? Number(event.target.value) : null })} /></label>
              <label><span>Tier</span><select value={packageDraft.tier} onChange={(event) => setPackageDraft({ ...packageDraft, tier: Number(event.target.value) as 1 | 2 | 3 })}><option value={1}>1 · Core</option><option value={2}>2 · Premium</option><option value={3}>3 · Top tier</option></select></label>
              <label><span>Sort order</span><input type="number" value={packageDraft.sortOrder} onChange={(event) => setPackageDraft({ ...packageDraft, sortOrder: Number(event.target.value) || 0 })} /></label>
            </div>
            <label className="notes-field"><span>Description</span><textarea value={packageDraft.description} onChange={(event) => setPackageDraft({ ...packageDraft, description: event.target.value })} /></label>
            <label className="notes-field"><span>Highlights, one per line</span><textarea value={packageDraft.highlights.join('\n')} onChange={(event) => setPackageDraft({ ...packageDraft, highlights: event.target.value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean) })} /></label>
            <div className="content-editor-checks"><label><input type="checkbox" checked={packageDraft.isPublic} onChange={(event) => setPackageDraft({ ...packageDraft, isPublic: event.target.checked })} /><span>Visible publicly</span></label></div>
            <div className="content-editor-modal__actions"><button className="button button--ghost" onClick={() => setPackageDraft(null)} disabled={busy}>Cancel</button><button className="button button--primary" onClick={() => { void savePackage() }} disabled={busy || !packageDraft.name.trim()}>{busy ? 'Saving…' : 'Save package'}</button></div>
          </section>
        </div>
      )}

      {spaceDraft && canEdit && (
        <div className="content-editor-backdrop" role="presentation" onMouseDown={() => !busy && setSpaceDraft(null)}>
          <section className="content-editor-modal" role="dialog" aria-modal="true" aria-label="Space editor" onMouseDown={(event) => event.stopPropagation()}>
            <div className="content-editor-modal__heading"><div><span className="mini-label">VENUE SPACE</span><h2>{spaceDraft.id ? 'Edit space' : 'Add space'}</h2></div><button onClick={() => setSpaceDraft(null)}>×</button></div>
            <div className="form-grid two-col">
              <label><span>Name</span><input value={spaceDraft.name} onChange={(event) => setSpaceDraft({ ...spaceDraft, name: event.target.value })} /></label>
              <label><span>Kind</span><select value={spaceDraft.kind} onChange={(event) => setSpaceDraft({ ...spaceDraft, kind: event.target.value as ManagedSpaceInput['kind'] })}><option>Ceremony</option><option>Reception</option><option>Photos</option><option>Hospitality</option></select></label>
              <label><span>Visual key</span><input value={spaceDraft.visualKey} onChange={(event) => setSpaceDraft({ ...spaceDraft, visualKey: event.target.value })} placeholder="Optional" /></label>
              <label><span>Sort order</span><input type="number" value={spaceDraft.sortOrder} onChange={(event) => setSpaceDraft({ ...spaceDraft, sortOrder: Number(event.target.value) || 0 })} /></label>
            </div>
            <label className="notes-field"><span>Description</span><textarea value={spaceDraft.description} onChange={(event) => setSpaceDraft({ ...spaceDraft, description: event.target.value })} /></label>
            <div className="content-editor-checks">
              <label><input type="checkbox" checked={spaceDraft.plannerEnabled} onChange={(event) => setSpaceDraft({ ...spaceDraft, plannerEnabled: event.target.checked })} /><span>Enable in 2D Designer</span></label>
              <label><input type="checkbox" checked={spaceDraft.isPublic} onChange={(event) => setSpaceDraft({ ...spaceDraft, isPublic: event.target.checked })} /><span>Visible publicly</span></label>
            </div>
            <div className="content-editor-modal__actions"><button className="button button--ghost" onClick={() => setSpaceDraft(null)} disabled={busy}>Cancel</button><button className="button button--primary" onClick={() => { void saveSpace() }} disabled={busy || !spaceDraft.name.trim()}>{busy ? 'Saving…' : 'Save space'}</button></div>
          </section>
        </div>
      )}
    </main>
  )
}