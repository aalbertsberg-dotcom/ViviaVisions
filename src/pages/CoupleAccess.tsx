import type { CSSProperties } from 'react'
import { useState, type FormEvent } from 'react'
import { venueConfigById } from '../data'
import type { WeddingWorkspace } from '../types'

type CoupleAccessProps = {
  venueId: string
  wedding: WeddingWorkspace
  onSubmitCode: (code: string) => boolean
  onBackHome: () => void
}

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function CoupleAccess({ venueId, wedding, onSubmitCode, onBackHome }: CoupleAccessProps) {
  const venue = venueConfigById(venueId).profile
  const eventLabel = venue.eventLabel ?? 'event'
  const clientLabel = venue.clientLabel ?? 'client'
  const isChandelier = venue.id === 'venue-chandelier-oaks'
  const [code, setCode] = useState(wedding.accessCode)
  const [error, setError] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!onSubmitCode(code)) { setError(`That access code is not correct for this ${eventLabel}.`); return }
    setError('')
  }

  return (
    <main className="page-main shell couple-access-page">
      <section className="panel couple-access-card" aria-labelledby="couple-access-title" style={{ '--venue-primary': venue.brandPrimary, '--venue-accent': venue.brandAccent } as CSSProperties}>
        <div className="couple-access-mark" style={{ background: venue.brandPrimary, color: venue.brandAccent }} aria-hidden="true">{venue.logoText}</div>
        <p className="eyebrow">{venue.shortName.toUpperCase()} · PRIVATE {eventLabel.toUpperCase()} WORKSPACE</p>
        <h1 id="couple-access-title">{wedding.profile.couple}</h1>
        <p className="couple-access-date">{formatDate(wedding.profile.date)}</p>
        <p className="couple-access-lead">This {eventLabel} belongs to {venue.shortName}. The direct link and access code open only this venue and this {clientLabel}'s workspace.</p>

        <form className="owner-access-form" onSubmit={submit}>
          <label htmlFor="couple-preview-code">{eventLabel[0].toUpperCase() + eventLabel.slice(1)} access code</label>
          <input id="couple-preview-code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(event) => { setCode(event.target.value); setError('') }} />
          <small>{isChandelier ? 'Current build access code' : 'Prefilled for this preview'}: <strong>{wedding.accessCode}</strong></small>
          {error && <div className="owner-access-error" role="alert">{error}</div>}
          <button className="button button--primary full-width" type="submit">Enter {venue.shortName} {eventLabel}</button>
        </form>

        <div className="owner-access-note"><strong>{isChandelier ? 'Current build sign-in.' : 'Preview access.'}</strong> Production launch will use secure email sign-in or one-time codes and will not expose recoverable passwords.</div>
        <button className="text-link owner-access-back" type="button" onClick={onBackHome}>← Back to {venue.shortName}</button>
      </section>
    </main>
  )
}
