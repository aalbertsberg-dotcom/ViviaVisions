import type { CSSProperties } from 'react'
import { useEffect, useMemo, useState } from 'react'
import Logo from './Logo'
import type { VenueProfile, WeddingWorkspace } from '../types'
import { PLATFORM_NAME, PLATFORM_NAME_UPPER, PLATFORM_SHORT_NAME, POWERED_BY_PLATFORM } from '../config/platform'

export type PageKey = 'home' | 'venues' | 'for-venues' | 'signin' | 'venue' | 'catalog' | 'wedding' | 'planner' | 'media' | 'ai-preview' | 'messages' | 'calendar' | 'summary' | 'admin' | 'manage-events' | 'inventory-admin' | 'venue-content' | 'platform' | 'platform-inventory' | 'production-check' | 'access-check' | 'terms' | 'privacy' | 'customer-agreement'

type HeaderProps = {
  page: PageKey
  onNavigate: (page: PageKey) => void
  selectionCount: number
  unreadMessages: number
  activeWeddingName: string
  weddings: WeddingWorkspace[]
  activeWeddingId: string
  activeVenue: VenueProfile
  ownerAuthenticated: boolean
  coupleAuthenticated: boolean
  platformAuthenticated: boolean
  onSelectWedding: (id: string) => void
  onOwnerLogout: () => void
  onCoupleLogout: () => void
  onPlatformLogout: () => void
  onResetPreview: () => void | Promise<void>
}

type NavItem = { key: PageKey; label: string; description?: string }

function VenueBrand({ venue, onClick, onPoweredClick, subtitle }: { venue: VenueProfile; onClick: () => void; onPoweredClick: () => void; subtitle: string }) {
  const poweredText = POWERED_BY_PLATFORM
  const hasPoweredLink = subtitle.includes(poweredText)
  const subtitlePrefix = hasPoweredLink ? subtitle.replace(poweredText, '').replace(/\s*·\s*$/, '').trim() : subtitle

  return (
    <button className="tenant-brand" type="button" onClick={onClick} aria-label={`${venue.shortName} home`}>
      <span className="tenant-brand__mark" style={{ background: venue.brandPrimary, color: venue.brandAccent }}>{venue.logoText}</span>
      <span className="tenant-brand__words">
        <strong style={{ color: venue.brandText ?? venue.brandPrimary }}>{venue.shortName}</strong>
        <small>
          {subtitlePrefix}{subtitlePrefix && hasPoweredLink ? ' · ' : ''}
          {hasPoweredLink && <span className="tenant-brand__powered-link" role="link" tabIndex={0} onClick={(event) => { event.stopPropagation(); onPoweredClick() }} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); onPoweredClick() } }}>{poweredText}</span>}
        </small>
      </span>
    </button>
  )
}

