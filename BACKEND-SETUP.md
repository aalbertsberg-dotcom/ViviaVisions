# Backend setup — first production step

ViviaVisions v1.8.0 is prepared to connect to Supabase without breaking the current browser demo.

## 1. Create the Supabase project

Create one Supabase project for the platform. Do not create one project per venue. Venues are tenants inside the same secured database.

## 2. Create the database

In Supabase **SQL Editor**, paste and run:

`supabase/migrations/202608270001_initial_multitenant.sql`

That creates the first production tables for:

- users / profiles
- venues
- venue owners and staff
- clients
- packages
- spaces
- inventory
- events
- selections
- layouts and placed items
- messages and read state
- media metadata
- invitations
- private media storage

It also enables Row Level Security so venue data is separated at the database layer.

## 3. Connect the React app

Copy `.env.example` to `.env.local`:

```powershell
Copy-Item .env.example .env.local
notepad .env.local
```

From Supabase **Connect**, copy the Project URL and Publishable Key into:

```text
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

Never use a `service_role` key in the React app.

## 4. Install and verify

```powershell
npm install
npm run check
```

The internal Admin POC will show **Backend: Supabase connected** when the two environment values are present.

## What happens next

After the project connects successfully, migrate **Chandelier Oaks** first:

1. venue profile / branding
2. packages
3. spaces
4. inventory
5. owner account
6. clients + events
7. selections/layouts/messages/media

The temporary demo codes stay in place until real Supabase Auth is wired into the sign-in screens.
