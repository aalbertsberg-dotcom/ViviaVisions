-- ViviaVisions initial production data model
-- Multi-tenant PostgreSQL schema + Row Level Security for Supabase.

create extension if not exists pgcrypto;

-- ---------- Core identity ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  phone text,
  platform_role text not null default 'user' check (platform_role in ('user','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.venues (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  short_name text not null,
  tagline text,
  website text,
  address text,
  phone text,
  email text,
  owner_display_name text,
  brand_primary text not null default '#243248',
  brand_accent text not null default '#b68a45',
  brand_surface text,
  brand_text text,
  logo_text text,
  logo_url text,
  location_label text,
  inventory_label text,
  preview_label text,
  venue_type_label text not null default 'Event venue',
  event_label text not null default 'event',
  event_plural_label text not null default 'events',
  client_label text not null default 'client',
  client_plural_label text not null default 'clients',
  portal_hero_title text,
  portal_hero_body text,
  one_event_per_date boolean not null default true,
  owner_dashboard_note text,
  is_published boolean not null default false,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.venue_memberships (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','staff')),
  created_at timestamptz not null default now(),
  unique (venue_id, user_id)
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  display_name text not null,
  primary_email text,
  secondary_email text,
  phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Venue configuration ----------
create table if not exists public.venue_packages (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  external_key text,
  name text not null,
  price numeric(12,2),
  duration text,
  max_guests integer,
  tier integer not null default 1 check (tier between 1 and 20),
  description text,
  highlights jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (venue_id, external_key)
);

create table if not exists public.venue_spaces (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  external_key text,
  name text not null,
  kind text not null default 'Other',
  description text,
  planner_enabled boolean not null default true,
  visual_key text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (venue_id, external_key)
);

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  external_key text,
  name text not null,
  category text not null default 'Miscellaneous',
  color text,
  quantity integer not null default 0 check (quantity >= 0),
  dimensions text,
  storage_location text,
  description text,
  image_style text,
  featured boolean not null default false,
  access_tier integer not null default 1,
  package_note text,
  image_url text,
  is_active boolean not null default true,
  is_public boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (venue_id, external_key)
);

-- ---------- Events ----------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  package_id uuid references public.venue_packages(id) on delete set null,
  access_slug text,
  title text not null,
  event_type text not null default 'event',
  event_date date not null,
  guest_count integer check (guest_count is null or guest_count >= 0),
  status text not null default 'not_started' check (status in ('not_started','designing','ready','completed','cancelled')),
  ceremony_space_id uuid references public.venue_spaces(id) on delete set null,
  reception_space_id uuid references public.venue_spaces(id) on delete set null,
  notes text,
  contract_signed boolean not null default false,
  reservation_paid boolean not null default false,
  payment_steps_completed integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (venue_id, access_slug)
);

-- Venue-specific booking protection is enforced by a trigger below. Venues with
-- one_event_per_date = false can intentionally allow overlapping event dates.

create table if not exists public.event_selections (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  inventory_item_id uuid not null references public.inventory_items(id) on delete cascade,
  quantity integer not null default 1 check (quantity >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, inventory_item_id)
);

create table if not exists public.layouts (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  venue_space_id uuid references public.venue_spaces(id) on delete set null,
  name text not null default 'Layout',
  canvas_width integer not null default 1000,
  canvas_height integer not null default 700,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.layout_items (
  id uuid primary key default gen_random_uuid(),
  layout_id uuid not null references public.layouts(id) on delete cascade,
  inventory_item_id uuid references public.inventory_items(id) on delete set null,
  parent_item_id uuid references public.layout_items(id) on delete cascade,
  object_type text not null,
  label text not null,
  x numeric not null default 0,
  y numeric not null default 0,
  rotation numeric not null default 0,
  scale numeric not null default 1,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  sender_user_id uuid references auth.users(id) on delete set null,
  sender_role text not null check (sender_role in ('client','venue','system')),
  sender_name text not null,
  body text not null,
  context_kind text,
  context_id uuid,
  context_label text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.message_reads (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  event_id uuid references public.events(id) on delete cascade,
  uploaded_by uuid references auth.users(id) on delete set null,
  storage_path text not null unique,
  name text not null,
  mime_type text,
  size_bytes bigint,
  media_type text not null check (media_type in ('image','video','document')),
  purpose text not null default 'document',
  venue_space_id uuid references public.venue_spaces(id) on delete set null,
  inventory_item_id uuid references public.inventory_items(id) on delete set null,
  ai_reference boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.venue_invitations (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  event_id uuid references public.events(id) on delete cascade,
  email text not null,
  role text not null check (role in ('owner','staff','client')),
  token_hash text not null unique,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------- Helpful indexes ----------
create index if not exists venue_memberships_user_idx on public.venue_memberships(user_id);
create index if not exists clients_venue_idx on public.clients(venue_id);
create index if not exists clients_user_idx on public.clients(user_id);
create index if not exists venue_packages_venue_idx on public.venue_packages(venue_id);
create index if not exists venue_spaces_venue_idx on public.venue_spaces(venue_id);
create index if not exists inventory_items_venue_idx on public.inventory_items(venue_id);
create index if not exists events_venue_idx on public.events(venue_id);
create index if not exists events_client_idx on public.events(client_id);
create index if not exists events_date_idx on public.events(event_date);
create index if not exists selections_event_idx on public.event_selections(event_id);
create index if not exists layouts_event_idx on public.layouts(event_id);
create index if not exists layout_items_layout_idx on public.layout_items(layout_id);
create index if not exists messages_event_idx on public.messages(event_id, created_at);
create index if not exists media_assets_venue_idx on public.media_assets(venue_id);
create index if not exists media_assets_event_idx on public.media_assets(event_id);

-- Venue-specific date collision protection. The advisory lock avoids two concurrent
-- bookings slipping through the check for venues that allow only one event per date.
create or replace function public.enforce_venue_event_date_rule()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  enforce_rule boolean;
begin
  if new.status = 'cancelled' then
    return new;
  end if;

  select v.one_event_per_date into enforce_rule
  from public.venues v
  where v.id = new.venue_id;

  if coalesce(enforce_rule, true) then
    perform pg_advisory_xact_lock(hashtextextended(new.venue_id::text || ':' || new.event_date::text, 0));

    if exists (
      select 1 from public.events e
      where e.venue_id = new.venue_id
        and e.event_date = new.event_date
        and e.status <> 'cancelled'
        and e.id <> new.id
    ) then
      raise exception 'This venue already has an active event on %', new.event_date
        using errcode = '23505';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_venue_event_date on public.events;
create trigger enforce_venue_event_date
before insert or update of venue_id, event_date, status on public.events
for each row execute procedure public.enforce_venue_event_date_rule();

-- ---------- updated_at helper ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name'))
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update of email on auth.users
for each row execute procedure public.handle_new_user();

-- Add timestamp triggers without failing if migration is re-run.
do $$
declare
  tbl text;
begin
  foreach tbl in array array['profiles','venues','clients','venue_packages','venue_spaces','inventory_items','events','event_selections','layouts','layout_items','messages']
  loop
    execute format('drop trigger if exists set_%I_updated_at on public.%I', tbl, tbl);
    execute format('create trigger set_%I_updated_at before update on public.%I for each row execute procedure public.set_updated_at()', tbl, tbl);
  end loop;
end $$;

-- ---------- Authorization helpers ----------
create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.platform_role = 'admin'
  );
$$;

create or replace function public.is_venue_member(target_venue_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.venue_memberships vm
    where vm.venue_id = target_venue_id and vm.user_id = (select auth.uid())
  );
$$;

create or replace function public.is_venue_staff(target_venue_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.venue_memberships vm
    where vm.venue_id = target_venue_id
      and vm.user_id = (select auth.uid())
      and vm.role in ('owner','staff')
  );
$$;

create or replace function public.is_venue_owner(target_venue_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.venue_memberships vm
    where vm.venue_id = target_venue_id
      and vm.user_id = (select auth.uid())
      and vm.role = 'owner'
  );
$$;

create or replace function public.is_venue_client(target_venue_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.clients c
    where c.venue_id = target_venue_id and c.user_id = (select auth.uid())
  );
$$;

create or replace function public.can_access_venue(target_venue_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_platform_admin()
      or public.is_venue_member(target_venue_id)
      or public.is_venue_client(target_venue_id);
$$;

create or replace function public.can_access_event(target_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.events e
    left join public.clients c on c.id = e.client_id
    where e.id = target_event_id
      and (
        public.is_platform_admin()
        or public.is_venue_member(e.venue_id)
        or c.user_id = (select auth.uid())
      )
  );
$$;

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.venues enable row level security;
alter table public.venue_memberships enable row level security;
alter table public.clients enable row level security;
alter table public.venue_packages enable row level security;
alter table public.venue_spaces enable row level security;
alter table public.inventory_items enable row level security;
alter table public.events enable row level security;
alter table public.event_selections enable row level security;
alter table public.layouts enable row level security;
alter table public.layout_items enable row level security;
alter table public.messages enable row level security;
alter table public.message_reads enable row level security;
alter table public.media_assets enable row level security;
alter table public.venue_invitations enable row level security;

-- Remove broad defaults, then grant only operations the browser app needs.
revoke all on all tables in schema public from anon, authenticated;
grant select on public.venues, public.venue_packages, public.venue_spaces, public.inventory_items to anon;
grant select, insert, update, delete on public.profiles, public.venues, public.venue_memberships, public.clients, public.venue_packages, public.venue_spaces, public.inventory_items, public.events, public.event_selections, public.layouts, public.layout_items, public.messages, public.message_reads, public.media_assets to authenticated;
grant select, insert, update, delete on public.venue_invitations to authenticated;

-- Profiles
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
using ((select auth.uid()) = id or public.is_platform_admin());
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
using ((select auth.uid()) = id or public.is_platform_admin())
with check ((select auth.uid()) = id or public.is_platform_admin());

-- Venues: published rows are public; owners/admins manage.
drop policy if exists venues_public_select on public.venues;
create policy venues_public_select on public.venues for select to anon
using (is_published = true);
drop policy if exists venues_authenticated_select on public.venues;
create policy venues_authenticated_select on public.venues for select to authenticated
using (is_published = true or public.can_access_venue(id));
drop policy if exists venues_insert on public.venues;
create policy venues_insert on public.venues for insert to authenticated
with check (public.is_platform_admin());
drop policy if exists venues_update on public.venues;
create policy venues_update on public.venues for update to authenticated
using (public.is_platform_admin() or public.is_venue_owner(id))
with check (public.is_platform_admin() or public.is_venue_owner(id));
drop policy if exists venues_delete on public.venues;
create policy venues_delete on public.venues for delete to authenticated
using (public.is_platform_admin());

-- Memberships
drop policy if exists memberships_select on public.venue_memberships;
create policy memberships_select on public.venue_memberships for select to authenticated
using (user_id = (select auth.uid()) or public.is_platform_admin() or public.is_venue_owner(venue_id));
drop policy if exists memberships_insert on public.venue_memberships;
create policy memberships_insert on public.venue_memberships for insert to authenticated
with check (public.is_platform_admin() or public.is_venue_owner(venue_id));
drop policy if exists memberships_update on public.venue_memberships;
create policy memberships_update on public.venue_memberships for update to authenticated
using (public.is_platform_admin() or public.is_venue_owner(venue_id))
with check (public.is_platform_admin() or public.is_venue_owner(venue_id));
drop policy if exists memberships_delete on public.venue_memberships;
create policy memberships_delete on public.venue_memberships for delete to authenticated
using (public.is_platform_admin() or public.is_venue_owner(venue_id));

-- Clients
drop policy if exists clients_select on public.clients;
create policy clients_select on public.clients for select to authenticated
using (user_id = (select auth.uid()) or public.is_platform_admin() or public.is_venue_staff(venue_id));
drop policy if exists clients_insert on public.clients;
create policy clients_insert on public.clients for insert to authenticated
with check (public.is_platform_admin() or public.is_venue_staff(venue_id));
drop policy if exists clients_update on public.clients;
create policy clients_update on public.clients for update to authenticated
using (user_id = (select auth.uid()) or public.is_platform_admin() or public.is_venue_staff(venue_id))
with check (user_id = (select auth.uid()) or public.is_platform_admin() or public.is_venue_staff(venue_id));
drop policy if exists clients_delete on public.clients;
create policy clients_delete on public.clients for delete to authenticated
using (public.is_platform_admin() or public.is_venue_staff(venue_id));

-- Public venue resources
-- Anonymous users only see resources explicitly marked public for a published venue.
drop policy if exists packages_public_select on public.venue_packages;
create policy packages_public_select on public.venue_packages for select to anon
using (is_public and exists (select 1 from public.venues v where v.id = venue_id and v.is_published));
drop policy if exists packages_auth_select on public.venue_packages;
create policy packages_auth_select on public.venue_packages for select to authenticated
using ((is_public and exists (select 1 from public.venues v where v.id = venue_id and v.is_published)) or public.can_access_venue(venue_id));
drop policy if exists packages_insert on public.venue_packages;
create policy packages_insert on public.venue_packages for insert to authenticated with check (public.is_platform_admin() or public.is_venue_staff(venue_id));
drop policy if exists packages_update on public.venue_packages;
create policy packages_update on public.venue_packages for update to authenticated using (public.is_platform_admin() or public.is_venue_staff(venue_id)) with check (public.is_platform_admin() or public.is_venue_staff(venue_id));
drop policy if exists packages_delete on public.venue_packages;
create policy packages_delete on public.venue_packages for delete to authenticated using (public.is_platform_admin() or public.is_venue_staff(venue_id));

drop policy if exists spaces_public_select on public.venue_spaces;
create policy spaces_public_select on public.venue_spaces for select to anon
using (is_public and exists (select 1 from public.venues v where v.id = venue_id and v.is_published));
drop policy if exists spaces_auth_select on public.venue_spaces;
create policy spaces_auth_select on public.venue_spaces for select to authenticated
using ((is_public and exists (select 1 from public.venues v where v.id = venue_id and v.is_published)) or public.can_access_venue(venue_id));
drop policy if exists spaces_insert on public.venue_spaces;
create policy spaces_insert on public.venue_spaces for insert to authenticated with check (public.is_platform_admin() or public.is_venue_staff(venue_id));
drop policy if exists spaces_update on public.venue_spaces;
create policy spaces_update on public.venue_spaces for update to authenticated using (public.is_platform_admin() or public.is_venue_staff(venue_id)) with check (public.is_platform_admin() or public.is_venue_staff(venue_id));
drop policy if exists spaces_delete on public.venue_spaces;
create policy spaces_delete on public.venue_spaces for delete to authenticated using (public.is_platform_admin() or public.is_venue_staff(venue_id));

drop policy if exists inventory_public_select on public.inventory_items;
create policy inventory_public_select on public.inventory_items for select to anon
using (is_public and exists (select 1 from public.venues v where v.id = venue_id and v.is_published));
drop policy if exists inventory_auth_select on public.inventory_items;
create policy inventory_auth_select on public.inventory_items for select to authenticated
using ((is_public and exists (select 1 from public.venues v where v.id = venue_id and v.is_published)) or public.can_access_venue(venue_id));
drop policy if exists inventory_insert on public.inventory_items;
create policy inventory_insert on public.inventory_items for insert to authenticated with check (public.is_platform_admin() or public.is_venue_staff(venue_id));
drop policy if exists inventory_update on public.inventory_items;
create policy inventory_update on public.inventory_items for update to authenticated using (public.is_platform_admin() or public.is_venue_staff(venue_id)) with check (public.is_platform_admin() or public.is_venue_staff(venue_id));
drop policy if exists inventory_delete on public.inventory_items;
create policy inventory_delete on public.inventory_items for delete to authenticated using (public.is_platform_admin() or public.is_venue_staff(venue_id));

-- Events and event-scoped planning data
drop policy if exists events_select on public.events;
create policy events_select on public.events for select to authenticated using (public.can_access_event(id));
drop policy if exists events_insert on public.events;
create policy events_insert on public.events for insert to authenticated with check (public.is_platform_admin() or public.is_venue_staff(venue_id));
drop policy if exists events_update on public.events;
create policy events_update on public.events for update to authenticated using (public.is_platform_admin() or public.is_venue_staff(venue_id)) with check (public.is_platform_admin() or public.is_venue_staff(venue_id));
drop policy if exists events_delete on public.events;
create policy events_delete on public.events for delete to authenticated using (public.is_platform_admin() or public.is_venue_staff(venue_id));

drop policy if exists selections_select on public.event_selections;
create policy selections_select on public.event_selections for select to authenticated using (public.can_access_event(event_id));
drop policy if exists selections_insert on public.event_selections;
create policy selections_insert on public.event_selections for insert to authenticated with check (public.can_access_event(event_id));
drop policy if exists selections_update on public.event_selections;
create policy selections_update on public.event_selections for update to authenticated using (public.can_access_event(event_id)) with check (public.can_access_event(event_id));
drop policy if exists selections_delete on public.event_selections;
create policy selections_delete on public.event_selections for delete to authenticated using (public.can_access_event(event_id));

drop policy if exists layouts_select on public.layouts;
create policy layouts_select on public.layouts for select to authenticated using (public.can_access_event(event_id));
drop policy if exists layouts_insert on public.layouts;
create policy layouts_insert on public.layouts for insert to authenticated with check (public.can_access_event(event_id));
drop policy if exists layouts_update on public.layouts;
create policy layouts_update on public.layouts for update to authenticated using (public.can_access_event(event_id)) with check (public.can_access_event(event_id));
drop policy if exists layouts_delete on public.layouts;
create policy layouts_delete on public.layouts for delete to authenticated using (public.can_access_event(event_id));

drop policy if exists layout_items_select on public.layout_items;
create policy layout_items_select on public.layout_items for select to authenticated
using (exists (select 1 from public.layouts l where l.id = layout_id and public.can_access_event(l.event_id)));
drop policy if exists layout_items_insert on public.layout_items;
create policy layout_items_insert on public.layout_items for insert to authenticated
with check (exists (select 1 from public.layouts l where l.id = layout_id and public.can_access_event(l.event_id)));
drop policy if exists layout_items_update on public.layout_items;
create policy layout_items_update on public.layout_items for update to authenticated
using (exists (select 1 from public.layouts l where l.id = layout_id and public.can_access_event(l.event_id)))
with check (exists (select 1 from public.layouts l where l.id = layout_id and public.can_access_event(l.event_id)));
drop policy if exists layout_items_delete on public.layout_items;
create policy layout_items_delete on public.layout_items for delete to authenticated
using (exists (select 1 from public.layouts l where l.id = layout_id and public.can_access_event(l.event_id)));

-- Messages
drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages for select to authenticated using (public.can_access_event(event_id));
drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages for insert to authenticated
with check (public.can_access_event(event_id) and (sender_user_id is null or sender_user_id = (select auth.uid()) or public.is_platform_admin()));
drop policy if exists messages_update on public.messages;
create policy messages_update on public.messages for update to authenticated
using (sender_user_id = (select auth.uid()) or exists (select 1 from public.events e where e.id = event_id and public.is_venue_staff(e.venue_id)) or public.is_platform_admin())
with check (sender_user_id = (select auth.uid()) or exists (select 1 from public.events e where e.id = event_id and public.is_venue_staff(e.venue_id)) or public.is_platform_admin());
drop policy if exists messages_delete on public.messages;
create policy messages_delete on public.messages for delete to authenticated
using (sender_user_id = (select auth.uid()) or exists (select 1 from public.events e where e.id = event_id and public.is_venue_staff(e.venue_id)) or public.is_platform_admin());

drop policy if exists message_reads_select on public.message_reads;
create policy message_reads_select on public.message_reads for select to authenticated
using (user_id = (select auth.uid()) or exists (select 1 from public.messages m where m.id = message_id and public.can_access_event(m.event_id)));
drop policy if exists message_reads_insert on public.message_reads;
create policy message_reads_insert on public.message_reads for insert to authenticated
with check (user_id = (select auth.uid()) and exists (select 1 from public.messages m where m.id = message_id and public.can_access_event(m.event_id)));
drop policy if exists message_reads_update on public.message_reads;
create policy message_reads_update on public.message_reads for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists message_reads_delete on public.message_reads;
create policy message_reads_delete on public.message_reads for delete to authenticated using (user_id = (select auth.uid()));

-- Media metadata. Object bytes are protected separately by Storage policies below.
drop policy if exists media_select on public.media_assets;
create policy media_select on public.media_assets for select to authenticated
using ((event_id is not null and public.can_access_event(event_id)) or (event_id is null and public.can_access_venue(venue_id)));
drop policy if exists media_insert on public.media_assets;
create policy media_insert on public.media_assets for insert to authenticated
with check (((event_id is not null and public.can_access_event(event_id)) or (event_id is null and (public.is_platform_admin() or public.is_venue_staff(venue_id)))) and uploaded_by = (select auth.uid()));
drop policy if exists media_update on public.media_assets;
create policy media_update on public.media_assets for update to authenticated
using (uploaded_by = (select auth.uid()) or public.is_platform_admin() or public.is_venue_staff(venue_id))
with check (uploaded_by = (select auth.uid()) or public.is_platform_admin() or public.is_venue_staff(venue_id));
drop policy if exists media_delete on public.media_assets;
create policy media_delete on public.media_assets for delete to authenticated
using (uploaded_by = (select auth.uid()) or public.is_platform_admin() or public.is_venue_staff(venue_id));

-- Invitations should be created/read by venue owners or platform admins. Token redemption should happen server-side.
drop policy if exists invitations_select on public.venue_invitations;
create policy invitations_select on public.venue_invitations for select to authenticated using (public.is_platform_admin() or public.is_venue_owner(venue_id));
drop policy if exists invitations_insert on public.venue_invitations;
create policy invitations_insert on public.venue_invitations for insert to authenticated with check (public.is_platform_admin() or public.is_venue_owner(venue_id));
drop policy if exists invitations_update on public.venue_invitations;
create policy invitations_update on public.venue_invitations for update to authenticated using (public.is_platform_admin() or public.is_venue_owner(venue_id)) with check (public.is_platform_admin() or public.is_venue_owner(venue_id));
drop policy if exists invitations_delete on public.venue_invitations;
create policy invitations_delete on public.venue_invitations for delete to authenticated using (public.is_platform_admin() or public.is_venue_owner(venue_id));

-- ---------- Private Storage bucket ----------
insert into storage.buckets (id, name, public, file_size_limit)
values ('venue-assets', 'venue-assets', false, 52428800)
on conflict (id) do nothing;

-- Required storage path format:
-- venues/<venue-uuid>/shared/<file>
-- venues/<venue-uuid>/events/<event-uuid>/<file>
create or replace function public.try_uuid(value text)
returns uuid
language plpgsql
immutable
as $$
begin
  return value::uuid;
exception when others then
  return null;
end;
$$;

create or replace function public.storage_venue_id(object_name text)
returns uuid
language sql
immutable
as $$
  select case when (storage.foldername(object_name))[1] = 'venues'
    then public.try_uuid((storage.foldername(object_name))[2])
    else null end;
$$;

create or replace function public.storage_event_id(object_name text)
returns uuid
language sql
immutable
as $$
  select case when (storage.foldername(object_name))[3] = 'events'
    then public.try_uuid((storage.foldername(object_name))[4])
    else null end;
$$;

drop policy if exists venue_assets_select on storage.objects;
create policy venue_assets_select on storage.objects for select to authenticated
using (
  bucket_id = 'venue-assets'
  and (
    public.is_platform_admin()
    or public.is_venue_staff(public.storage_venue_id(name))
    or (
      public.storage_event_id(name) is not null
      and public.can_access_event(public.storage_event_id(name))
    )
    or (
      (storage.foldername(name))[3] = 'shared'
      and public.can_access_venue(public.storage_venue_id(name))
    )
  )
);

drop policy if exists venue_assets_insert on storage.objects;
create policy venue_assets_insert on storage.objects for insert to authenticated
with check (
  bucket_id = 'venue-assets'
  and owner_id = (select auth.uid()::text)
  and (
    public.is_platform_admin()
    or public.is_venue_staff(public.storage_venue_id(name))
    or (
      public.storage_event_id(name) is not null
      and public.can_access_event(public.storage_event_id(name))
    )
  )
);

drop policy if exists venue_assets_update on storage.objects;
create policy venue_assets_update on storage.objects for update to authenticated
using (
  bucket_id = 'venue-assets'
  and (owner_id = (select auth.uid()::text) or public.is_platform_admin() or public.is_venue_staff(public.storage_venue_id(name)))
)
with check (
  bucket_id = 'venue-assets'
  and (owner_id = (select auth.uid()::text) or public.is_platform_admin() or public.is_venue_staff(public.storage_venue_id(name)))
);

drop policy if exists venue_assets_delete on storage.objects;
create policy venue_assets_delete on storage.objects for delete to authenticated
using (
  bucket_id = 'venue-assets'
  and (owner_id = (select auth.uid()::text) or public.is_platform_admin() or public.is_venue_staff(public.storage_venue_id(name)))
);

-- The service_role remains server-only and bypasses RLS. Never expose it in the browser.
