-- ViviaVisions v1.15 production security hardening.
-- Adds cross-tenant integrity guards, RLS self-test snapshots and a platform-wide audit.
-- No customer/event rows are deleted or rewritten by this migration.

begin;

-- ---------- Identity privilege guard ----------
-- A normal user may edit their own profile fields, but may never promote
-- themselves to platform admin by changing profiles.platform_role.

create or replace function public.guard_profile_platform_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.platform_role is distinct from old.platform_role
     and not public.is_platform_admin() then
    raise exception 'Only a platform administrator may change platform roles.';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_profile_platform_role on public.profiles;
create trigger guard_profile_platform_role
before update of platform_role on public.profiles
for each row execute procedure public.guard_profile_platform_role();

-- ---------- Cross-tenant relationship guards ----------

create or replace function public.guard_event_tenant_refs()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.client_id is not null and not exists (
    select 1 from public.clients c
    where c.id = new.client_id and c.venue_id = new.venue_id
  ) then
    raise exception 'Event client must belong to the same venue.';
  end if;

  if new.package_id is not null and not exists (
    select 1 from public.venue_packages p
    where p.id = new.package_id and p.venue_id = new.venue_id
  ) then
    raise exception 'Event package must belong to the same venue.';
  end if;

  if new.ceremony_space_id is not null and not exists (
    select 1 from public.venue_spaces s
    where s.id = new.ceremony_space_id and s.venue_id = new.venue_id
  ) then
    raise exception 'Ceremony space must belong to the same venue.';
  end if;

  if new.reception_space_id is not null and not exists (
    select 1 from public.venue_spaces s
    where s.id = new.reception_space_id and s.venue_id = new.venue_id
  ) then
    raise exception 'Reception space must belong to the same venue.';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_event_tenant_refs on public.events;
create trigger guard_event_tenant_refs
before insert or update of venue_id, client_id, package_id, ceremony_space_id, reception_space_id
on public.events
for each row execute procedure public.guard_event_tenant_refs();

create or replace function public.guard_selection_tenant_refs()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.events e
    join public.inventory_items i on i.id = new.inventory_item_id
    where e.id = new.event_id
      and e.venue_id = i.venue_id
  ) then
    raise exception 'Selected inventory must belong to the event venue.';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_selection_tenant_refs on public.event_selections;
create trigger guard_selection_tenant_refs
before insert or update of event_id, inventory_item_id
on public.event_selections
for each row execute procedure public.guard_selection_tenant_refs();

create or replace function public.guard_layout_tenant_refs()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.venue_space_id is not null and not exists (
    select 1
    from public.events e
    join public.venue_spaces s on s.id = new.venue_space_id
    where e.id = new.event_id
      and e.venue_id = s.venue_id
  ) then
    raise exception 'Layout space must belong to the event venue.';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_layout_tenant_refs on public.layouts;
create trigger guard_layout_tenant_refs
before insert or update of event_id, venue_space_id
on public.layouts
for each row execute procedure public.guard_layout_tenant_refs();

create or replace function public.guard_layout_item_tenant_refs()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_venue_id uuid;
begin
  select e.venue_id
  into target_venue_id
  from public.layouts l
  join public.events e on e.id = l.event_id
  where l.id = new.layout_id;

  if target_venue_id is null then
    raise exception 'Layout item must reference a valid layout.';
  end if;

  if new.inventory_item_id is not null and not exists (
    select 1 from public.inventory_items i
    where i.id = new.inventory_item_id
      and i.venue_id = target_venue_id
  ) then
    raise exception 'Layout inventory must belong to the event venue.';
  end if;

  if new.parent_item_id is not null and not exists (
    select 1 from public.layout_items parent
    where parent.id = new.parent_item_id
      and parent.layout_id = new.layout_id
  ) then
    raise exception 'Layout item parent must belong to the same layout.';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_layout_item_tenant_refs on public.layout_items;
create trigger guard_layout_item_tenant_refs
before insert or update of layout_id, inventory_item_id, parent_item_id
on public.layout_items
for each row execute procedure public.guard_layout_item_tenant_refs();

create or replace function public.guard_media_tenant_refs()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.event_id is not null and not exists (
    select 1 from public.events e
    where e.id = new.event_id
      and e.venue_id = new.venue_id
  ) then
    raise exception 'Media event must belong to the same venue.';
  end if;

  if new.venue_space_id is not null and not exists (
    select 1 from public.venue_spaces s
    where s.id = new.venue_space_id
      and s.venue_id = new.venue_id
  ) then
    raise exception 'Media space must belong to the same venue.';
  end if;

  if new.inventory_item_id is not null and not exists (
    select 1 from public.inventory_items i
    where i.id = new.inventory_item_id
      and i.venue_id = new.venue_id
  ) then
    raise exception 'Media inventory must belong to the same venue.';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_media_tenant_refs on public.media_assets;
