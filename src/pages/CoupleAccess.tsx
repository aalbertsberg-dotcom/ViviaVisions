import type { CSSProperties } from 'react'
import { useEffect, useState, type FormEvent } from 'react'
import { venueConfigById } from '../data'
import { sendPasswordReset, signOut as signOutSupabase, updatePassword } from '../lib/repositories/auth'
import { supabase } from '../lib/supabase'
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
  portalMode?: boolean
  demoWeddings?: Array<{ id: string; name: string; date: string }>
  onOpenDemo?: (id: string) => void
  onSubmitCode: (code: string) => boolean
  onSignIn: (email: string, password: string, accessSlug: string) => Promise<ClientAuthResult>
  onCreateAccount: (email: string, password: string, accessSlug: string) => Promise<ClientAuthResult>
  onBackHome: () => void
}

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
}

function hasRecoveryMarker() {
  return new URLSearchParams(window.location.search).get('clientRecovery') === '1'
}

function clearRecoveryMarker() {
  const url = new URL(window.location.href)
  url.searchParams.delete('clientRecovery')
  url.searchParams.delete('code')
  const query = url.searchParams.toString()
  window.history.replaceState({}, '', `${url.pathname}${query ? `?${query}` : ''}${url.hash}`)
}

export default function CoupleAccess({
  venueId,
  wedding,
  accessSlug,
  demoMode,
  portalMode = false,
  demoWeddings = [],
  onOpenDemo,
  onSubmitCode,
  onSignIn,
  onCreateAccount,
  onBackHome,
}: CoupleAccessProps) {
  const venue = venueConfigById(venueId).profile
  const eventLabel = venue.eventLabel ?? 'event'
  const clientLabel = venue.clientLabel ?? 'client'
  const accessSegment = clientLabel === 'couple' ? 'couple' : 'client'
  const [code, setCode] = useState(wedding?.accessCode ?? '')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [createMode, setCreateMode] = useState(false)
  const [showDemoEvents, setShowDemoEvents] = useState(false)
  const [recoveryMode, setRecoveryMode] = useState(hasRecoveryMarker)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    if (!supabase) return

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

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

  const requestPasswordReset = async () => {
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail) {
      setError('Enter your email address first.')
      return
    }

    setSubmitting(true)
    setError('')
    setStatus('')

    try {
      const redirect = new URL(window.location.href)
      redirect.search = ''
      redirect.searchParams.set('clientRecovery', '1')
      redirect.hash = portalMode
        ? `#/venue/${encodeURIComponent(venue.slug)}/${accessSegment}`
        : `#/venue/${encodeURIComponent(venue.slug)}/${accessSegment}/${encodeURIComponent(accessSlug)}`
      await sendPasswordReset(cleanEmail, redirect.toString())
      setStatus('If that email has an account, a password reset link has been sent. Check your inbox and spam folder.')
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : 'Unable to send the password reset email.')
    } finally {
      setSubmitting(false)
    }
  }

  const submitRecovery = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setStatus('')

    if (newPassword.length < 8) {
      setError('Use a password with at least 8 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('The new passwords do not match.')
      return
    }

    setSubmitting(true)

    try {
      await updatePassword(newPassword)
      await signOutSupabase()
      clearRecoveryMarker()
      setRecoveryMode(false)
      setCreateMode(false)
      setPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setStatus('Password updated. Sign in with your new password.')
    } catch (recoveryError) {
      setError(recoveryError instanceof Error ? recoveryError.message : 'Unable to update the password.')
    } finally {
      setSubmitting(false)
    }
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
            : recoveryMode
              ? 'Choose a new password for your private client account.'
              : portalMode
              ? `Sign in with your ${venue.shortName} client account. Your email determines which private ${eventLabel} workspace you can open.`
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
        ) : recoveryMode ? (
          <form className="owner-access-form client-recovery-form" onSubmit={submitRecovery}>
            <label htmlFor="client-new-password">New password</label>
            <input id="client-new-password" type="password" minLength={8} autoComplete="new-password" value={newPassword} onChange={(event) => { setNewPassword(event.target.value); setError('') }} required />

            <label htmlFor="client-confirm-password">Confirm new password</label>
            <input id="client-confirm-password" type="password" minLength={8} autoComplete="new-password" value={confirmPassword} onChange={(event) => { setConfirmPassword(event.target.value); setError('') }} required />

            {error && <div className="owner-access-error" role="alert">{error}</div>}
            {status && <div className="client-auth-status" role="status">{status}</div>}

            <button className="button button--primary full-width" type="submit" disabled={submitting}>
              {submitting ? 'Updating password…' : 'Update password'}
            </button>
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

              {!createMode && <button className="text-link client-forgot-password" type="button" onClick={() => { void requestPasswordReset() }} disabled={submitting}>Forgot password?</button>}

              <small>{createMode ? 'Use the same email address the venue has on the event. Email confirmation may be required.' : 'Only contacts linked to this event can open the workspace.'}</small>

              {error && <div className="owner-access-error" role="alert">{error}</div>}
              {status && <div className="client-auth-status" role="status">{status}</div>}

              <button className="button button--primary full-width" type="submit" disabled={submitting}>
                {submitting ? 'Please wait…' : createMode ? 'Create private account' : `Sign in to ${venue.shortName}`}
              </button>
            </form>

            {portalMode && demoWeddings.length > 0 && (
              <div className="demo-event-access">
                <button
                  className="button button--ghost full-width demo-event-access__toggle"
                  type="button"
                  onClick={() => setShowDemoEvents((current) => !current)}
                >
                  Demo Events
                  <span aria-hidden="true">{showDemoEvents ? '▲' : '▼'}</span>
                </button>

                {showDemoEvents && (
                  <div className="demo-event-access__list">
                    <small>Temporary showcase access. Choose one of the three demo weddings:</small>
                    {demoWeddings.map((demo) => (
                      <button
                        key={demo.id}
                        className="demo-event-access__item"
                        type="button"
                        onClick={() => onOpenDemo?.(demo.id)}
                      >
                        <span>{demo.name}</span>
                        <small>{formatDate(demo.date)}</small>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
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