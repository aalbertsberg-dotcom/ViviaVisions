import { useEffect, useState } from 'react'
import { getEventClientAccessStatus, setEventClientAccess, type ClientAccessStatus } from '../lib/repositories/auth'

type ClientAccessManagerProps = {
  eventId: string
  primaryEmail: string
  partnerEmail: string
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

export default function ClientAccessManager({ eventId, primaryEmail, partnerEmail }: ClientAccessManagerProps) {
  const [contacts, setContacts] = useState<ClientAccessStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [busyEmail, setBusyEmail] = useState('')
  const [error, setError] = useState('')

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

    setBusyEmail(contact.email)
    setError('')

    try {
      await setEventClientAccess(eventId, contact.email, allowed)
      await refresh()
    } catch (accessError) {
      setError(accessError instanceof Error ? accessError.message : 'Unable to change client access.')
    } finally {
      setBusyEmail('')
    }
  }

  return (
    <div className="client-access-manager">
      <div className="client-access-manager__heading">
        <strong>Client accounts</strong>
        <small>Each listed contact can use their own Supabase account.</small>
      </div>

      {loading && <div className="client-access-manager__loading">Checking account access…</div>}
      {error && <div className="owner-access-error" role="alert">{error}</div>}

      {!loading && !error && contacts.length === 0 && (
        <div className="client-access-manager__loading">No client emails are configured for this event.</div>
      )}

      {!loading && contacts.map((contact) => (
        <div className="client-access-contact" key={`${contact.contactType}-${contact.email}`}>
          <div className="client-access-contact__copy">
            <span>{contact.contactType === 'primary' ? 'Primary contact' : 'Partner / secondary contact'}</span>
            <strong>{contact.email}</strong>
            <small className={`client-access-state client-access-state--${statusClass(contact)}`}>{statusText(contact)}</small>
          </div>

          <button
            className={`button button--small ${contact.revoked ? 'button--primary' : 'button--ghost'}`}
            type="button"
            disabled={busyEmail === contact.email}
            onClick={() => { void changeAccess(contact, contact.revoked) }}
          >
            {busyEmail === contact.email ? 'Updating…' : contact.revoked ? 'Restore access' : 'Revoke access'}
          </button>
        </div>
      ))}
    </div>
  )
}