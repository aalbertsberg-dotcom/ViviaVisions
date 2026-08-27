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
