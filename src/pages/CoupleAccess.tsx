import type { CSSProperties } from 'react'
import { useState, type FormEvent } from 'react'
import { venueConfigById } from '../data'
import type { WeddingWorkspace } from '../types'

type ClientAuthResult = {
  ok: boolean
  error?: string
  pending?: boolean
  message?: string
}

type CoupleAccessProps = {
  venueId: string
  wedding?: WeddingWorkspace
  accessSlug: string
  demoMode: boolean
  onSubmitCode: (code: string) => boolean
  onSignIn: (email: string, password: string, accessSlug: string) => Promise<ClientAuthResult>
  onCreateAccount: (email: string, password: string, accessSlug: string) => Promise<ClientAuthResult>
  onBackHome: () => void
}

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function CoupleAccess({
  venueId,
  wedding,
  accessSlug,
  demoMode,
  onSubmitCode,
  onSignIn,
  onCreateAccount,
  onBackHome,
}: CoupleAccessProps) {
  const venue = venueConfigById(venueId).profile
  const eventLabel = venue.eventLabel ?? 'event'
  const clientLabel = venue.clientLabel ?? 'client'
  const [code, setCode] = useState(wedding?.accessCode ?? '')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [createMode, setCreateMode] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')

  const submitDemo = (event: FormEvent) => {
    event.preventDefault()
    if (!onSubmitCode(code)) {
      setError(`That access code is not correct for this ${eventLabel}.`)
      return
    }
    setError('')
  }

  const submitReal = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setStatus('')

    const result = createMode
      ? await onCreateAccount(email.trim(), password, accessSlug)
      : await onSignIn(email.trim(), password, accessSlug)

    if (!result.ok) setError(result.error ?? 'Unable to continue.')
    else if (result.pending) setStatus(result.message ?? 'Check your email, then return here and sign in.')

    setSubmitting(false)
  }

  return (
    <main className="page-main shell couple-access-page">
      <section className="panel couple-access-card" aria-labelledby="couple-access-title" style={{ '--venue-primary': venue.brandPrimary, '--venue-accent': venue.brandAccent } as CSSProperties}>
        <div className="couple-access-mark" style={{ background: venue.brandPrimary, color: venue.brandAccent }} aria-hidden="true">{venue.logoText}</div>
        <p className="eyebrow">{venue.shortName.toUpperCase()} · PRIVATE {eventLabel.toUpperCase()} WORKSPACE</p>
        <h1 id="couple-access-title">{wedding?.profile.couple ?? `${venue.shortName} ${clientLabel} portal`}</h1>
        {wedding && <p className="couple-access-date">{formatDate(wedding.profile.date)}</p>}
        <p className="couple-access-lead">
          {demoMode
            ? `This ${eventLabel} is one of the ViviaVisions demonstration workspaces.`
            : `Sign in with an email address that ${venue.shortName} has on file for this ${eventLabel}. Each approved contact gets their own private access.`}
        </p>

        {demoMode ? (
          <form className="owner-access-form" onSubmit={submitDemo}>
            <label htmlFor="couple-preview-code">{eventLabel[0].toUpperCase() + eventLabel.slice(1)} access code</label>
            <input id="couple-preview-code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(event) => { setCode(event.target.value); setError('') }} />
            {wedding?.accessCode && <small>Demo code: <strong>{wedding.accessCode}</strong></small>}
            {error && <div className="owner-access-error" role="alert">{error}</div>}
            <button className="button button--primary full-width" type="submit">Enter demo workspace</button>
          </form>
        ) : (
          <>
            <div className="client-auth-switch" role="tablist" aria-label="Client authentication">
              <button type="button" className={!createMode ? 'active' : ''} onClick={() => { setCreateMode(false); setError(''); setStatus('') }}>Sign in</button>
              <button type="button" className={createMode ? 'active' : ''} onClick={() => { setCreateMode(true); setError(''); setStatus('') }}>Create account</button>
            </div>

            <form className="owner-access-form" onSubmit={submitReal}>
              <label htmlFor="client-email">Email</label>
              <input id="client-email" type="email" autoComplete="username" value={email} onChange={(event) => { setEmail(event.target.value); setError(''); setStatus('') }} required />

              <label htmlFor="client-password">Password</label>
              <input id="client-password" type="password" minLength={8} autoComplete={createMode ? 'new-password' : 'current-password'} value={password} onChange={(event) => { setPassword(event.target.value); setError(''); setStatus('') }} required />

              <small>{createMode ? 'Use the same email address the venue has on the event. Email confirmation may be required.' : 'Only contacts linked to this event can open the workspace.'}</small>

              {error && <div className="owner-access-error" role="alert">{error}</div>}
              {status && <div className="client-auth-status" role="status">{status}</div>}

              <button className="button button--primary full-width" type="submit" disabled={submitting}>
                {submitting ? 'Please wait…' : createMode ? 'Create private account' : `Sign in to ${venue.shortName}`}
              </button>
            </form>
          </>
        )}

        <div className="owner-access-note">
          <strong>{demoMode ? 'Demonstration access.' : 'Secure client access.'}</strong>{' '}
          {demoMode
            ? 'These three showcase workspaces keep their visible access codes for demonstrations.'
            : 'Your signed-in account is matched to the primary or partner email stored on this event. Other venue clients remain inaccessible.'}
        </div>
        <button className="text-link owner-access-back" type="button" onClick={onBackHome}>← Back to {venue.shortName}</button>
      </section>
    </main>
  )
}