create trigger guard_media_tenant_refs
before insert or update of venue_id, event_id, venue_space_id, inventory_item_id
on public.media_assets
for each row execute procedure public.guard_media_tenant_refs();

-- ---------- Defense-in-depth RLS for event-scoped cross references ----------

drop policy if exists selections_insert on public.event_selections;
create policy selections_insert on public.event_selections
for insert to authenticated
with check (
  public.can_access_event(event_id)
  and exists (
    select 1
    from public.events e
    join public.inventory_items i on i.id = inventory_item_id
    where e.id = event_id and e.venue_id = i.venue_id
  )
);

drop policy if exists selections_update on public.event_selections;
create policy selections_update on public.event_selections
for update to authenticated
using (public.can_access_event(event_id))
with check (
  public.can_access_event(event_id)
  and exists (
    select 1
    from public.events e
    join public.inventory_items i on i.id = inventory_item_id
    where e.id = event_id and e.venue_id = i.venue_id
  )
);

drop policy if exists layouts_insert on public.layouts;
create policy layouts_insert on public.layouts
for insert to authenticated
with check (
  public.can_access_event(event_id)
  and (
    venue_space_id is null
    or exists (
      select 1
      from public.events e
      join public.venue_spaces s on s.id = venue_space_id
      where e.id = event_id and e.venue_id = s.venue_id
    )
  )
);

drop policy if exists layouts_update on public.layouts;
create policy layouts_update on public.layouts
for update to authenticated
using (public.can_access_event(event_id))
with check (
  public.can_access_event(event_id)
  and (
    venue_space_id is null
    or exists (
      select 1
      from public.events e
      join public.venue_spaces s on s.id = venue_space_id
      where e.id = event_id and e.venue_id = s.venue_id
    )
  )
);

drop policy if exists layout_items_insert on public.layout_items;
create policy layout_items_insert on public.layout_items
for insert to authenticated
with check (
  exists (
    select 1
    from public.layouts l
    join public.events e on e.id = l.event_id
    where l.id = layout_id
      and public.can_access_event(e.id)
      and (
        inventory_item_id is null
        or exists (
          select 1 from public.inventory_items i
          where i.id = inventory_item_id and i.venue_id = e.venue_id
        )
      )
      and (
        parent_item_id is null
        or exists (
          select 1 from public.layout_items parent
          where parent.id = parent_item_id and parent.layout_id = layout_id
        )
      )
  )
);

drop policy if exists layout_items_update on public.layout_items;
create policy layout_items_update on public.layout_items
for update to authenticated
using (
  exists (
    select 1 from public.layouts l
    where l.id = layout_id and public.can_access_event(l.event_id)
  )
)
with check (
  exists (
    select 1
    from public.layouts l
    join public.events e on e.id = l.event_id
    where l.id = layout_id
      and public.can_access_event(e.id)
      and (
        inventory_item_id is null
        or exists (
          select 1 from public.inventory_items i
          where i.id = inventory_item_id and i.venue_id = e.venue_id
        )
      )
      and (
        parent_item_id is null
        or exists (
          select 1 from public.layout_items parent
          where parent.id = parent_item_id and parent.layout_id = layout_id
        )
      )
  )
);

-- Clients may create/update only messages that are explicitly their own
-- client messages. Venue staff/admins retain thread-management access.
drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages
for insert to authenticated
with check (
  public.can_access_event(event_id)
  and (
    public.is_platform_admin()
    or exists (
      select 1 from public.events e
      where e.id = event_id and public.is_venue_staff(e.venue_id)
    )
    or (
      sender_role = 'client'
      and sender_user_id = (select auth.uid())
      and exists (
        select 1 from public.events e
        where e.id = event_id and public.is_client_user(e.client_id)
      )
    )
  )
);

drop policy if exists messages_update on public.messages;
create policy messages_update on public.messages
for update to authenticated
using (
  sender_user_id = (select auth.uid())
  or public.is_platform_admin()
  or exists (
    select 1 from public.events e
    where e.id = event_id and public.is_venue_staff(e.venue_id)
  )
)
with check (
  public.is_platform_admin()
  or exists (
    select 1 from public.events e
    where e.id = event_id and public.is_venue_staff(e.venue_id)
  )
  or (
    sender_role = 'client'
    and sender_user_id = (select auth.uid())
    and exists (
      select 1 from public.events e
      where e.id = event_id and public.is_client_user(e.client_id)
    )
  )
);

