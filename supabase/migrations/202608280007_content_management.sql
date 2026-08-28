-- ViviaVisions v1.13 content management
-- Adds a public inventory-photo bucket while preserving the existing private venue/event media bucket.

insert into storage.buckets (id, name, public, file_size_limit)
values ('inventory-public', 'inventory-public', true, 20971520)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

-- Public inventory images are intentionally readable by anyone because they can appear
-- in the public venue catalog. Upload/update/delete remains limited to venue staff or VV admins.
-- Required path: venues/<venue-uuid>/inventory/<inventory-uuid>/<file>

drop policy if exists inventory_public_insert on storage.objects;
create policy inventory_public_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'inventory-public'
  and owner_id = (select auth.uid()::text)
  and (
    public.is_platform_admin()
    or public.is_venue_staff(public.storage_venue_id(name))
  )
);

drop policy if exists inventory_public_update on storage.objects;
create policy inventory_public_update on storage.objects
for update to authenticated
using (
  bucket_id = 'inventory-public'
  and (
    owner_id = (select auth.uid()::text)
    or public.is_platform_admin()
    or public.is_venue_staff(public.storage_venue_id(name))
  )
)
with check (
  bucket_id = 'inventory-public'
  and (
    owner_id = (select auth.uid()::text)
    or public.is_platform_admin()
    or public.is_venue_staff(public.storage_venue_id(name))
  )
);

drop policy if exists inventory_public_delete on storage.objects;
create policy inventory_public_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'inventory-public'
  and (
    owner_id = (select auth.uid()::text)
    or public.is_platform_admin()
    or public.is_venue_staff(public.storage_venue_id(name))
  )
);

-- Re-assert the existing private media bucket size so this migration is safe to run
-- against environments created from older copies of the initial migration.
insert into storage.buckets (id, name, public, file_size_limit)
values ('venue-assets', 'venue-assets', false, 52428800)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit;