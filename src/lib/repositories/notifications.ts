import { supabase } from '../supabase'

export type TransactionalEmailResult = {
  ok: boolean
  sent?: number
  skipped?: number
  message?: string
}

function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase
}

async function invokeTransactionalEmail(body: Record<string, string>): Promise<TransactionalEmailResult> {
  const client = requireSupabase()
  const { data, error } = await client.functions.invoke('send-event-email', { body })

  if (error) {
    let detail = error.message || 'The transactional email function could not be reached.'
    const response = (error as { context?: Response }).context
    if (response) {
      try {
        const payload = await response.clone().json() as { error?: string }
        if (payload.error) detail = payload.error
      } catch {
        // Keep the original function error.
      }
    }
    throw new Error(detail)
  }

  const result = (data ?? {}) as TransactionalEmailResult & { error?: string }
  if (result.error) throw new Error(result.error)
  if (!result.ok) throw new Error(result.message || 'The email could not be sent.')
  return result
}

export function sendClientInvitation(eventId: string, email: string) {
  return invokeTransactionalEmail({
    action: 'client_invite',
    eventId,
    email: email.trim().toLowerCase(),
  })
}

export function sendNewMessageNotification(eventId: string, messageId: string) {
  return invokeTransactionalEmail({
    action: 'new_message',
    eventId,
    messageId,
  })
}