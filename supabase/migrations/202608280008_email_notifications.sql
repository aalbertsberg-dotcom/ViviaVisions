-- ViviaVisions v1.14 transactional email delivery log.
-- Resend API calls happen only in the send-event-email Edge Function.

create table if not exists public.email_delivery_log (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  event_id uuid references public.events(id) on delete cascade,
  email_type text not null check (email_type in ('client_invite', 'new_message')),
  recipient_email text not null,
  provider text not null default 'resend',
  provider_message_id text,
  dedupe_key text unique,
  status text not null default 'sending' check (status in ('sending', 'sent', 'failed', 'skipped')),
  error_message text,
  requested_by uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists email_delivery_log_venue_idx
  on public.email_delivery_log(venue_id, created_at desc);

create index if not exists email_delivery_log_event_idx
  on public.email_delivery_log(event_id, created_at desc);

create index if not exists email_delivery_log_recipient_idx
  on public.email_delivery_log(lower(recipient_email), created_at desc);

drop trigger if exists set_email_delivery_log_updated_at on public.email_delivery_log;
create trigger set_email_delivery_log_updated_at
before update on public.email_delivery_log
for each row execute procedure public.set_updated_at();

alter table public.email_delivery_log enable row level security;

revoke all on public.email_delivery_log from anon, authenticated;
grant select on public.email_delivery_log to authenticated;

drop policy if exists email_delivery_log_select on public.email_delivery_log;
create policy email_delivery_log_select
on public.email_delivery_log
for select
to authenticated
using (
  public.is_platform_admin()
  or public.is_venue_staff(venue_id)
);

comment on table public.email_delivery_log is
  'Server-side Resend delivery history for ViviaVisions invitations and message notifications. Browser users may only read logs for venues they administer.';