drop policy if exists media_insert on public.media_assets;
create policy media_insert on public.media_assets
for insert to authenticated
with check (
  uploaded_by = (select auth.uid())
  and (
    (event_id is not null and public.can_access_event(event_id))
    or (event_id is null and (public.is_platform_admin() or public.is_venue_staff(venue_id)))
  )
  and (event_id is null or exists (
    select 1 from public.events e where e.id = event_id and e.venue_id = venue_id
  ))
  and (venue_space_id is null or exists (
    select 1 from public.venue_spaces s where s.id = venue_space_id and s.venue_id = venue_id
  ))
  and (inventory_item_id is null or exists (
    select 1 from public.inventory_items i where i.id = inventory_item_id and i.venue_id = venue_id
  ))
);

drop policy if exists media_update on public.media_assets;
create policy media_update on public.media_assets
for update to authenticated
using (
  uploaded_by = (select auth.uid())
  or public.is_platform_admin()
  or public.is_venue_staff(venue_id)
)
with check (
  (
    uploaded_by = (select auth.uid())
    or public.is_platform_admin()
    or public.is_venue_staff(venue_id)
  )
  and (
    (event_id is not null and public.can_access_event(event_id))
    or (event_id is null and (public.is_platform_admin() or public.is_venue_staff(venue_id)))
  )
  and (event_id is null or exists (
    select 1 from public.events e where e.id = event_id and e.venue_id = venue_id
  ))
  and (venue_space_id is null or exists (
    select 1 from public.venue_spaces s where s.id = venue_space_id and s.venue_id = venue_id
  ))
  and (inventory_item_id is null or exists (
    select 1 from public.inventory_items i where i.id = inventory_item_id and i.venue_id = venue_id
  ))
);

-- ---------- Storage access after role/access changes ----------
-- A revoked client must not retain update/delete rights merely because they
-- originally uploaded the object. Inventory images are staff/admin managed.

drop policy if exists venue_assets_update on storage.objects;
create policy venue_assets_update on storage.objects
for update to authenticated
using (
  bucket_id = 'venue-assets'
  and (
    public.is_platform_admin()
    or public.is_venue_staff(public.storage_venue_id(name))
    or (
      owner_id = (select auth.uid()::text)
      and public.storage_event_id(name) is not null
      and public.can_access_event(public.storage_event_id(name))
    )
  )
)
with check (
  bucket_id = 'venue-assets'
  and (
    public.is_platform_admin()
    or public.is_venue_staff(public.storage_venue_id(name))
    or (
      owner_id = (select auth.uid()::text)
      and public.storage_event_id(name) is not null
      and public.can_access_event(public.storage_event_id(name))
    )
  )
);

drop policy if exists venue_assets_delete on storage.objects;
create policy venue_assets_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'venue-assets'
  and (
    public.is_platform_admin()
    or public.is_venue_staff(public.storage_venue_id(name))
    or (
      owner_id = (select auth.uid()::text)
      and public.storage_event_id(name) is not null
      and public.can_access_event(public.storage_event_id(name))
    )
  )
);

drop policy if exists inventory_public_update on storage.objects;
create policy inventory_public_update on storage.objects
for update to authenticated
using (
  bucket_id = 'inventory-public'
  and (
    public.is_platform_admin()
    or public.is_venue_staff(public.storage_venue_id(name))
  )
)
with check (
  bucket_id = 'inventory-public'
  and (
    public.is_platform_admin()
    or public.is_venue_staff(public.storage_venue_id(name))
  )
);

drop policy if exists inventory_public_delete on storage.objects;
create policy inventory_public_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'inventory-public'
  and (
    public.is_platform_admin()
    or public.is_venue_staff(public.storage_venue_id(name))
  )
);

-- ---------- Current-session RLS regression checks ----------

create or replace function public.current_rls_access_snapshot()
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'venue_ids', coalesce((select jsonb_agg(v.id order by v.id) from public.venues v), '[]'::jsonb),
    'client_ids', coalesce((select jsonb_agg(c.id order by c.id) from public.clients c), '[]'::jsonb),
    'event_ids', coalesce((select jsonb_agg(e.id order by e.id) from public.events e), '[]'::jsonb),
    'message_count', (select count(*) from public.messages),
    'media_count', (select count(*) from public.media_assets)
  );
$$;

create or replace function public.expected_access_snapshot()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  role_name text := 'authenticated';
  result jsonb;
