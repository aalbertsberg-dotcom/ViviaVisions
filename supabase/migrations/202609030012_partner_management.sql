begin;

create table if not exists public.vendor_partners (
  id uuid primary key default gen_random_uuid(),
  partner_key text not null unique,
  name text not null,
  category text not null default '',
  description text not null default '',
  badge text not null default 'PARTNER',
  website_url text not null default '',
  contact_email text not null default '',
  service_area text not null default '',
  logo_url text not null default '',
  cta_label text not null default 'Request information',
  plan_tier text not null default 'Listing',
  monthly_price_cents integer not null default 0 check (monthly_price_cents >= 0),
  start_date date,
  end_date date,
  venue_slugs text[] not null default '{}'::text[],
  sort_order integer not null default 0,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  is_placeholder boolean not null default false,
  internal_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vendor_partners_public_idx
  on public.vendor_partners (is_active, sort_order, name);

create index if not exists vendor_partners_venue_slugs_idx
  on public.vendor_partners using gin (venue_slugs);

alter table public.vendor_partners enable row level security;

drop policy if exists vendor_partners_public_read on public.vendor_partners;
create policy vendor_partners_public_read
  on public.vendor_partners
  for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists vendor_partners_platform_read on public.vendor_partners;
create policy vendor_partners_platform_read
  on public.vendor_partners
  for select
  to authenticated
  using (coalesce(public.is_platform_admin(), false));

drop policy if exists vendor_partners_platform_insert on public.vendor_partners;
create policy vendor_partners_platform_insert
  on public.vendor_partners
  for insert
  to authenticated
  with check (coalesce(public.is_platform_admin(), false));

drop policy if exists vendor_partners_platform_update on public.vendor_partners;
create policy vendor_partners_platform_update
  on public.vendor_partners
  for update
  to authenticated
  using (coalesce(public.is_platform_admin(), false))
  with check (coalesce(public.is_platform_admin(), false));

revoke all on table public.vendor_partners from public;
grant select on table public.vendor_partners to anon, authenticated;
grant insert, update on table public.vendor_partners to authenticated;

insert into public.vendor_partners (
  partner_key, name, category, description, badge, cta_label, plan_tier,
  monthly_price_cents, venue_slugs, sort_order, is_active, is_featured,
  is_placeholder, internal_notes
)
values
  (
    'southern-lux-rentals',
    'Southern Lux Rentals',
    'Luxury Restrooms',
    'Luxury restroom trailer service for weddings and events. Website, service area and booking details can be added when ready.',
    'FOUNDING PARTNER',
    'Request information',
    'Founding',
    0,
    array['chandelier-oaks'],
    10,
    true,
    true,
    false,
    'Founding partner. Add final website, service area, pricing arrangement and logo when available.'
  ),
  (
    'party-girls',
    'Party Girls',
    'Event Rentals & Décor',
    'A founding rental and décor partner placeholder ready for photos, packages and a direct booking link.',
    'FOUNDING PARTNER',
    'Request information',
    'Founding',
    0,
    array['chandelier-oaks'],
    20,
    true,
    true,
    false,
    'Founding partner. Add final business/contact details when available.'
  ),
  (
    'photo-booth-partner',
    'Photo Booth Partner',
    'Photo Booth',
    'Reserved category for a future photo booth partner.',
    'PARTNER OPENING',
    'Ask about this category',
    'Opening',
    0,
    array['chandelier-oaks'],
    30,
    true,
    false,
    true,
    'Open partner category.'
  ),
  (
    'floral-partner',
    'Floral Partner',
    'Florals',
    'Reserved category for a future floral and styling partner.',
    'PARTNER OPENING',
    'Ask about this category',
    'Opening',
    0,
    array['chandelier-oaks'],
    40,
    true,
    false,
    true,
    'Open partner category.'
  )
on conflict (partner_key) do nothing;

commit;