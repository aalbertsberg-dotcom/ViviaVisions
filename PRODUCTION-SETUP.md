# ViviaVisions production setup

Use this checklist before putting a real public domain in front of the app.

## 1. Production environment

Configure the deployed Vite environment:

```text
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
VITE_PUBLIC_APP_URL=https://YOUR_PUBLIC_DOMAIN/
```

`VITE_PUBLIC_APP_URL` is the canonical base used for client invitations, signup confirmation links and password-recovery redirects.

## 2. Supabase Authentication URL configuration

In **Supabase → Authentication → URL Configuration**:

- Site URL: `https://YOUR_PUBLIC_DOMAIN/`
- Add a redirect entry covering `https://YOUR_PUBLIC_DOMAIN/**`
- Keep `http://localhost:5173/**` while local testing is still required

Do not use localhost in production invitations.

## 3. Email templates

Repository templates are stored in:

- `supabase/email-templates/confirmation.html`
- `supabase/email-templates/recovery.html`

Copy their contents into the matching Supabase Auth email templates and customize sender/branding as needed.

## 4. Account behavior to verify

Test with two different emails on one real wedding:

1. primary contact creates an account and confirms email
2. partner creates a separate account and confirms email
3. both land only in the assigned wedding
4. Forgot password returns to the correct venue/client portal
5. venue owner can see account status
6. venue owner can revoke and restore either contact independently
7. revoked contact cannot reclaim the wedding by signing in again

## 5. Event-data safety

Production events are database-backed. Normal app refreshes and releases must never delete them.

Permanent event deletion requires:

1. event moved to Trash
2. 30-day recovery period elapsed
3. authorized hard-delete request

The database trigger enforces this even if a future application path is incorrect.

## 6. Release validation

Before every production push:

```powershell
npm ci
npm run check
npm run security
git diff --check
```

The GitHub Actions quality workflow also runs build/typecheck and production-dependency security audit.

## 7. Launch cleanup

Before customer launch:

- remove or hide the temporary Demo Events chooser if it is no longer wanted
- keep showcase weddings clearly separated from real customer records
- verify no `.env.local`, service-role keys, passwords or customer exports are committed
- verify the public domain works for signup confirmation and password recovery
- test owner, platform-admin, primary-client and partner-client sign-out/sign-in in separate private browser sessions
## 8. Resend transactional email

ViviaVisions uses two Resend paths:

1. **Supabase Auth email** — connect Resend to Supabase Auth/SMTP for confirmation and password-reset emails.
2. **Application transactional email** — `supabase/functions/send-event-email` sends client invitations and new-message notifications.

### Resend setup

1. Create a Resend account.
2. Verify the domain you will send from.
3. Create a Resend API key.
4. In **Supabase → Edge Functions → Secrets**, configure:

```text
RESEND_API_KEY=re_...
VIVIAVISIONS_EMAIL_FROM=ViviaVisions <notifications@yourdomain.com>
VIVIAVISIONS_EMAIL_REPLY_TO=hello@yourdomain.com
VIVIAVISIONS_APP_URL=https://YOUR_PUBLIC_DOMAIN/
```

`VIVIAVISIONS_EMAIL_REPLY_TO` is optional.

The Supabase project automatically provides `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEYS`, and `SUPABASE_SECRET_KEYS` to hosted Edge Functions. The publishable/secret variables are JSON dictionaries; the function uses the `default` key from each. `SUPABASE_SECRET_KEYS` bypasses RLS and must never be copied into Vite/browser environment variables.

### Deploy the email function

With the Supabase CLI linked to the production project:

```powershell
supabase functions deploy send-event-email --no-verify-jwt
```

The function performs its own authenticated-user check before it sends any email. It then validates event access and determines recipients on the server.

### Apply migration 008

Run:

`supabase/migrations/202608280008_email_notifications.sql`

This creates `email_delivery_log`. Venue staff and platform admins can read delivery history for their venues; browser clients cannot write delivery records.

### Expected behavior

- Venue owner/staff opens Access Details and sends an invitation to the primary or partner email.
- Invitations can only be sent to contacts already assigned to that event.
- Revoked contacts cannot be invited until access is restored.
- A real venue message sends client email notification only after the message is saved.
- A real client message sends venue/staff email notification only after the message is saved.
- Message notifications are idempotent by event + app message ID + recipient.
- Email failure never rolls back an already-saved planning message.