import { useEffect, useState } from 'react'
import { getEventClientAccessStatus, sendPasswordReset, setEventClientAccess, type ClientAccessStatus } from '../lib/repositories/auth'

type ClientAccessManagerProps = {
  eventId: string
  primaryEmail: string
  partnerEmail: string
  portalUrl: string
}

function statusText(contact: ClientAccessStatus) {
  if (contact.revoked) return 'Revoked'
  if (contact.accessGranted) return 'Active'
  if (contact.accountExists && !contact.emailConfirmed) return 'Confirmation pending'
  if (contact.accountExists) return 'Account exists · not linked yet'
  return 'Not registered'
}

function statusClass(contact: ClientAccessStatus) {
  if (contact.revoked) return 'revoked'
  if (contact.accessGranted) return 'active'
  if (contact.accountExists) return 'pending'
  return 'new'
}

function recoveryUrl(portalUrl: string) {
  const url = new URL(portalUrl)
  url.searchParams.set('clientRecovery', '1')
  return url.toString()
}

export default function ClientAccessManager({ eventId, primaryEmail, partnerEmail, portalUrl }: ClientAccessManagerProps) {
  const [contacts, setContacts] = useState<ClientAccessStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [busyAction, setBusyAction] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const refresh = async () => {
    setLoading(true)
    setError('')
    try {
      setContacts(await getEventClientAccessStatus(eventId))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load client access.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [eventId, primaryEmail, partnerEmail])

  const changeAccess = async (contact: ClientAccessStatus, allowed: boolean) => {
    if (!allowed && !window.confirm(`Revoke portal access for ${contact.email}? Their account will remain intact, but this event will no longer open for them.`)) return

    setBusyAction(`access:${contact.email}`)
    setError('')
    setNotice('')

    try {
      await setEventClientAccess(eventId, contact.email, allowed)
      await refresh()
      setNotice(allowed ? `Access restored for ${contact.email}.` : `Access revoked for ${contact.email}.`)
    } catch (accessError) {
      setError(accessError instanceof Error ? accessError.message : 'Unable to change client access.')
    } finally {
      setBusyAction('')
    }
  }

  const sendReset = async (contact: ClientAccessStatus) => {
    setBusyAction(`reset:${contact.email}`)
    setError('')
    setNotice('')

    try {
      await sendPasswordReset(contact.email, recoveryUrl(portalUrl))
      setNotice(`Password reset email requested for ${contact.email}.`)
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : 'Unable to request a password reset.')
    } finally {
      setBusyAction('')
    }
  }

  const activeCount = contacts.filter((contact) => contact.accessGranted && !contact.revoked).length

  return (
    <div className="client-access-manager">
      <div className="client-access-manager__heading client-access-manager__heading--actions">
        <div>
          <strong>Client accounts</strong>
          <small>{contacts.length ? `${activeCount} active of ${contacts.length} configured contact${contacts.length === 1 ? '' : 's'}.` : 'Each listed contact can use their own Supabase account.'}</small>
        </div>
        <button className="text-link" type="button" disabled={loading} onClick={() => { void refresh() }}>Refresh</button>
      </div>

      {loading && <div className="client-access-manager__loading">Checking account access…</div>}
      {error && <div className="owner-access-error" role="alert">{error}</div>}
      {notice && <div className="client-auth-status" role="status">{notice}</div>}

      {!loading && !error && contacts.length === 0 && (
        <div className="client-access-manager__loading">No client emails are configured for this event.</div>
      )}

      {!loading && contacts.map((contact) => {
        const accessBusy = busyAction === `access:${contact.email}`
        const resetBusy = busyAction === `reset:${contact.email}`

        return (
          <div className="client-access-contact" key={`${contact.contactType}-${contact.email}`}>
            <div className="client-access-contact__copy">
              <span>{contact.contactType === 'primary' ? 'Primary contact' : 'Partner / secondary contact'}</span>
              <strong>{contact.email}</strong>
              <small className={`client-access-state client-access-state--${statusClass(contact)}`}>{statusText(contact)}</small>
            </div>

            <div className="client-access-contact__actions">
              {contact.accountExists && !contact.revoked && (
                <button
                  className="button button--small button--ghost"
                  type="button"
                  disabled={Boolean(busyAction)}
                  onClick={() => { void sendReset(contact) }}
                >
                  {resetBusy ? 'Sending…' : 'Reset password'}
                </button>
              )}

              <button
                className={`button button--small ${contact.revoked ? 'button--primary' : 'button--ghost'}`}
                type="button"
                disabled={Boolean(busyAction)}
                onClick={() => { void changeAccess(contact, contact.revoked) }}
              >
                {accessBusy ? 'Updating…' : contact.revoked ? 'Restore access' : 'Revoke access'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}