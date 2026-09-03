# ViviaVisions v1.18.0

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
- private Supabase Storage for real venue/client media
- full live-venue inventory CRUD with public inventory photos and CSV import
- ViviaVisions Admin inventory view separated by venue
- venue profile, package and planning-space content management
- Resend-powered client invitation emails through a Supabase Edge Function
- automatic transactional email notifications after real messages are saved
- server-side delivery logging and duplicate-message protection
- cross-tenant relationship guards and current-session RLS regression checks
- VV Admin Production Check dashboard
- dedicated demo showcase separated from real client sign-in
- Playwright desktop/mobile smoke tests locally and against the live production domain

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
## v1.16.1

- Chandelier Oaks owner/staff sign-in now includes password reset and a complete recovery flow.
- After repeated failed owner/staff sign-ins, the page explicitly points users to password reset.
- The public Customer Agreement now contains only the legal terms; internal signature/order-form template instructions are no longer public.
- Paid onboarding is described as a separate Order Form / Customer Agreement sent privately for review and signature.
## v1.17.0
Adds ViviaVisions Partner placeholders plus first-party analytics for page views, anonymous visits, partner impressions, partner clicks and CTR. VV Admin receives a 7/30/90-day analytics panel. Apply migration `202609030010_partner_analytics.sql`. Analytics starts collecting after deployment and is not retroactive.
## v1.17.1
- Makes ViviaVisions Partners the primary heading and reduces the supporting heading.
- Makes every partner card interactive and opens a partner detail view.
- Partner clicks now represent partner-card/detail opens; the email CTA remains a separate action.
- Reorganizes VV Admin analytics into clear Whole Site Traffic and Partner Analytics sections.
- Clarifies that visits are anonymous browser sessions and that development/testing traffic is included.
## v1.17.2
- Moves VV Admin analytics below the primary venue/operations sections.
- Prevents Playwright Quality/Production Smoke tests from recording page views, partner impressions or partner clicks.
- Adds migration 011 to reset the analytics-only table once because earlier automated smoke tests polluted the initial counts.
- Apply migration 011 only AFTER v1.17.2 is deployed and Production Smoke is green.
## v1.18.0 — Partner Management
- Adds a protected VV Admin Partner Management page at `#/platform-partners`.
- Reorganizes platform navigation: Admin, Venue Accounts, Partners and Inventory are primary; Requests and Production Check live in the existing Menu drawer.
- Partners are stored in Supabase and can be added, edited, archived/restored and assigned to one or more venue pages.
- Admin fields include category, badge, plan, monthly price, website, contact email, service area, logo URL, CTA, placement dates, venue placement, featured status, placeholder status, sort order and internal notes.
- Public venue partner cards load managed records from Supabase with the v1.17 built-in cards retained as a safe fallback.
- Migration 012 seeds the four current Chandelier Oaks partner cards into the managed table.