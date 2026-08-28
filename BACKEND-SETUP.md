# ViviaVisions backend setup

ViviaVisions uses one Supabase project for the platform. Venues are isolated tenants inside the same database.

## Environment

Copy `.env.example` to `.env.local` and set:

```text
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_PUBLIC_APP_URL=https://YOUR_PUBLIC_DOMAIN/
```

The publishable key is browser-safe. Never place the `service_role` key in Vite environment variables.

## Database migrations

Run every file in `supabase/migrations` in numeric order.

The current migration set includes:

- multi-tenant schema and RLS
- event retention
- secure client authentication
- event hard-delete guard
- client account revoke/restore management
- generic client portal discovery

## Authentication model

- `profiles.platform_role = 'admin'`: ViviaVisions platform administration
- `venue_memberships`: venue owner/staff permissions
- `client_users`: authenticated client/event relationships
- `client_access_blocks`: durable per-event access revocation

Real clients authenticate with Supabase email/password. Primary and partner emails on the event are the approved identities that can claim the workspace.

## Storage

Private venue/event media uses the `venue-assets` Supabase Storage bucket and its RLS policies.

## Production configuration

See `PRODUCTION-SETUP.md` for public URLs, Supabase redirect allow-list settings, email templates, validation and launch checks.