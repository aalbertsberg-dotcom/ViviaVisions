-- ViviaVisions v1.10 - real client authentication
-- Adds multi-user client access so both partners/contacts can have their own login.

create table if not exists public.client_users (
  client_id uuid not null references public.clients(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (client_id, user_id)
);

insert into public.client_users (client_id, user_id)
select id, user_id
from public.clients
where user_id is not null
on conflict do nothing;

create index if not exists client_users_user_idx on public.client_users(user_id);

alter table public.client_users enable row level security;

revoke all on public.client_users from anon, authenticated;
grant select on public.client_users to authenticated;

create or replace function public.is_client_user(target_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.client_users cu
    where cu.client_id = target_client_id
      and cu.user_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.clients c
    where c.id = target_client_id
      and c.user_id = (select auth.uid())
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
    select 1
    from public.clients c
    where c.venue_id = target_venue_id
      and public.is_client_user(c.id)
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
    where e.id = target_event_id
      and (
        public.is_platform_admin()
        or public.is_venue_member(e.venue_id)
        or public.is_client_user(e.client_id)
      )
  );
$$;

drop policy if exists client_users_select on public.client_users;
create policy client_users_select on public.client_users
for select to authenticated
using (
  user_id = (select auth.uid())
  or public.is_platform_admin()
);

drop policy if exists clients_select on public.clients;
create policy clients_select on public.clients
for select to authenticated
using (
  public.is_client_user(id)
  or public.is_platform_admin()
  or public.is_venue_staff(venue_id)
);

drop policy if exists clients_update on public.clients;
create policy clients_update on public.clients
for update to authenticated
using (public.is_platform_admin() or public.is_venue_staff(venue_id))
with check (public.is_platform_admin() or public.is_venue_staff(venue_id));

create or replace function public.claim_client_event_access(
  target_venue_slug text,
  target_access_slug text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text;
  confirmed_at timestamptz;
  target_event_id uuid;
  target_client_id uuid;
  primary_email text;
  secondary_email text;
begin
  if current_user_id is null then
    raise exception 'Sign in before opening this client portal.';
  end if;

  select lower(u.email), u.email_confirmed_at
  into current_email, confirmed_at
  from auth.users u
  where u.id = current_user_id;

  if current_email is null or confirmed_at is null then
    raise exception 'Confirm your email address before opening this client portal.';
  end if;

  select e.id, c.id, lower(c.primary_email), lower(c.secondary_email)
  into target_event_id, target_client_id, primary_email, secondary_email
  from public.events e
  join public.venues v on v.id = e.venue_id
  join public.clients c on c.id = e.client_id
  where v.slug = target_venue_slug
    and e.access_slug = target_access_slug
    and e.status <> 'cancelled'
    and coalesce(e.metadata ->> 'soft_deleted_at', '') = ''
  limit 1;

  if target_event_id is null
     or current_email not in (coalesce(primary_email, ''), coalesce(secondary_email, '')) then
    raise exception 'This signed-in email does not have access to this event.';
  end if;

  insert into public.client_users (client_id, user_id)
  values (target_client_id, current_user_id)
  on conflict do nothing;

  -- Keep the original one-user column populated for backward compatibility.
  update public.clients
  set user_id = coalesce(user_id, current_user_id)
  where id = target_client_id;

  return target_event_id;
end;
$$;

create or replace function public.mark_event_designing(target_event_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.can_access_event(target_event_id) then
    raise exception 'You do not have access to this event.';
  end if;

  update public.events
  set status = 'designing'
  where id = target_event_id
    and status in ('not_started', 'designing');
end;
$$;

create or replace function public.update_client_event_planning(
  target_event_id uuid,
  target_guest_count integer,
  target_ceremony_space_id uuid,
  target_reception_space_id uuid,
  target_notes text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_client_id uuid;
  target_venue_id uuid;
begin
  select e.client_id, e.venue_id
  into target_client_id, target_venue_id
  from public.events e
  where e.id = target_event_id;

  if target_client_id is null or not public.is_client_user(target_client_id) then
    raise exception 'You do not have client access to this event.';
  end if;

  if target_ceremony_space_id is not null
     and not exists (
       select 1 from public.venue_spaces s
       where s.id = target_ceremony_space_id and s.venue_id = target_venue_id
     ) then
    raise exception 'Invalid ceremony space.';
  end if;

  if target_reception_space_id is not null
     and not exists (
       select 1 from public.venue_spaces s
       where s.id = target_reception_space_id and s.venue_id = target_venue_id
     ) then
    raise exception 'Invalid reception space.';
  end if;

  update public.events
  set guest_count = greatest(1, coalesce(target_guest_count, 1)),
      ceremony_space_id = target_ceremony_space_id,
      reception_space_id = target_reception_space_id,
      notes = coalesce(target_notes, ''),
      status = case when status = 'not_started' then 'designing' else status end
  where id = target_event_id;
end;
$$;

create or replace function public.mark_client_messages_read(target_event_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_client_id uuid;
begin
  select e.client_id
  into target_client_id
  from public.events e
  where e.id = target_event_id;

  if target_client_id is null or not public.is_client_user(target_client_id) then
    raise exception 'You do not have client access to this event.';
  end if;

  update public.messages
  set metadata = jsonb_set(
    coalesce(metadata, '{}'::jsonb),
    '{read_by_bride}',
    'true'::jsonb,
    true
  )
  where event_id = target_event_id
    and sender_role = 'venue';
end;
$$;

revoke all on function public.claim_client_event_access(text, text) from public;
revoke all on function public.mark_event_designing(uuid) from public;
revoke all on function public.update_client_event_planning(uuid, integer, uuid, uuid, text) from public;
revoke all on function public.mark_client_messages_read(uuid) from public;

grant execute on function public.claim_client_event_access(text, text) to authenticated;
grant execute on function public.mark_event_designing(uuid) to authenticated;
grant execute on function public.update_client_event_planning(uuid, integer, uuid, uuid, text) to authenticated;
grant execute on function public.mark_client_messages_read(uuid) to authenticated;