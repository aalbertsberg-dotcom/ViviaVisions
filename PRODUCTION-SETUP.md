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