# ViviaVisions Supabase backend

This folder is the beginning of the production backend. The existing React demo still runs without Supabase so the live showcase does not break while the backend is being built.

## First-time setup

1. Create a Supabase project.
2. Open SQL Editor and run `migrations/202608270001_initial_multitenant.sql`.
3. In the project Connect panel, copy the project URL and publishable key.
4. Copy `.env.example` to `.env.local` and fill in those two values.
5. Run `npm install`, then `npm run check`.

## Security model

Every venue-owned record carries a `venue_id` directly or inherits one through its event/layout relationship. Row Level Security separates:

- platform admins
- venue owners
- venue staff
- venue clients
- public venue content

The Storage bucket is private and uses paths like:

- `venues/<venue-id>/shared/...`
- `venues/<venue-id>/events/<event-id>/...`

Do not put a Supabase `service_role` key in `.env.local`, Vite variables, GitHub Pages, or any browser code.

## Migration path from the current demo

The production conversion should happen feature by feature:

1. venue profiles / branding
2. packages and spaces
3. inventory
4. auth + memberships
5. clients and events
6. selections and layouts
7. messages
8. media storage

Chandelier Oaks should be the first tenant migrated from `src/data.ts` after the schema is running.

## Transactional email

`functions/send-event-email` is the server-only Resend gateway for:

- client portal invitation emails
- new client-to-venue message notifications
- new venue-to-client message notifications

The browser invokes the function with the current Supabase session. The function re-validates event access, calculates recipients server-side, keeps the Resend key in Edge Function secrets, and writes delivery history to `email_delivery_log`.

Apply `migrations/202608280008_email_notifications.sql` before deploying the function.

Do not put `RESEND_API_KEY` or `SUPABASE_SERVICE_ROLE_KEY` in the React app, GitHub Pages environment, or any `VITE_` variable.