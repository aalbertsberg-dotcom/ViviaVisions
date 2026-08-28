-- ViviaVisions v1.9.0
-- Event retention safety: soft-deleted events must remain recoverable for 30 days
-- before the browser app is allowed to permanently delete them.

begin;

drop policy if exists events_delete on public.events;

create policy events_delete
on public.events
for delete
to authenticated
using (
  (public.is_platform_admin() or public.is_venue_staff(venue_id))
  and metadata ? 'soft_deleted_at'
  and nullif(metadata ->> 'soft_deleted_at', '') is not null
  and (metadata ->> 'soft_deleted_at')::timestamptz <= now() - interval '30 days'
);

commit;
