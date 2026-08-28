# ViviaVisions v1.12.0

**Every detail. Every option. Every vision.**

ViviaVisions is a multi-tenant venue planning platform built with React, TypeScript, Vite and Supabase.

## Current production foundation

- ViviaVisions platform-admin authentication
- venue owner/staff authentication
- platform admins can support every venue
- secure client email/password accounts
- primary and partner contacts can use separate accounts
- password recovery
- owner-visible client access status
- revoke/restore client event access
- tenant/event Row Level Security
- 30-day event hard-delete protection
- Supabase-backed events, selections, layouts and messages
- Chandelier Oaks as the first real venue
- three explicit demo weddings retained for showcase use
- AI visual preview marked Coming Soon

## Local development

```powershell
cd C:\Users\aalbe\Documents\Dev\ViviaVisions
npm install
npm run dev
```

## Validation

```powershell
npm run check
npm run security
```

## Environment

Copy `.env.example` to `.env.local` and configure:

```text
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_PUBLIC_APP_URL=https://YOUR_PUBLIC_DOMAIN/
```

Never expose a Supabase `service_role` key to the browser.

## Database

Apply migrations in `supabase/migrations` in numeric order. Production setup and Supabase Auth URL/email configuration are documented in `PRODUCTION-SETUP.md`.

## Demo access

The Sarah & John, Ashley & Mark, and Jennifer & Matt workspaces intentionally retain demo-code access. Real client records use Supabase Auth and never rely on those demo codes.

## Publishing

Validate first, then commit only the intended source/config/migration changes.

```powershell
npm run check
git status
git add <intended files>
git commit -m "Describe the release"
git push
```