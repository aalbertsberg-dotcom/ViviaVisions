import { useMemo, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { VenueLead } from '../types'
import { PLATFORM_NAME, PLATFORM_NAME_UPPER, POWERED_BY_PLATFORM } from '../config/platform'

type ForVenuesProps = {
  leads: VenueLead[]
  setLeads: Dispatch<SetStateAction<VenueLead[]>>
  onBackHome: () => void
  onViewVenueDemo: () => void
}

const needOptions = ['Digital inventory catalog', 'Client portals', 'Venue designer', 'Messaging', 'Calendar & milestones', 'Setup / pull sheets', 'Package-aware access']

export default function ForVenues({ leads, setLeads, onBackHome, onViewVenueDemo }: ForVenuesProps) {
  const logoInput = useRef<HTMLInputElement>(null)
  const [submittedId, setSubmittedId] = useState<string | null>(null)
  const [form, setForm] = useState({
    venueName: '', website: '', contactName: '', email: '', phone: '', address: '', eventSpaces: 3,
    weddingsPerMonth: 6, inventorySize: '100–250 items', packages: '3–5 packages', notes: '', brandPrimary: '#34483b', brandAccent: '#b58a55', logoDataUrl: '',
  })
  const [needs, setNeeds] = useState<string[]>(['Digital inventory catalog', 'Client portals', 'Venue designer'])
  const [legalAccepted, setLegalAccepted] = useState(false)

  const initials = useMemo(() => form.venueName.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]?.toUpperCase()).join('') || 'VV', [form.venueName])
  const submitted = leads.find((lead) => lead.id === submittedId)

  const change = (key: keyof typeof form, value: string | number) => setForm((current) => ({ ...current, [key]: value }))

  const handleLogo = (file: File | undefined) => {
    if (!file) return
    if (file.size > 800_000) {
      window.alert('For this browser preview, keep the logo under 800 KB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => typeof reader.result === 'string' && change('logoDataUrl', reader.result)
    reader.readAsDataURL(file)
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!form.venueName.trim() || !form.contactName.trim() || !form.email.trim()) {
      window.alert('Venue name, contact name and email are required.')
      return
    }
    if (!legalAccepted) {
      window.alert('Please agree to the Terms of Service and acknowledge the Privacy Policy before submitting.')
      return
    }
    const lead: VenueLead = {
      id: `lead-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      submittedAt: new Date().toISOString(),
      venueName: form.venueName.trim(), website: form.website.trim(), contactName: form.contactName.trim(), email: form.email.trim(), phone: form.phone.trim(), address: form.address.trim(),
      eventSpaces: Number(form.eventSpaces) || 1, weddingsPerMonth: Number(form.weddingsPerMonth) || 1, inventorySize: form.inventorySize, packages: form.packages,
      needs, notes: form.notes.trim(), brandPrimary: form.brandPrimary, brandAccent: form.brandAccent, logoDataUrl: form.logoDataUrl || undefined,
    }
    setLeads((current) => [lead, ...current])
    setSubmittedId(lead.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (submitted) {
    return (
      <main className="page-main shell venue-signup-success">
        <section className="panel success-card">
          <div className="success-check">✓</div>
          <p className="eyebrow">VENUE PREVIEW REQUEST</p>
          <h1>Your {submitted.venueName} venue preview request is saved.</h1>
          <p>This public demonstration does not send the form externally. The request is stored only in this browser so the intake experience can be reviewed safely.</p>
          <div className="signup-summary-grid">
            <article><span>Contact</span><strong>{submitted.contactName}</strong><small>{submitted.email}</small></article>
            <article><span>Event spaces</span><strong>{submitted.eventSpaces}</strong><small>{submitted.weddingsPerMonth} events/month</small></article>
            <article><span>Inventory</span><strong>{submitted.inventorySize}</strong><small>{submitted.packages}</small></article>
          </div>
          <div className="hero__actions"><button className="button button--primary" onClick={onViewVenueDemo}>Explore Venues</button><button className="button button--ghost" onClick={onBackHome}>Back to {PLATFORM_NAME}</button><button className="text-link" onClick={() => setSubmittedId(null)}>Start another request</button></div>
        </section>
      </main>
    )
  }

  return (
    <main className="page-main shell for-venues-page">
      <section className="page-intro page-intro--split venue-onboarding-intro">
        <div><p className="eyebrow">{PLATFORM_NAME_UPPER} · FOR VENUES</p><h1>See what {PLATFORM_NAME} could look like for your venue.</h1><p>Tell us about the property, brand, inventory and workflow. The form builds a live preview and shows the information {PLATFORM_NAME} would use to configure a venue-branded experience.</p></div>
        <div className="onboarding-steps"><span><b>1</b>Venue details</span><span><b>2</b>Brand + inventory</span><span><b>3</b>Configure portal</span><span><b>4</b>Invite clients</span></div>
      </section>

      <div className="venue-onboarding-layout">
        <form className="panel venue-onboarding-form" onSubmit={submit}>
          <section><p className="mini-label">VENUE PROFILE</p><h2>Business details</h2>
            <div className="form-grid two-col">
              <label><span>Venue name *</span><input value={form.venueName} onChange={(e) => change('venueName', e.target.value)} /></label>
              <label><span>Website</span><input value={form.website} onChange={(e) => change('website', e.target.value)} placeholder="https://yourvenue.com" /></label>
              <label><span>Primary contact *</span><input value={form.contactName} onChange={(e) => change('contactName', e.target.value)} placeholder="Owner / manager" /></label>
              <label><span>Email *</span><input type="email" value={form.email} onChange={(e) => change('email', e.target.value)} placeholder="owner@venue.com" /></label>
              <label><span>Phone</span><input value={form.phone} onChange={(e) => change('phone', e.target.value)} /></label>
              <label><span>Address</span><input value={form.address} onChange={(e) => change('address', e.target.value)} /></label>
            </div>
          </section>

          <section><p className="mini-label">BRANDING</p><h2>Make the portal look like the venue.</h2>
            <div className="brand-form-row">
              <button type="button" className="logo-upload" onClick={() => logoInput.current?.click()}>{form.logoDataUrl ? <img src={form.logoDataUrl} alt="Uploaded venue logo preview" /> : <><strong>{initials}</strong><span>Upload logo</span></>}</button>
              <input ref={logoInput} hidden type="file" accept="image/*" onChange={(e) => handleLogo(e.target.files?.[0])} />
              <label className="color-field"><span>Primary color</span><input type="color" value={form.brandPrimary} onChange={(e) => change('brandPrimary', e.target.value)} /><code>{form.brandPrimary}</code></label>
              <label className="color-field"><span>Accent color</span><input type="color" value={form.brandAccent} onChange={(e) => change('brandAccent', e.target.value)} /><code>{form.brandAccent}</code></label>
            </div>
          </section>

          <section><p className="mini-label">OPERATIONS</p><h2>How much needs to be organized?</h2>
            <div className="form-grid two-col">
              <label><span>Event / ceremony spaces</span><input type="number" min="1" value={form.eventSpaces} onChange={(e) => change('eventSpaces', Number(e.target.value))} /></label>
              <label><span>Typical events per month</span><input type="number" min="1" value={form.weddingsPerMonth} onChange={(e) => change('weddingsPerMonth', Number(e.target.value))} /></label>
              <label><span>Inventory / resources</span><select value={form.inventorySize} onChange={(e) => change('inventorySize', e.target.value)}><option>Under 50 items</option><option>50–100 items</option><option>100–250 items</option><option>250–500 items</option><option>500+ items</option></select></label>
              <label><span>Package structure</span><select value={form.packages} onChange={(e) => change('packages', e.target.value)}><option>1 package</option><option>2–3 packages</option><option>3–5 packages</option><option>6+ packages</option><option>Custom / quote based</option></select></label>
            </div>
          </section>

          <section><p className="mini-label">FEATURES</p><h2>What should the venue use?</h2>
            <div className="needs-grid">{needOptions.map((item) => <label key={item} className={needs.includes(item) ? 'need-chip need-chip--selected' : 'need-chip'}><input type="checkbox" checked={needs.includes(item)} onChange={() => setNeeds((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item])} /><span>{item}</span></label>)}</div>
            <label className="notes-field"><span>Anything unique about the workflow?</span><textarea value={form.notes} onChange={(e) => change('notes', e.target.value)} placeholder="Storage locations, booking process, packages, unusual venue areas, setup team, AV, catering rules, etc." /></label>
          </section>

          <div className="demo-submit-note"><strong>Preview environment:</strong> this form is not connected to a live intake system. Use sample information only; submissions stay in this browser.</div>
          <label className="legal-acceptance">
            <input type="checkbox" checked={legalAccepted} onChange={(event) => setLegalAccepted(event.target.checked)} />
            <span>I agree to the <a href="#/terms" onClick={(event) => event.stopPropagation()}>Terms of Service</a> and acknowledge the <a href="#/privacy" onClick={(event) => event.stopPropagation()}>Privacy Policy</a>. I understand this preview request does not create a paid subscription or Customer Agreement.</span>
          </label>
          <p className="legal-acceptance__paid">Paid onboarding will require an authorized representative to accept the <a href="#/customer-agreement">Venue & Planner Customer Agreement</a>.</p>
          <button className="button button--primary full-width" type="submit">Request Venue Preview</button>
        </form>

        <aside className="portal-preview-sticky">
          <div className="portal-preview" style={{ '--preview-primary': form.brandPrimary, '--preview-accent': form.brandAccent } as CSSProperties}>
            <div className="portal-preview__chrome"><span/><span/><span/></div>
            <div className="portal-preview__header">
              <div className="portal-preview__logo">{form.logoDataUrl ? <img src={form.logoDataUrl} alt="" /> : initials}</div>
              <div><strong>{form.venueName || 'Your Venue'}</strong><span>{POWERED_BY_PLATFORM}</span></div>
            </div>
            <div className="portal-preview__hero"><span>YOUR EVENT PORTAL</span><strong>Everything for your event, in one place.</strong><button type="button">Open my event</button></div>
            <div className="portal-preview__tiles"><i/><i/><i/></div>
          </div>
          <div className="panel onboarding-includes"><p className="mini-label">A {PLATFORM_NAME_UPPER} EXPERIENCE CAN INCLUDE</p><ul><li>Venue-branded customer portal</li><li>Owner/admin access</li><li>Separate client workspaces</li><li>Inventory and package rules</li><li>Venue design areas</li><li>Messaging and setup summaries</li></ul></div>
        </aside>
      </div>
    </main>
  )
}
