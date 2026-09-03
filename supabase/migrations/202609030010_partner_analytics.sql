begin;

create table if not exists public.analytics_events (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  session_id text not null,
  event_type text not null check (event_type in ('page_view','vendor_impression','vendor_click')),
  route text not null default '',
  venue_slug text,
  vendor_key text
);

create index if not exists analytics_events_time_idx on public.analytics_events (occurred_at desc);
create index if not exists analytics_events_type_idx on public.analytics_events (event_type, occurred_at desc);
create index if not exists analytics_events_vendor_idx on public.analytics_events (vendor_key, occurred_at desc) where vendor_key is not null;

alter table public.analytics_events enable row level security;
revoke all on table public.analytics_events from public, anon, authenticated;

create or replace function public.track_analytics_event(
  p_event_type text,
  p_session_id text,
  p_route text default '',
  p_venue_slug text default null,
  p_vendor_key text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_event_type not in ('page_view','vendor_impression','vendor_click') then return; end if;
  if coalesce(char_length(trim(p_session_id)),0)=0 then return; end if;

  insert into public.analytics_events(session_id,event_type,route,venue_slug,vendor_key)
  values(
    left(trim(p_session_id),120),
    p_event_type,
    left(coalesce(p_route,''),500),
    nullif(left(trim(coalesce(p_venue_slug,'')),120),''),
    nullif(left(trim(coalesce(p_vendor_key,'')),160),'')
  );
end;
$$;

revoke all on function public.track_analytics_event(text,text,text,text,text) from public;
grant execute on function public.track_analytics_event(text,text,text,text,text) to anon, authenticated;

create or replace function public.analytics_overview(p_days integer default 30)
returns table(page_views bigint,sessions bigint,vendor_impressions bigint,vendor_clicks bigint,click_through_rate numeric)
language plpgsql security definer set search_path=public
as $$
declare d integer := greatest(1,least(coalesce(p_days,30),365));
begin
  if coalesce(public.is_platform_admin(),false) is not true then raise exception 'Platform administrator access required.'; end if;
  return query
  with s as (select * from public.analytics_events where occurred_at >= now()-make_interval(days=>d)),
  c as (
    select
      count(*) filter(where event_type='page_view')::bigint pv,
      count(distinct session_id) filter(where event_type='page_view')::bigint ss,
      count(*) filter(where event_type='vendor_impression')::bigint vi,
      count(*) filter(where event_type='vendor_click')::bigint vc
    from s
  )
  select pv,ss,vi,vc,case when vi=0 then 0::numeric else round(vc::numeric/vi::numeric*100,1) end from c;
end;
$$;

create or replace function public.analytics_top_pages(p_days integer default 30,p_limit integer default 8)
returns table(route text,page_views bigint,sessions bigint)
language plpgsql security definer set search_path=public
as $$
declare d integer := greatest(1,least(coalesce(p_days,30),365)); lim integer := greatest(1,least(coalesce(p_limit,8),25));
begin
  if coalesce(public.is_platform_admin(),false) is not true then raise exception 'Platform administrator access required.'; end if;
  return query
  select a.route,count(*)::bigint,count(distinct a.session_id)::bigint
  from public.analytics_events a
  where a.occurred_at >= now()-make_interval(days=>d) and a.event_type='page_view'
  group by a.route order by count(*) desc limit lim;
end;
$$;

create or replace function public.analytics_vendor_stats(p_days integer default 30)
returns table(vendor_key text,impressions bigint,clicks bigint,click_through_rate numeric)
language plpgsql security definer set search_path=public
as $$
declare d integer := greatest(1,least(coalesce(p_days,30),365));
begin
  if coalesce(public.is_platform_admin(),false) is not true then raise exception 'Platform administrator access required.'; end if;
  return query
  select
    a.vendor_key,
    count(*) filter(where a.event_type='vendor_impression')::bigint,
    count(*) filter(where a.event_type='vendor_click')::bigint,
    case when count(*) filter(where a.event_type='vendor_impression')=0 then 0::numeric
      else round(
        count(*) filter(where a.event_type='vendor_click')::numeric /
        count(*) filter(where a.event_type='vendor_impression')::numeric * 100,1
      )
    end
  from public.analytics_events a
  where a.occurred_at >= now()-make_interval(days=>d)
    and a.vendor_key is not null
    and a.event_type in ('vendor_impression','vendor_click')
  group by a.vendor_key
  order by 3 desc,2 desc;
end;
$$;

revoke all on function public.analytics_overview(integer) from public;
revoke all on function public.analytics_top_pages(integer,integer) from public;
revoke all on function public.analytics_vendor_stats(integer) from public;
grant execute on function public.analytics_overview(integer) to authenticated;
grant execute on function public.analytics_top_pages(integer,integer) to authenticated;
grant execute on function public.analytics_vendor_stats(integer) to authenticated;

commit;