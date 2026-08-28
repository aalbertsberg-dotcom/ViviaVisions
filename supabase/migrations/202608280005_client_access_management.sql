-- ViviaVisions v1.11
-- Client account management:
--   * owner/admin visibility into primary + partner account status
--   * durable revoke/restore controls
--   * revoked contacts cannot simply sign back in and reclaim access

begin;

create table if not exists public.client_access_blocks (
  client_id uuid not null references public.clients(id) on delete cascade,
  email text not null,
  blocked_at timestamptz not null default now(),
  blocked_by uuid references auth.users(id) on delete set null,
  primary key (client_id, email),
  check (email = lower(email))
);

create index if not exists client_access_blocks_email_idx
on public.client_access_blocks(email);

alter table public.client_access_blocks enable row level security;

revoke all on public.client_access_blocks from anon, authenticated;

create or replace function public.is_client_user(target_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (
    exists (
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
    )
  )
  and not exists (
    select 1
    from public.client_access_blocks b
    join auth.users u on u.id = (select auth.uid())
    where b.client_id = target_client_id
      and b.email = lower(u.email)
  );
$$;

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

  if exists (
    select 1
    from public.client_access_blocks b
    where b.client_id = target_client_id
      and b.email = current_email
  ) then
    raise exception 'Access to this client portal has been revoked by the venue.';
  end if;

  insert into public.client_users (client_id, user_id)
  values (target_client_id, current_user_id)
  on conflict do nothing;

  update public.clients
  set user_id = coalesce(user_id, current_user_id)
  where id = target_client_id;

  return target_event_id;
end;
$$;

create or replace function public.event_client_access_status(target_event_id uuid)
returns table (
  contact_type text,
  email text,
  account_exists boolean,
  email_confirmed boolean,
  access_granted boolean,
  revoked boolean
)
language plpgsql
stable
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

  if target_client_id is null then
    raise exception 'The event or client record was not found.';
  end if;

  if not (public.is_platform_admin() or public.is_venue_staff(target_venue_id)) then
    raise exception 'You do not have permission to view client account access.';
  end if;

  return query
  with contacts as (
    select
      c.id as client_id,
      'primary'::text as contact_type,
      nullif(lower(trim(c.primary_email)), '') as email
    from public.clients c
    where c.id = target_client_id

    union all

    select
      c.id as client_id,
      'partner'::text as contact_type,
      nullif(lower(trim(c.secondary_email)), '') as email
    from public.clients c
    where c.id = target_client_id
  ),
  resolved as (
    select
      ct.client_id,
      ct.contact_type,
      ct.email,
      u.id as user_id,
      u.email_confirmed_at
    from contacts ct
    left join lateral (
      select au.id, au.email_confirmed_at
      from auth.users au
      where lower(au.email) = ct.email
      order by au.created_at
      limit 1
    ) u on true
    where ct.email is not null
  )
  select
    r.contact_type,
    r.email,
    (r.user_id is not null) as account_exists,
    (r.email_confirmed_at is not null) as email_confirmed,
    (
      r.user_id is not null
      and (
        exists (
          select 1
          from public.client_users cu
          where cu.client_id = r.client_id
            and cu.user_id = r.user_id
        )
        or exists (
          select 1
          from public.clients c
          where c.id = r.client_id
            and c.user_id = r.user_id
        )
      )
      and not exists (
        select 1
        from public.client_access_blocks b
        where b.client_id = r.client_id
          and b.email = r.email
      )
    ) as access_granted,
    exists (
      select 1
      from public.client_access_blocks b
      where b.client_id = r.client_id
        and b.email = r.email
    ) as revoked
  from resolved r
  order by case r.contact_type when 'primary' then 0 else 1 end;
end;
$$;

create or replace function public.set_event_client_access(
  target_event_id uuid,
  target_email text,
  target_allowed boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_client_id uuid;
  target_venue_id uuid;
  primary_email text;
  secondary_email text;
  clean_email text := lower(trim(coalesce(target_email, '')));
  target_user_id uuid;
begin
  select
    e.client_id,
    e.venue_id,
    lower(trim(c.primary_email)),
    lower(trim(c.secondary_email))
  into
    target_client_id,
    target_venue_id,
    primary_email,
    secondary_email
  from public.events e
  join public.clients c on c.id = e.client_id
  where e.id = target_event_id;

  if target_client_id is null then
    raise exception 'The event or client record was not found.';
  end if;

  if not (public.is_platform_admin() or public.is_venue_staff(target_venue_id)) then
    raise exception 'You do not have permission to change client account access.';
  end if;

  if clean_email = ''
     or clean_email not in (coalesce(primary_email, ''), coalesce(secondary_email, '')) then
    raise exception 'That email is not assigned to this event.';
  end if;

  select u.id
  into target_user_id
  from auth.users u
  where lower(u.email) = clean_email
  order by u.created_at
  limit 1;

  if target_allowed then
    delete from public.client_access_blocks
    where client_id = target_client_id
      and email = clean_email;

    if target_user_id is not null then
      insert into public.client_users (client_id, user_id)
      values (target_client_id, target_user_id)
      on conflict do nothing;

      update public.clients
      set user_id = coalesce(user_id, target_user_id)
      where id = target_client_id;
    end if;
  else
    insert into public.client_access_blocks (client_id, email, blocked_at, blocked_by)
    values (target_client_id, clean_email, now(), auth.uid())
    on conflict (client_id, email)
    do update set
      blocked_at = excluded.blocked_at,
      blocked_by = excluded.blocked_by;

    if target_user_id is not null then
      delete from public.client_users
      where client_id = target_client_id
        and user_id = target_user_id;

      update public.clients
      set user_id = null
      where id = target_client_id
        and user_id = target_user_id;
    end if;
  end if;
end;
$$;

revoke all on function public.claim_client_event_access(text, text) from public;
revoke all on function public.event_client_access_status(uuid) from public;
revoke all on function public.set_event_client_access(uuid, text, boolean) from public;

grant execute on function public.claim_client_event_access(text, text) to authenticated;
grant execute on function public.event_client_access_status(uuid) to authenticated;
grant execute on function public.set_event_client_access(uuid, text, boolean) to authenticated;

commit;