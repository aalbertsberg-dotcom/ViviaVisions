-- ViviaVisions v1.11.1
-- Generic secure client portal.
-- A confirmed authenticated email can discover only its own active events
-- at the selected venue. Revoked contacts remain blocked.

begin;

create or replace function public.claim_my_client_events(target_venue_slug text)
returns table (
  event_id uuid,
  access_slug text,
  title text,
  event_date date
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text;
  confirmed_at timestamptz;
begin
  if current_user_id is null then
    raise exception 'Sign in before opening the client portal.';
  end if;

  select lower(u.email), u.email_confirmed_at
  into current_email, confirmed_at
  from auth.users u
  where u.id = current_user_id;

  if current_email is null or confirmed_at is null then
    raise exception 'Confirm your email address before opening the client portal.';
  end if;

  insert into public.client_users (client_id, user_id)
  select distinct c.id, current_user_id
  from public.clients c
  join public.venues v on v.id = c.venue_id
  join public.events e on e.client_id = c.id
  where v.slug = target_venue_slug
    and (
      lower(trim(coalesce(c.primary_email, ''))) = current_email
      or lower(trim(coalesce(c.secondary_email, ''))) = current_email
    )
    and e.status <> 'cancelled'
    and coalesce(e.metadata ->> 'soft_deleted_at', '') = ''
    and not exists (
      select 1
      from public.client_access_blocks b
      where b.client_id = c.id
        and b.email = current_email
    )
  on conflict do nothing;

  update public.clients c
  set user_id = coalesce(c.user_id, current_user_id)
  from public.venues v
  where v.id = c.venue_id
    and v.slug = target_venue_slug
    and (
      lower(trim(coalesce(c.primary_email, ''))) = current_email
      or lower(trim(coalesce(c.secondary_email, ''))) = current_email
    )
    and exists (
      select 1
      from public.events e
      where e.client_id = c.id
        and e.status <> 'cancelled'
        and coalesce(e.metadata ->> 'soft_deleted_at', '') = ''
    )
    and not exists (
      select 1
      from public.client_access_blocks b
      where b.client_id = c.id
        and b.email = current_email
    );

  return query
  select distinct
    e.id,
    e.access_slug,
    e.title,
    e.event_date
  from public.events e
  join public.clients c on c.id = e.client_id
  join public.venues v on v.id = e.venue_id
  where v.slug = target_venue_slug
    and (
      lower(trim(coalesce(c.primary_email, ''))) = current_email
      or lower(trim(coalesce(c.secondary_email, ''))) = current_email
    )
    and e.status <> 'cancelled'
    and coalesce(e.metadata ->> 'soft_deleted_at', '') = ''
    and not exists (
      select 1
      from public.client_access_blocks b
      where b.client_id = c.id
        and b.email = current_email
    )
  order by e.event_date, e.id;
end;
$$;

revoke all on function public.claim_my_client_events(text) from public;
grant execute on function public.claim_my_client_events(text) to authenticated;

commit;