begin
  if current_user_id is null then
    raise exception 'Sign in before running an access check.';
  end if;

  if public.is_platform_admin() then
    role_name := 'platform_admin';
  elsif exists (
    select 1 from public.venue_memberships vm
    where vm.user_id = current_user_id and vm.role = 'owner'
  ) then
    role_name := 'venue_owner';
  elsif exists (
    select 1 from public.venue_memberships vm
    where vm.user_id = current_user_id and vm.role = 'staff'
  ) then
    role_name := 'venue_staff';
  elsif exists (
    select 1 from public.clients c
    where public.is_client_user(c.id)
  ) then
    role_name := 'client';
  end if;

  select jsonb_build_object(
    'role', role_name,
    'venue_ids', coalesce((
      select jsonb_agg(v.id order by v.id)
      from public.venues v
      where v.is_published
        or public.is_platform_admin()
        or public.is_venue_member(v.id)
        or public.is_venue_client(v.id)
    ), '[]'::jsonb),
    'client_ids', coalesce((
      select jsonb_agg(c.id order by c.id)
      from public.clients c
      where public.is_client_user(c.id)
        or public.is_platform_admin()
        or public.is_venue_staff(c.venue_id)
    ), '[]'::jsonb),
    'event_ids', coalesce((
      select jsonb_agg(e.id order by e.id)
      from public.events e
      where public.is_platform_admin()
        or public.is_venue_member(e.venue_id)
        or public.is_client_user(e.client_id)
    ), '[]'::jsonb),
    'message_count', (
      select count(*)
      from public.messages m
      where exists (
        select 1 from public.events e
        where e.id = m.event_id
          and (
            public.is_platform_admin()
            or public.is_venue_member(e.venue_id)
            or public.is_client_user(e.client_id)
          )
      )
    ),
    'media_count', (
      select count(*)
      from public.media_assets ma
      where (
        ma.event_id is not null
        and exists (
          select 1 from public.events e
          where e.id = ma.event_id
            and (
              public.is_platform_admin()
              or public.is_venue_member(e.venue_id)
              or public.is_client_user(e.client_id)
            )
        )
      )
      or (
        ma.event_id is null
        and (
          public.is_platform_admin()
          or public.is_venue_member(ma.venue_id)
          or public.is_venue_client(ma.venue_id)
        )
      )
    )
  )
  into result;

  return result;
end;
$$;

create or replace function public.permission_self_test()
returns table (
  check_name text,
  passed boolean,
  visible_count bigint,
  expected_count bigint,
  role_name text
)
language plpgsql
stable
set search_path = public
as $$
declare
  visible jsonb;
  expected jsonb;
  detected_role text;
begin
  visible := public.current_rls_access_snapshot();
  expected := public.expected_access_snapshot();
  detected_role := expected ->> 'role';

  return query
  select
    'Venues visible through RLS'::text,
    (visible -> 'venue_ids') = (expected -> 'venue_ids'),
    jsonb_array_length(visible -> 'venue_ids')::bigint,
    jsonb_array_length(expected -> 'venue_ids')::bigint,
    detected_role
  union all
  select
    'Clients visible through RLS',
    (visible -> 'client_ids') = (expected -> 'client_ids'),
    jsonb_array_length(visible -> 'client_ids')::bigint,
    jsonb_array_length(expected -> 'client_ids')::bigint,
    detected_role
  union all
  select
    'Events visible through RLS',
    (visible -> 'event_ids') = (expected -> 'event_ids'),
    jsonb_array_length(visible -> 'event_ids')::bigint,
    jsonb_array_length(expected -> 'event_ids')::bigint,
    detected_role
  union all
  select
    'Messages visible through RLS',
    (visible -> 'message_count') = (expected -> 'message_count'),
    (visible ->> 'message_count')::bigint,
    (expected ->> 'message_count')::bigint,
    detected_role
  union all
  select
    'Media visible through RLS',
    (visible -> 'media_count') = (expected -> 'media_count'),
    (visible ->> 'media_count')::bigint,
    (expected ->> 'media_count')::bigint,
    detected_role;
end;
$$;

revoke all on function public.current_rls_access_snapshot() from public;
revoke all on function public.expected_access_snapshot() from public;
revoke all on function public.permission_self_test() from public;
grant execute on function public.current_rls_access_snapshot() to authenticated;
grant execute on function public.expected_access_snapshot() to authenticated;
grant execute on function public.permission_self_test() to authenticated;

-- ---------- Platform-wide structural audit ----------

