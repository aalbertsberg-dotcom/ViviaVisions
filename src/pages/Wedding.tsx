import type { CSSProperties } from 'react'
import { packageById, tierLabel, venueConfigById } from '../data'
import type { PageKey } from '../components/Header'
import type { Selection, WeddingProfile } from '../types'

function formatDate(value: string) { return new Date(`${value}T12:00:00`).toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric',year:'numeric'}) }

type WeddingProps = {
  venueId: string
  profile: WeddingProfile
  selections: Selection[]
  unreadMessages: number
  paymentStepsCompleted: number
  onProfileChange: (profile: WeddingProfile) => void
  onSetQuantity: (itemId: string, quantity: number) => void
  onNavigate: (page: PageKey) => void
  ownerMode: boolean
  clientAuthenticated: boolean
}

export default function Wedding({ venueId, profile, selections, unreadMessages, paymentStepsCompleted, onProfileChange, onNavigate, ownerMode, clientAuthenticated }: WeddingProps) {
  const config=venueConfigById(venueId); const venue=config.profile; const pkg=packageById(profile.packageId,venueId)
  const eventLabel=venue.eventLabel ?? 'event'; const clientLabel=venue.clientLabel ?? 'client'; const isWedding=eventLabel==='wedding'; const isChandelier=venue.id==='venue-chandelier-oaks'
  const selectedPieces=selections.reduce((sum,item)=>sum+item.quantity,0)
  const ceremonyAreas=config.areas.filter((area)=>area.kind==='Ceremony')
  const receptionAreas=config.areas.filter((area)=>area.kind==='Reception'||area.kind==='Hospitality')
  const allPlannerAreas=config.areas.filter((area)=>area.plannerEnabled)
  const progressItems=[profile.contractSigned,profile.reservationPaid,Boolean(profile.receptionArea),selectedPieces>0]
  if(isWedding) progressItems.splice(2,0,Boolean(profile.ceremonyArea))
  const progress=Math.round(progressItems.filter(Boolean).length/progressItems.length*100)
  const patch=(key:keyof WeddingProfile,value:string|number|boolean)=>onProfileChange({...profile,[key]:value})
  const inventoryTitle=venue.inventoryLabel ?? 'Inventory Collection'
  const itemWord=isWedding?'décor pieces':'resources'

  return <main className="page-main shell wedding-page venue-wedding-page">
    <section className="wedding-dashboard-hero" style={{ '--venue-primary': venue.brandPrimary, '--venue-accent': venue.brandAccent } as CSSProperties}>
      <div><p className="eyebrow">{ownerMode?`ACTIVE ${eventLabel.toUpperCase()} · OWNER MODE`:`${venue.shortName.toUpperCase()} · PRIVATE ${eventLabel.toUpperCase()} PORTAL`}</p><h1>{profile.couple}</h1><p className="wedding-date-large">{formatDate(profile.date)}</p><div className="wedding-package-badge"><span>PACKAGE</span><strong>{pkg.name}</strong><small>${pkg.price.toLocaleString()} · {pkg.duration} · {pkg.maxGuests===null?'guest cap to confirm':`up to ${pkg.maxGuests} guests`}</small></div></div>
      <div className="planning-progress-card"><span>PLANNING PROGRESS</span><strong>{progress}%</strong><div><i style={{width:`${progress}%`,background:venue.brandAccent}} /></div><small>{selectedPieces} {itemWord} selected · {unreadMessages} unread messages</small></div>
    </section>

    <section className="wedding-action-grid">
      <button onClick={()=>onNavigate('catalog')}><span>{inventoryTitle.toUpperCase()}</span><strong>{selectedPieces} selected</strong><small>Browse resources available for this package tier.</small><b>→</b></button>
      <button onClick={()=>onNavigate('planner')}><span>2D VENUE DESIGNER</span><strong>Build your layout</strong><small>{config.areas.map((a)=>a.name).slice(0,4).join(', ')}. AI visual preview is coming soon.</small><b>→</b></button>
      <button onClick={()=>onNavigate('media')}><span>MEDIA &amp; INSPIRATION</span><strong>Photos, videos and planning files</strong><small>Keep venue references and {eventLabel} inspiration in one place.</small><b>→</b></button>
      <button onClick={()=>onNavigate('messages')}><span>MESSAGES</span><strong>{unreadMessages?`${unreadMessages} unread`:'Conversation up to date'}</strong><small>Questions, files and linked resources stay with this {eventLabel}.</small><b>→</b></button>
    </section>

    {clientAuthenticated && !ownerMode && (
      <section className="workspace-guidance-banner">
        <div>
          <span className="mini-label">YOUR PLANNING ACCESS</span>
          <strong>You control the planning details. The venue controls the booking record.</strong>
        </div>
        <p>You can update guest count, ceremony/reception spaces, notes, décor selections, layouts, media and messages. {venue.shortName} controls the booked name, date, package, contact emails, contract and payment status.</p>
      </section>
    )}

    {ownerMode && !venue.isSample && (
      <section className="workspace-guidance-banner workspace-guidance-banner--owner">
        <div>
          <span className="mini-label">VENUE CONTROL</span>
          <strong>Booking identity and client access stay with the venue team.</strong>
        </div>
        <p>Changes to the event name, date, package and client emails update the venue record. Client-managed planning changes sync back into this workspace.</p>
      </section>
    )}

    <div className="wedding-content-grid">
      <section className="panel wedding-details-panel"><div className="panel__heading"><div><p className="eyebrow">{eventLabel.toUpperCase()} DETAILS</p><h2>Plan the {isWedding?'day':'event'}</h2><p>{isChandelier && ownerMode ? 'Owner changes save automatically to the venue database.' : isChandelier && clientAuthenticated ? 'Client-managed planning details save securely to this private workspace.' : isChandelier ? 'Demo changes remain in this browser.' : 'Changes save automatically in this browser preview.'}</p></div></div><div className="form-grid two-col wedding-detail-fields">
        <label><span>{isWedding?'Couple':'Event / client name'} (venue controlled)</span><input value={profile.couple} onChange={(e)=>ownerMode&&patch('couple',e.target.value)} disabled={!ownerMode} /></label>
        <label><span>{eventLabel[0].toUpperCase()+eventLabel.slice(1)} date (venue controlled)</span><input type="date" value={profile.date} onChange={(e)=>ownerMode&&patch('date',e.target.value)} disabled={!ownerMode} /></label>
        <label><span>Guest count</span><input type="number" min="1" max="500" value={profile.guests} onChange={(e)=>patch('guests',Number(e.target.value)||1)} /></label>
        <label><span>Package {ownerMode?'':'(venue controlled)'}</span><select value={profile.packageId} onChange={(e)=>ownerMode&&patch('packageId',e.target.value)} disabled={!ownerMode}>{config.packages.map((item)=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label><span>Primary contact email (venue controlled)</span><input type="email" value={profile.primaryEmail} onChange={(e)=>ownerMode&&patch('primaryEmail',e.target.value)} disabled={!ownerMode} /></label>
        <label><span>{isWedding?'Partner email':'Secondary contact email'} (venue controlled)</span><input type="email" value={profile.partnerEmail} onChange={(e)=>ownerMode&&patch('partnerEmail',e.target.value)} disabled={!ownerMode} /></label>
        {isWedding ? <><label><span>Ceremony area</span><select value={profile.ceremonyArea} onChange={(e)=>patch('ceremonyArea',e.target.value)}><option value="">Choose an area</option>{ceremonyAreas.map((area)=><option key={area.id} value={area.id}>{area.name}</option>)}</select></label><label><span>Reception / gathering area</span><select value={profile.receptionArea} onChange={(e)=>patch('receptionArea',e.target.value)}><option value="">Choose an area</option>{receptionAreas.map((area)=><option key={area.id} value={area.id}>{area.name}</option>)}</select></label></> : <><label><span>Arrival / pre-function space</span><select value={profile.ceremonyArea} onChange={(e)=>patch('ceremonyArea',e.target.value)}><option value="">Choose a space</option>{allPlannerAreas.map((area)=><option key={area.id} value={area.id}>{area.name}</option>)}</select></label><label><span>Primary event space</span><select value={profile.receptionArea} onChange={(e)=>patch('receptionArea',e.target.value)}><option value="">Choose a space</option>{allPlannerAreas.map((area)=><option key={area.id} value={area.id}>{area.name}</option>)}</select></label></>}
      </div><label className="notes-field"><span>Notes for {venue.shortName}</span><textarea value={profile.notes} onChange={(e)=>patch('notes',e.target.value)} placeholder="Placement requests, questions, must-haves, vendor notes…" /></label></section>

      <aside className="wedding-side-stack">
        <section className="panel package-entitlement-card"><p className="eyebrow">YOUR PACKAGE</p><h2>{pkg.name}</h2><strong className="package-price">${pkg.price.toLocaleString()}</strong><p>{pkg.description}</p><div className="tier-access"><span>RESOURCE ACCESS</span><strong>{tierLabel[pkg.tier]}</strong><small>{venue.isSample?'Demo package rules are illustrative.':'Package access is configured by the venue.'}</small></div><ul>{pkg.highlights.map((item)=><li key={item}>{item}</li>)}</ul></section>
        <section className="panel wedding-readiness-card"><p className="eyebrow">BOOKING READINESS</p><h2>Milestones</h2><div className="readiness-list"><label><input type="checkbox" checked={profile.contractSigned} onChange={(e)=>ownerMode&&patch('contractSigned',e.target.checked)} disabled={!ownerMode}/><span><strong>Contract signed</strong><small>Owner managed</small></span></label><label><input type="checkbox" checked={profile.reservationPaid} onChange={(e)=>ownerMode&&patch('reservationPaid',e.target.checked)} disabled={!ownerMode}/><span><strong>Reservation payment</strong><small>Owner managed</small></span></label>{isWedding&&<label className={profile.ceremonyArea?'done':''}><i>{profile.ceremonyArea?'✓':'○'}</i><span><strong>Ceremony area selected</strong><small>{profile.ceremonyArea||'Not chosen'}</small></span></label>}<label className={profile.receptionArea?'done':''}><i>{profile.receptionArea?'✓':'○'}</i><span><strong>{isWedding?'Reception area':'Primary space'} selected</strong><small>{profile.receptionArea||'Not chosen'}</small></span></label><label className={selectedPieces?'done':''}><i>{selectedPieces?'✓':'○'}</i><span><strong>Resource selection started</strong><small>{selectedPieces} selected</small></span></label><label className={paymentStepsCompleted>=4?'done':''}><i>{paymentStepsCompleted>=4?'✓':'○'}</i><span><strong>Payment milestones</strong><small>{paymentStepsCompleted}/4 marked complete</small></span></label></div></section>
      </aside>
    </div>

    <section className="planning-workflow panel">
      <div className="planning-workflow__heading">
        <div><span className="mini-label">PLANNING WORKFLOW</span><h2>Keep moving without guessing what comes next.</h2></div>
      </div>
      <div className="planning-workflow__steps">
        <button className={selectedPieces ? 'done' : 'active'} onClick={()=>onNavigate('catalog')}><b>1</b><span><strong>Select inventory</strong><small>{selectedPieces ? `${selectedPieces} pieces selected` : 'Choose décor and venue resources'}</small></span></button>
        <button className={selectedPieces ? 'active' : ''} onClick={()=>onNavigate('planner')}><b>2</b><span><strong>Build your layout</strong><small>Place tables, chairs and selected resources</small></span></button>
        <button onClick={()=>onNavigate('ai-preview')}><b>3</b><span><strong>AI visual preview</strong><small>Coming soon · your 2D plan stays the source of truth</small></span></button>
        <button onClick={()=>onNavigate('summary')}><b>4</b><span><strong>Setup summary</strong><small>Prepare the final venue handoff</small></span></button>
      </div>
      <div className="planning-workflow__next">
        <div><strong>{selectedPieces ? 'Your inventory is selected.' : 'Start with the inventory.'}</strong><span>{selectedPieces ? 'The next planning step is arranging those choices in the 2D Designer.' : 'Choose the pieces you want before building the layout.'}</span></div>
        <button className="button button--primary" onClick={()=>onNavigate(selectedPieces ? 'planner' : 'catalog')}>{selectedPieces ? 'Next: Build your layout' : 'Start selecting inventory'}</button>
      </div>
    </section>
  </main>
}