export default function Header({
  page, onNavigate, selectionCount, unreadMessages, activeWeddingName, weddings, activeWeddingId, activeVenue,
  ownerAuthenticated, coupleAuthenticated, platformAuthenticated, onSelectWedding, onOwnerLogout, onCoupleLogout,
  onPlatformLogout, onResetPreview,
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  useEffect(() => { setMenuOpen(false); setProfileOpen(false) }, [page, activeVenue.id])

  const sortedWeddings = useMemo(() => [...weddings].sort((a, b) => a.profile.date.localeCompare(b.profile.date)), [weddings])
  const mode = ownerAuthenticated ? 'owner' : coupleAuthenticated ? 'couple' : platformAuthenticated ? 'platform' : 'public'
  const isVenuePublicPage = mode === 'public' && page === 'venue'

  const eventLabel = activeVenue.eventLabel ?? 'event'
  const eventPlural = activeVenue.eventPluralLabel ?? 'events'
  const clientLabel = activeVenue.clientLabel ?? 'client'
  const resourceLabel = eventLabel === 'wedding' ? 'Décor' : 'Resources'

  const publicNav: NavItem[] = isVenuePublicPage ? [
    { key: 'venue', label: 'Venue Home' },
    { key: 'home', label: PLATFORM_NAME },
    { key: 'signin', label: 'Sign In' },
  ] : [
    { key: 'home', label: 'Home' },
    { key: 'venues', label: 'Venues' },
    { key: 'for-venues', label: 'For Venues' },
    { key: 'signin', label: 'Sign In' },
  ]
  const ownerNav: NavItem[] = [
    { key: 'admin', label: 'Dashboard', description: `${eventPlural[0].toUpperCase() + eventPlural.slice(1)}, inventory and operations` },
    { key: 'calendar', label: 'Calendar' },
    { key: 'inventory-admin', label: 'Inventory' },
    { key: 'messages', label: 'Messages' },
  ]
  const ownerMore: NavItem[] = [
    { key: 'manage-events', label: 'Manage Events', description: 'Cancel, restore or delete workspaces safely' },
    { key: 'venue-content', label: 'Venue Setup', description: 'Profile, packages and planning spaces' },
    { key: 'catalog', label: 'Client Catalog', description: 'Preview the client-facing inventory catalog' },
    { key: 'wedding', label: `Active ${eventLabel}`, description: 'Details, package and planning checklist' },
    { key: 'planner', label: '2D Designer', description: 'Build the source-of-truth layout first' },
    { key: 'media', label: 'Media Library', description: 'Venue photos, video, files and AI references' },
    { key: 'summary', label: 'Setup Sheet', description: `Final pull list and ${eventLabel} handoff` },
    { key: 'venue', label: `${activeVenue.shortName} home`, description: 'Return to the venue landing page' },
  ]
  const coupleNav: NavItem[] = [
    { key: 'wedding', label: 'Home', description: `${clientLabel[0].toUpperCase() + clientLabel.slice(1)} ${eventLabel} workspace` },
    { key: 'catalog', label: resourceLabel },
    { key: 'planner', label: 'Design' },
    { key: 'messages', label: 'Messages' },
  ]
  const coupleMore: NavItem[] = [
    { key: 'media', label: 'Media & Inspiration', description: 'Photos, videos and planning files' },
    { key: 'summary', label: 'Setup Summary', description: 'Review the venue handoff' },
    { key: 'venue', label: `${activeVenue.shortName} home`, description: 'Return to your venue page' },
  ]
  const platformNav: NavItem[] = [
    { key: 'platform', label: 'Admin' },
    { key: 'platform-inventory', label: 'Inventory' },
    { key: 'production-check', label: 'Production Check' },
    { key: 'venues', label: 'Venue Accounts' },
    { key: 'for-venues', label: 'Requests' },
  ]

  const hrefFor = (next: PageKey) => {
    if (next === 'home') return '#/'
    if (next === 'venues' || next === 'for-venues' || next === 'signin' || next === 'platform' || next === 'platform-inventory' || next === 'production-check' || next === 'access-check') return `#/${next}`
    if (next === 'venue') return `#/venue/${activeVenue.slug}`
    if (next === 'admin') return `#/venue/${activeVenue.slug}/owner`
    return `#/venue/${activeVenue.slug}/${next}`
  }

  const go = (next: PageKey) => { setMenuOpen(false); setProfileOpen(false); onNavigate(next) }
  const desktopItems = mode === 'owner' ? ownerNav : mode === 'couple' ? coupleNav : mode === 'platform' ? platformNav : publicNav
  const drawerItems = mode === 'owner' ? [...ownerNav, ...ownerMore] : mode === 'couple' ? [...coupleNav, ...coupleMore] : mode === 'platform' ? platformNav : publicNav

  return (
    <>
      <header className={`site-header app-header app-header--${mode}${isVenuePublicPage ? ' app-header--venue-public' : ''}`} style={{ '--venue-primary': activeVenue.brandPrimary, '--venue-accent': activeVenue.brandAccent } as CSSProperties}>
        <div className="app-header__brand">
          {mode === 'public' && !isVenuePublicPage && <button className="brand-button" onClick={() => go('home')} aria-label={`${PLATFORM_NAME} home`}><Logo /></button>}
          {isVenuePublicPage && <VenueBrand venue={activeVenue} onClick={() => go('venue')} onPoweredClick={() => go('home')} subtitle={POWERED_BY_PLATFORM} />}
          {mode === 'platform' && <button className="platform-brand" type="button" onClick={() => go('platform')}><Logo compact /><span><strong>{PLATFORM_NAME} Admin</strong><small>Platform Operations</small></span></button>}
          {mode === 'owner' && <VenueBrand venue={activeVenue} onClick={() => go('admin')} onPoweredClick={() => go('home')} subtitle={`Owner Portal · ${POWERED_BY_PLATFORM}`} />}
          {mode === 'couple' && <VenueBrand venue={activeVenue} onClick={() => go('wedding')} onPoweredClick={() => go('home')} subtitle={`${eventLabel[0].toUpperCase() + eventLabel.slice(1)} Portal · ${POWERED_BY_PLATFORM}`} />}
        </div>

        <nav className="app-header__desktop-nav" aria-label="Primary navigation">
          {desktopItems.map((item) => <a key={item.key} href={hrefFor(item.key)} className={page === item.key ? 'app-nav-link active' : 'app-nav-link'} onClick={(event) => { event.preventDefault(); go(item.key) }}>{item.label}{item.key === 'messages' && unreadMessages > 0 && <span className="app-nav-badge">{unreadMessages}</span>}</a>)}
        </nav>

        <div className="app-header__actions">
          {mode === 'owner' && <label className="owner-wedding-switcher" title={`Switch the active ${eventLabel} across all owner tools`}><span>Active {eventLabel}</span><select value={activeWeddingId} onChange={(event) => onSelectWedding(event.target.value)}>{sortedWeddings.map((wedding) => <option value={wedding.id} key={wedding.id}>{wedding.profile.couple} · {wedding.profile.date}</option>)}</select></label>}

          {mode === 'couple' && <div className="profile-menu-wrap"><button className="couple-profile-button" type="button" aria-expanded={profileOpen} onClick={() => setProfileOpen((current) => !current)}><span>{activeWeddingName}</span><b aria-hidden="true">⌄</b></button>{profileOpen && <div className="couple-profile-popover"><span className="mini-label">{activeVenue.shortName.toUpperCase()}</span><strong>{activeWeddingName}</strong><button onClick={() => go('wedding')}>{eventLabel[0].toUpperCase() + eventLabel.slice(1)} home</button><button onClick={() => go('media')}>Media & inspiration</button><button onClick={() => go('summary')}>Setup summary</button><button onClick={() => go('venue')}>{activeVenue.shortName} home</button><button onClick={() => { setProfileOpen(false); onCoupleLogout() }}>Sign out</button></div>}</div>}

          {mode === 'public' && <button className="button button--primary header-demo-cta" onClick={() => go(isVenuePublicPage ? 'signin' : 'venues')}>{isVenuePublicPage ? 'Portal Sign In' : 'Explore Venues'}</button>}
          {mode === 'platform' && <button className="button button--ghost button--small" onClick={onPlatformLogout}>Sign out</button>}

          {(mode === 'owner' || mode === 'platform' || mode === 'public') && <button className="compact-menu-button" type="button" aria-expanded={menuOpen} onClick={() => setMenuOpen((current) => !current)}><span className="compact-menu-button__bars" aria-hidden="true"><i /><i /><i /></span><span>Menu</span>{mode === 'owner' && unreadMessages > 0 && <b>{unreadMessages}</b>}</button>}
        </div>
      </header>

      {menuOpen && <button className="nav-menu-backdrop" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}
      <aside className={menuOpen ? 'clean-drawer clean-drawer--open' : 'clean-drawer'} aria-label="Application menu">
        <div className="clean-drawer__heading"><div><span className="mini-label">{mode === 'owner' || mode === 'couple' ? activeVenue.shortName.toUpperCase() : PLATFORM_NAME_UPPER}</span><strong>{mode === 'owner' ? 'Owner Portal' : mode === 'couple' ? activeWeddingName : mode === 'platform' ? 'Platform Admin' : PLATFORM_NAME}</strong></div><button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu">×</button></div>

        {mode === 'owner' && <div className="clean-drawer__switcher"><label htmlFor="drawer-active-wedding">Active {eventLabel}</label><select id="drawer-active-wedding" value={activeWeddingId} onChange={(event) => onSelectWedding(event.target.value)}>{sortedWeddings.map((wedding) => <option value={wedding.id} key={wedding.id}>{wedding.profile.couple} · {wedding.profile.date}</option>)}</select><small>All {eventLabel}-specific tools follow this selection inside {activeVenue.shortName}.</small></div>}

        <div className="clean-drawer__links">{drawerItems.map((item) => <a key={`${item.key}-${item.label}`} href={hrefFor(item.key)} className={page === item.key ? 'clean-drawer__link active' : 'clean-drawer__link'} onClick={(event) => { event.preventDefault(); go(item.key) }}><span><strong>{item.label}</strong>{item.description && <small>{item.description}</small>}</span><span className="clean-drawer__meta">{item.key === 'wedding' && selectionCount > 0 && <b>{selectionCount}</b>}{item.key === 'messages' && unreadMessages > 0 && <b>{unreadMessages}</b>}<i aria-hidden="true">›</i></span></a>)}</div>

        <div className="clean-drawer__footer">
          <details className="clean-account-menu">
            <summary>
              <span>{platformAuthenticated || ownerAuthenticated ? 'Account' : 'Sign in'}</span>
              <span aria-hidden="true">⌄</span>
            </summary>

            <div className="clean-account-menu__items">
              <button onClick={() => go('platform')}>VV Admin</button>
              <button onClick={() => go('admin')}>{ownerAuthenticated ? `${activeVenue.shortName} Admin` : 'Venue Sign In'}</button>
              {(platformAuthenticated || ownerAuthenticated) && (
                <button
                  className="clean-account-menu__signout"
                  onClick={() => {
                    setMenuOpen(false)
                    if (platformAuthenticated) void onPlatformLogout()
                    else void onOwnerLogout()
                  }}
                >
                  Sign out
                </button>
              )}
            </div>
          </details>

          {(mode === 'owner' || mode === 'platform') && <button className="clean-drawer__reset" onClick={() => { setMenuOpen(false); onResetPreview() }}>{mode === 'owner' && !activeVenue.isSample ? 'Reset active workspace' : 'Reset demo data'}</button>}
        </div>
      </aside>

      {mode === 'couple' && <nav className="couple-bottom-nav" aria-label={`${eventLabel} navigation`}><button className={page === 'wedding' ? 'active' : ''} onClick={() => go('wedding')}><span>⌂</span><small>Home</small></button><button className={page === 'catalog' ? 'active' : ''} onClick={() => go('catalog')}><span>✿</span><small>{resourceLabel}</small></button><button className={page === 'planner' ? 'active' : ''} onClick={() => go('planner')}><span>▦</span><small>Design</small></button><button className={page === 'messages' ? 'active' : ''} onClick={() => go('messages')}><span>◌</span><small>Messages</small></button><button onClick={() => setProfileOpen((current) => !current)}><span>☰</span><small>More</small></button></nav>}
    </>
  )
}