create or replace function public.production_security_audit()
returns table (
  check_name text,
  passed boolean,
  issue_count bigint,
  detail text
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Platform administrator access is required.';
  end if;

  return query
  with checks as (
    select
      'Events reference same-venue clients'::text as check_name,
      count(*)::bigint as issue_count,
      'No event may reference a client owned by another venue.'::text as detail
    from public.events e
    join public.clients c on c.id = e.client_id
    where c.venue_id <> e.venue_id

    union all

    select
      'Events reference same-venue packages',
      count(*)::bigint,
      'No event may reference a package owned by another venue.'
    from public.events e
    join public.venue_packages p on p.id = e.package_id
    where p.venue_id <> e.venue_id

    union all

    select
      'Events reference same-venue spaces',
      count(*)::bigint,
      'Ceremony and reception spaces must belong to the event venue.'
    from public.events e
    left join public.venue_spaces cs on cs.id = e.ceremony_space_id
    left join public.venue_spaces rs on rs.id = e.reception_space_id
    where (e.ceremony_space_id is not null and cs.venue_id <> e.venue_id)
       or (e.reception_space_id is not null and rs.venue_id <> e.venue_id)

    union all

    select
      'Selections use same-venue inventory',
      count(*)::bigint,
      'Event selections must use inventory from the event venue.'
    from public.event_selections es
    join public.events e on e.id = es.event_id
    join public.inventory_items i on i.id = es.inventory_item_id
    where i.venue_id <> e.venue_id

    union all

    select
      'Layouts use same-venue spaces',
      count(*)::bigint,
      'A layout space must belong to the layout event venue.'
    from public.layouts l
    join public.events e on e.id = l.event_id
    join public.venue_spaces s on s.id = l.venue_space_id
    where s.venue_id <> e.venue_id

    union all

    select
      'Layout items use same-venue inventory',
      count(*)::bigint,
      'Placed inventory must belong to the layout event venue.'
    from public.layout_items li
    join public.layouts l on l.id = li.layout_id
    join public.events e on e.id = l.event_id
    join public.inventory_items i on i.id = li.inventory_item_id
    where i.venue_id <> e.venue_id

    union all

    select
      'Layout parents stay in one layout',
      count(*)::bigint,
      'Linked layout objects may not point to parent objects in another layout.'
    from public.layout_items li
    join public.layout_items parent on parent.id = li.parent_item_id
    where parent.layout_id <> li.layout_id

    union all

    select
      'Media references stay in one venue',
      count(*)::bigint,
      'Event, space and inventory references on media must match media.venue_id.'
    from public.media_assets ma
    left join public.events e on e.id = ma.event_id
    left join public.venue_spaces s on s.id = ma.venue_space_id
    left join public.inventory_items i on i.id = ma.inventory_item_id
    where (ma.event_id is not null and e.venue_id <> ma.venue_id)
       or (ma.venue_space_id is not null and s.venue_id <> ma.venue_id)
       or (ma.inventory_item_id is not null and i.venue_id <> ma.venue_id)

    union all

    select
      'Revoked contacts have no active bridge link',
      count(*)::bigint,
      'A revoked email must not retain a client_users bridge for the same client.'
    from public.client_access_blocks b
    join auth.users u on lower(u.email) = b.email
    join public.client_users cu on cu.client_id = b.client_id and cu.user_id = u.id

    union all

    select
      'Platform role escalation guard is installed',
      count(*)::bigint,
      'profiles.platform_role must be protected by the production privilege trigger.'
    from (select 1) seed
    where not exists (
      select 1
      from pg_trigger t
      join pg_class c on c.oid = t.tgrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = 'profiles'
        and t.tgname = 'guard_profile_platform_role'
        and not t.tgisinternal
    )

    union all

    select
      'Critical tables have RLS enabled',
      count(*)::bigint,
      'Every private planning table must have PostgreSQL Row Level Security enabled.'
    from (
      values
        ('profiles'), ('venue_memberships'), ('clients'), ('events'),
        ('event_selections'), ('layouts'), ('layout_items'), ('messages'),
        ('message_reads'), ('media_assets'), ('client_users'),
        ('client_access_blocks'), ('email_delivery_log')
    ) required(table_name)
    left join pg_namespace n on n.nspname = 'public'
    left join pg_class c on c.relnamespace = n.oid and c.relname = required.table_name
    where c.oid is null or c.relrowsecurity is not true
  )
  select
    checks.check_name,
    checks.issue_count = 0,
    checks.issue_count,
    checks.detail
  from checks
  order by checks.check_name;
end;
$$;

revoke all on function public.production_security_audit() from public;
grant execute on function public.production_security_audit() to authenticated;

commit;
