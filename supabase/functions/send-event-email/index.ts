import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type JsonObject = Record<string, unknown>
type EmailAction = 'client_invite' | 'new_message'

function json(body: JsonObject, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function text(value: unknown, fallback = '') {
  return value === null || value === undefined ? fallback : String(value)
}

function objectValue(value: unknown): JsonObject {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonObject
    : {}
}

function normalizeEmail(value: unknown) {
  return text(value).trim().toLowerCase()
}

function uniqueEmails(values: unknown[]) {
  return Array.from(new Set(values.map(normalizeEmail).filter(Boolean)))
}

function escapeHtml(value: unknown) {
  return text(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function formatEventDate(value: unknown) {
  const raw = text(value)
  if (!raw) return 'your event'
  const date = new Date(`${raw}T12:00:00Z`)
  if (Number.isNaN(date.getTime())) return raw
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function requiredEnv(name: string) {
  const value = Deno.env.get(name)?.trim()
  if (!value) throw new Error(`${name} is not configured in Supabase Edge Function secrets.`)
  return value
}

function appBaseUrl() {
  return requiredEnv('VIVIAVISIONS_APP_URL').replace(/\/+$/, '')
}

function clientPortalUrl(venueSlug: string, clientLabel: string, accessSlug: string) {
  const segment = clientLabel === 'couple' ? 'couple' : 'client'
  return `${appBaseUrl()}/#/venue/${encodeURIComponent(venueSlug)}/${segment}/${encodeURIComponent(accessSlug)}`
}

function venueMessagesUrl(venueSlug: string) {
  return `${appBaseUrl()}/#/venue/${encodeURIComponent(venueSlug)}/messages`
}

function emailShell({
  eyebrow,
  heading,
  body,
  buttonLabel,
  buttonUrl,
  footer,
}: {
  eyebrow: string
  heading: string
  body: string
  buttonLabel: string
  buttonUrl: string
  footer: string
}) {
  return `<!doctype html>
<html>
  <body style="margin:0;background:#f7f3ed;font-family:Arial,sans-serif;color:#18283f;">
    <div style="max-width:620px;margin:0 auto;padding:32px 18px;">
      <div style="background:#ffffff;border:1px solid #e5d7c7;border-radius:18px;padding:30px;">
        <div style="font-size:11px;letter-spacing:.16em;font-weight:700;color:#a46f35;margin-bottom:10px;">${eyebrow}</div>
        <h1 style="font-family:Georgia,serif;font-size:30px;line-height:1.15;margin:0 0 16px;color:#18283f;">${heading}</h1>
        <div style="font-size:15px;line-height:1.65;color:#5e5a55;">${body}</div>
        <div style="margin-top:24px;">
          <a href="${escapeHtml(buttonUrl)}" style="display:inline-block;background:#18283f;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700;">${buttonLabel}</a>
        </div>
        <div style="border-top:1px solid #eee4d8;margin-top:28px;padding-top:16px;font-size:12px;line-height:1.5;color:#817a73;">${footer}</div>
      </div>
    </div>
  </body>
</html>`
}

async function sendWithResend({
  to,
  subject,
  html,
  idempotencyKey,
}: {
  to: string
  subject: string
  html: string
  idempotencyKey?: string
}) {
  const apiKey = requiredEnv('RESEND_API_KEY')
  const from = requiredEnv('VIVIAVISIONS_EMAIL_FROM')
  const replyTo = Deno.env.get('VIVIAVISIONS_EMAIL_REPLY_TO')?.trim()

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  })

  const payload = await response.json().catch(() => ({})) as JsonObject
  if (!response.ok) {
    const detail = text(payload.message, text(payload.name, `Resend returned HTTP ${response.status}.`))
    throw new Error(detail)
  }

  return text(payload.id)
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405)

  try {
    const supabaseUrl = requiredEnv('SUPABASE_URL')
    const publishableKeys = JSON.parse(requiredEnv('SUPABASE_PUBLISHABLE_KEYS')) as Record<string, string>
    const secretKeys = JSON.parse(requiredEnv('SUPABASE_SECRET_KEYS')) as Record<string, string>
    const publishableKey = publishableKeys.default
    const secretKey = secretKeys.default
    if (!publishableKey) throw new Error('Supabase default publishable key is not available.')
    if (!secretKey) throw new Error('Supabase default secret key is not available.')
    const authHeader = request.headers.get('Authorization')

    if (!authHeader) return json({ error: 'Sign in before sending transactional email.' }, 401)

    const userClient = createClient(supabaseUrl, publishableKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const admin = createClient(supabaseUrl, secretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: userResult, error: userError } = await userClient.auth.getUser()
    const user = userResult.user
    if (userError || !user) return json({ error: 'Your session is not valid.' }, 401)

    const payload = await request.json().catch(() => ({})) as JsonObject
    const action = text(payload.action) as EmailAction
    const eventId = text(payload.eventId)

    if ((action !== 'client_invite' && action !== 'new_message') || !eventId) {
      return json({ error: 'A valid email action and event are required.' }, 400)
    }

    // First enforce the same RLS access the signed-in browser receives.
    const { data: accessibleEvent, error: accessError } = await userClient
      .from('events')
      .select('id')
      .eq('id', eventId)
      .maybeSingle()

    if (accessError) throw accessError
    if (!accessibleEvent) return json({ error: 'You do not have access to this event.' }, 403)

    const { data: event, error: eventError } = await admin
      .from('events')
      .select('id,venue_id,client_id,access_slug,title,event_date,status,metadata')
      .eq('id', eventId)
      .maybeSingle()

    if (eventError) throw eventError
    if (!event) return json({ error: 'The event was not found.' }, 404)

    const eventMetadata = objectValue(event.metadata)
    if (event.status === 'cancelled' || text(eventMetadata.soft_deleted_at)) {
      return json({ error: 'Transactional email is disabled for cancelled or trashed events.' }, 409)
    }

    const [{ data: venue, error: venueError }, { data: client, error: clientError }] = await Promise.all([
      admin
        .from('venues')
        .select('id,slug,short_name,email,client_label')
        .eq('id', event.venue_id)
        .maybeSingle(),
      event.client_id
        ? admin
            .from('clients')
            .select('id,display_name,primary_email,secondary_email')
            .eq('id', event.client_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ])

    if (venueError) throw venueError
    if (clientError) throw clientError
    if (!venue) return json({ error: 'The event venue was not found.' }, 404)

    const portalUrl = clientPortalUrl(text(venue.slug), text(venue.client_label, 'client'), text(event.access_slug))
    const venueName = text(venue.short_name, 'Your venue')
    const clientName = text(client?.display_name, text(event.title, 'Client'))
    const eventDate = formatEventDate(event.event_date)

    const { data: profile } = await admin
      .from('profiles')
      .select('platform_role')
      .eq('id', user.id)
      .maybeSingle()

    const { data: membership } = await admin
      .from('venue_memberships')
      .select('role')
      .eq('venue_id', event.venue_id)
      .eq('user_id', user.id)
      .maybeSingle()

    const isVenueAdmin = profile?.platform_role === 'admin'
      || membership?.role === 'owner'
      || membership?.role === 'staff'

    let recipients: string[] = []
    let subject = ''
    let html = ''
    let emailType: 'client_invite' | 'new_message' = action
    let messageAppId = ''

    if (action === 'client_invite') {
      if (!isVenueAdmin) return json({ error: 'Only venue staff or ViviaVisions administrators can send client invitations.' }, 403)
      if (!client) return json({ error: 'This event does not have a client record.' }, 409)

      const requestedEmail = normalizeEmail(payload.email)
      const approved = uniqueEmails([client.primary_email, client.secondary_email])
      if (!requestedEmail || !approved.includes(requestedEmail)) {
        return json({ error: 'That email is not an approved contact on this event.' }, 400)
      }

      const { data: block } = await admin
        .from('client_access_blocks')
        .select('email')
        .eq('client_id', client.id)
        .eq('email', requestedEmail)
        .maybeSingle()

      if (block) return json({ error: 'Restore this contact before sending another invitation.' }, 409)

      const sixtySecondsAgo = new Date(Date.now() - 60_000).toISOString()
      const { data: recentInvite } = await admin
        .from('email_delivery_log')
        .select('id,status')
        .eq('event_id', eventId)
        .eq('email_type', 'client_invite')
        .eq('recipient_email', requestedEmail)
        .in('status', ['sending', 'sent'])
        .gte('created_at', sixtySecondsAgo)
        .limit(1)
        .maybeSingle()

      if (recentInvite) {
        return json({
          ok: true,
          sent: 0,
          skipped: 1,
          message: `An invitation was already sent to ${requestedEmail} within the last minute.`,
        })
      }

      recipients = [requestedEmail]
      subject = `${venueName} planning portal invitation`
      html = emailShell({
        eyebrow: 'VIVIAVISIONS · PRIVATE CLIENT PORTAL',
        heading: `${escapeHtml(clientName)}, your planning portal is ready.`,
        body: `<p style="margin:0 0 12px;">${escapeHtml(venueName)} has created a private planning workspace for <strong>${escapeHtml(eventDate)}</strong>.</p>
          <p style="margin:0;">Use <strong>${escapeHtml(requestedEmail)}</strong> to sign in or create your account. Your portal keeps venue resources, layouts, media and messages together.</p>`,
        buttonLabel: 'Open planning portal',
        buttonUrl: portalUrl,
        footer: `This invitation was sent by ${escapeHtml(venueName)} through ViviaVisions. Only email addresses assigned to this event can open the private workspace.`,
      })
    } else {
      const messageId = text(payload.messageId)
      if (!messageId) return json({ error: 'A saved message ID is required.' }, 400)

      const { data: recentMessages, error: messageError } = await admin
        .from('messages')
        .select('id,sender_role,sender_name,body,metadata,created_at')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
        .limit(30)

      if (messageError) throw messageError

      const savedMessage = (recentMessages ?? []).find((row) => {
        const metadata = objectValue(row.metadata)
        return text(metadata.app_id) === messageId || text(row.id) === messageId
      })

      if (!savedMessage) return json({ error: 'The saved message could not be found for notification.' }, 404)

      const messageMetadata = objectValue(savedMessage.metadata)
      messageAppId = text(messageMetadata.app_id, text(savedMessage.id))
      const senderRole = savedMessage.sender_role === 'venue' ? 'venue' : 'client'
      const senderName = text(savedMessage.sender_name, senderRole === 'venue' ? `${venueName} Team` : clientName)
      const bodyPreview = text(savedMessage.body).trim().slice(0, 320)
      const attachmentCount = Array.isArray(messageMetadata.attachments) ? messageMetadata.attachments.length : 0

      if (senderRole === 'venue') {
        if (!client) return json({ ok: true, sent: 0, skipped: 1, message: 'No client contacts are configured.' })

        const { data: blocks } = await admin
          .from('client_access_blocks')
          .select('email')
          .eq('client_id', client.id)

        const blocked = new Set((blocks ?? []).map((row) => normalizeEmail(row.email)))
        recipients = uniqueEmails([client.primary_email, client.secondary_email])
          .filter((email) => !blocked.has(email))

        subject = `New message from ${venueName}`
        html = emailShell({
          eyebrow: `${escapeHtml(venueName.toUpperCase())} · NEW MESSAGE`,
          heading: `You have a new planning message.`,
          body: `<p style="margin:0 0 12px;"><strong>${escapeHtml(senderName)}</strong> sent a message about ${escapeHtml(eventDate)}.</p>
            ${bodyPreview ? `<div style="padding:14px 16px;background:#f8f5f0;border-radius:10px;color:#4e4a45;">${escapeHtml(bodyPreview)}</div>` : ''}
            ${attachmentCount ? `<p style="margin:12px 0 0;">${attachmentCount} attachment${attachmentCount === 1 ? '' : 's'} included in the portal.</p>` : ''}`,
          buttonLabel: 'Open planning portal',
          buttonUrl: portalUrl,
          footer: `Open ViviaVisions to reply so the conversation stays attached to your ${escapeHtml(text(venue.client_label, 'client'))} workspace.`,
        })
      } else {
        const { data: memberships, error: membershipsError } = await admin
          .from('venue_memberships')
          .select('user_id')
          .eq('venue_id', event.venue_id)
          .in('role', ['owner', 'staff'])

        if (membershipsError) throw membershipsError

        const userIds = (memberships ?? []).map((row) => text(row.user_id)).filter(Boolean)
        let staffEmails: string[] = []

        if (userIds.length) {
          const { data: staffProfiles, error: profilesError } = await admin
            .from('profiles')
            .select('email')
            .in('id', userIds)

          if (profilesError) throw profilesError
          staffEmails = (staffProfiles ?? []).map((row) => normalizeEmail(row.email))
        }

        recipients = uniqueEmails([venue.email, ...staffEmails])
        const senderEmail = normalizeEmail(user.email)
        recipients = recipients.filter((email) => email !== senderEmail)

        subject = `New ${text(venue.client_label, 'client')} message · ${clientName}`
        html = emailShell({
          eyebrow: `${escapeHtml(venueName.toUpperCase())} · CLIENT MESSAGE`,
          heading: `${escapeHtml(clientName)} sent a new message.`,
          body: `<p style="margin:0 0 12px;"><strong>${escapeHtml(senderName)}</strong> sent a message about the ${escapeHtml(eventDate)} event.</p>
            ${bodyPreview ? `<div style="padding:14px 16px;background:#f8f5f0;border-radius:10px;color:#4e4a45;">${escapeHtml(bodyPreview)}</div>` : ''}
            ${attachmentCount ? `<p style="margin:12px 0 0;">${attachmentCount} attachment${attachmentCount === 1 ? '' : 's'} included in ViviaVisions.</p>` : ''}`,
          buttonLabel: 'Open venue messages',
          buttonUrl: venueMessagesUrl(text(venue.slug)),
          footer: `Reply inside ViviaVisions so the conversation remains attached to ${escapeHtml(clientName)}.`,
        })
      }
    }

    recipients = uniqueEmails(recipients)
    if (!recipients.length) {
      return json({ ok: true, sent: 0, skipped: 1, message: 'No email notification recipients are configured.' })
    }

    let sent = 0
    let skipped = 0
    const failures: string[] = []

    for (const recipient of recipients) {
      const dedupeKey = action === 'new_message'
        ? `message:${eventId}:${messageAppId}:${recipient}`
        : null

      const logId = crypto.randomUUID()
      const { error: claimError } = await admin
        .from('email_delivery_log')
        .insert({
          id: logId,
          venue_id: event.venue_id,
          event_id: eventId,
          email_type: emailType,
          recipient_email: recipient,
          dedupe_key: dedupeKey,
          status: 'sending',
          requested_by: user.id,
          metadata: {
            action,
            message_app_id: messageAppId || null,
          },
        })

      if (claimError) {
        if (claimError.code === '23505' && dedupeKey) {
          skipped += 1
          continue
        }
        throw claimError
      }

      try {
        const providerMessageId = await sendWithResend({
          to: recipient,
          subject,
          html,
          ...(dedupeKey ? { idempotencyKey: dedupeKey } : {}),
        })

        const { error: logError } = await admin
          .from('email_delivery_log')
          .update({
            status: 'sent',
            provider_message_id: providerMessageId || null,
            error_message: null,
          })
          .eq('id', logId)

        if (logError) console.error('Unable to update sent email log.', logError)
        sent += 1
      } catch (sendError) {
        const detail = sendError instanceof Error ? sendError.message : 'Unknown email provider error.'
        failures.push(`${recipient}: ${detail}`)

        await admin
          .from('email_delivery_log')
          .update({
            status: 'failed',
            error_message: detail.slice(0, 2000),
          })
          .eq('id', logId)
      }
    }

    if (!sent && failures.length) {
      return json({ error: failures.join(' | ') }, 502)
    }

    return json({
      ok: true,
      sent,
      skipped,
      message: action === 'client_invite'
        ? `Invitation email sent to ${recipients[0]}.`
        : `${sent} email notification${sent === 1 ? '' : 's'} sent.`,
      ...(failures.length ? { warnings: failures } : {}),
    })
  } catch (error) {
    console.error(error)
    return json({
      error: error instanceof Error ? error.message : 'Unable to send transactional email.',
    }, 500)
  }
})