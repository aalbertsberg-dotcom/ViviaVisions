-- ViviaVisions v1.10.3
-- Production safety guard: events cannot be hard-deleted unless they were
-- explicitly soft-deleted and have remained recoverable for at least 30 days.
-- This trigger protects the table even if a future app/service path bypasses RLS.

begin;

create or replace function public.protect_event_hard_delete()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  deleted_at timestamptz;
begin
  if coalesce(old.metadata ->> 'soft_deleted_at', '') = '' then
    raise exception 'Event hard delete blocked. Move the event to Trash first.';
  end if;

  begin
    deleted_at := (old.metadata ->> 'soft_deleted_at')::timestamptz;
  exception when others then
    raise exception 'Event hard delete blocked. soft_deleted_at is invalid.';
  end;

  if deleted_at > now() - interval '30 days' then
    raise exception 'Event hard delete blocked. The 30-day recovery period has not expired.';
  end if;

  return old;
end;
$$;

drop trigger if exists protect_event_hard_delete on public.events;

create trigger protect_event_hard_delete
before delete on public.events
for each row
execute function public.protect_event_hard_delete();

commit;