# ViviaVisions v1.8.0

**Every detail. Every option. Every vision.**

## v1.8.0 — production backend foundation

This version starts the transition from a browser demo to a real multi-tenant SaaS platform without removing the working demo data yet.

### Name-independent platform configuration
The platform identity now lives in `platform.config.json`:

- platform name
- legal name
- wordmark pieces
- tagline
- site description
- A³ creator link/logo

Most product-facing branding now reads from that configuration so a future rename no longer requires a site-wide text rewrite.

### Supabase foundation
Added:

- `@supabase/supabase-js`
- `.env.example`
- reusable Supabase browser client
- auth repository scaffold
- venue/event repository scaffold
- backend status detection
- initial PostgreSQL migration
- Row Level Security tenant isolation
- private `venue-assets` storage bucket/policies

### Initial production schema
The migration creates:

- profiles
- venues
- venue memberships
- clients
- packages
- spaces
- inventory
- events
- selections
- layouts + layout items
- messages + read state
- media assets
- invitations

Every tenant-owned record is protected through a venue or event relationship. Chandelier Oaks will be the first real tenant migrated after the Supabase project is connected.

See `BACKEND-SETUP.md` for the next steps.

## Current demo access
Temporary browser-only access codes remain in place while real authentication is built:

- ViviaVisions Admin POC: `654321`
- Chandelier Oaks owner: `123456`
- Sarah & John: `111111`
- Ashley & Mark: `222222`
- Jennifer & Matt: `333333`

The demo codes will be removed when the Supabase Auth screens are connected.

## Run locally

```powershell
cd C:\Users\aalbe\Documents\Dev\ViviaVisions
npm install
npm run dev
```

## Validate

```powershell
npm run check
```

## Publish

```powershell
npm run build
git add .
git commit -m "Start ViviaVisions production backend"
git push
```


## v1.8.1
- Replaced the temporary ViviaVisions platform-admin code with Supabase email/password authentication.
- Platform admin access is verified against the `profiles.platform_role = 'admin'` authorization helper.
- Supabase sessions now persist securely through the browser client.
- Venue-owner and client demo-code migration will follow separately.


## v1.8.2
- Replaced the Chandelier Oaks temporary owner code with real Supabase email/password authentication.
- Owner/staff authorization is verified through `venue_memberships`.
- Existing sessions are restored and re-checked against the venue membership.
- Platform admins can still access venue administration for support.
- Fictional showcase venues keep their temporary preview passwords for now.


## v1.8.3
- Removed the legacy owner-code session restore that could open a venue owner portal without a fresh authorization check.
- Platform-admin status no longer automatically grants venue-owner access.
- Chandelier Oaks owner access now requires an explicit `owner` or `staff` row in `venue_memberships`.
- Platform support/impersonation access can be added later as an explicit audited workflow.


## v1.8.4
- Fixed the Chandelier Oaks owner page getting stuck on "Checking your session...".
- Signed-out users now fall back to the email/password form instead of waiting indefinitely.
- Venue authorization now uses the authenticated session user ID directly.
- Venue access checks fail closed after a short timeout rather than leaving the UI in a loading state.


## v1.8.5
- Removed automatic owner-portal session restoration for Chandelier Oaks.
- The Chandelier owner portal now shows the email/password form unless owner access was explicitly established in the current app session.
- Signing out clears owner access immediately and returns to the public venue page.
- This avoids shared Supabase sessions silently opening the owner portal while platform and venue authentication are still being separated.
