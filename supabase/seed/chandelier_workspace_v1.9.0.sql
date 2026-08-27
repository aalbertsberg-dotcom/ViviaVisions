-- ViviaVisions v1.9.0
-- Seed the current Chandelier Oaks planning workspace data into Supabase.
-- Run once before testing v1.9.0 locally.

begin;

do $$
declare
  v_venue_id uuid := '31183032-827c-4412-828b-aad38c704524';
  v_sarah_event uuid;
  v_ashley_event uuid;
  v_jennifer_event uuid;

  v_gold_lantern uuid;
  v_french_doors uuid;
  v_green_wall uuid;
  v_welcome_easel uuid;

  v_pecan uuid;
  v_under_oaks uuid;

  v_layout uuid;
begin
  select id into v_sarah_event
  from public.events
  where venue_id = v_venue_id and access_slug = 'sarah-john';

  select id into v_ashley_event
  from public.events
  where venue_id = v_venue_id and access_slug = 'ashley-mark';

  select id into v_jennifer_event
  from public.events
  where venue_id = v_venue_id and access_slug = 'jennifer-matt';

  if v_sarah_event is null or v_ashley_event is null or v_jennifer_event is null then
    raise exception 'Run the v1.8.7 Chandelier clients/events seed before this migration.';
  end if;

  select id into v_gold_lantern
  from public.inventory_items
  where venue_id = v_venue_id and external_key = 'gold-lantern';

  select id into v_french_doors
  from public.inventory_items
  where venue_id = v_venue_id and external_key = 'french-doors';

  select id into v_green_wall
  from public.inventory_items
  where venue_id = v_venue_id and external_key = 'green-wall';

  select id into v_welcome_easel
  from public.inventory_items
  where venue_id = v_venue_id and external_key = 'welcome-easel';

  select id into v_pecan
  from public.venue_spaces
  where venue_id = v_venue_id and external_key = 'pecan-pavilion';

  select id into v_under_oaks
  from public.venue_spaces
  where venue_id = v_venue_id and external_key = 'under-the-oaks';

  if v_gold_lantern is null
     or v_french_doors is null
     or v_green_wall is null
     or v_welcome_easel is null
     or v_pecan is null
     or v_under_oaks is null then
    raise exception 'Required Chandelier inventory/space rows are missing.';
  end if;

  -- The planning tables have not been authoritative before v1.9.0, so replace
  -- their seed content once with the current preview workspace state.
  delete from public.event_selections
  where event_id in (v_sarah_event, v_ashley_event, v_jennifer_event);

  insert into public.event_selections (event_id, inventory_item_id, quantity)
  values
    (v_sarah_event, v_gold_lantern, 12),
    (v_sarah_event, v_french_doors, 1),
    (v_sarah_event, v_green_wall, 1),
    (v_ashley_event, v_gold_lantern, 8),
    (v_ashley_event, v_welcome_easel, 1);

  delete from public.layouts
  where event_id in (v_sarah_event, v_ashley_event, v_jennifer_event);

  -- Sarah & John: Pecan Pavilion
  insert into public.layouts (
    event_id, venue_space_id, name, is_primary
  )
  values (
    v_sarah_event, v_pecan, 'Pecan Pavilion Layout', true
  )
  returning id into v_layout;

  insert into public.layout_items (
    layout_id, object_type, label, x, y, rotation, scale, metadata
  )
  values
    (v_layout, 'round-table', 'Round table', 140, 115, 0, 1, '{"app_id":"starter-1","area_external_key":"pecan-pavilion"}'::jsonb),
    (v_layout, 'round-table', 'Round table', 315, 115, 0, 1, '{"app_id":"starter-2","area_external_key":"pecan-pavilion"}'::jsonb),
    (v_layout, 'round-table', 'Round table', 140, 275, 0, 1, '{"app_id":"starter-3","area_external_key":"pecan-pavilion"}'::jsonb),
    (v_layout, 'round-table', 'Round table', 315, 275, 0, 1, '{"app_id":"starter-4","area_external_key":"pecan-pavilion"}'::jsonb),
    (v_layout, 'dance-floor', 'Dance floor', 500, 175, 0, 1, '{"app_id":"starter-5","area_external_key":"pecan-pavilion"}'::jsonb),
    (v_layout, 'bar', 'Bar', 600, 350, 0, 1, '{"app_id":"starter-6","area_external_key":"pecan-pavilion"}'::jsonb);

  -- Sarah & John: Under the Live Oaks
  insert into public.layouts (
    event_id, venue_space_id, name, is_primary
  )
  values (
    v_sarah_event, v_under_oaks, 'Under the Live Oaks Layout', false
  )
  returning id into v_layout;

  insert into public.layout_items (
    layout_id, object_type, label, x, y, rotation, scale, metadata
  )
  values (
    v_layout, 'arch', 'Ceremony arch', 330, 90, 0, 1,
    '{"app_id":"starter-7","area_external_key":"under-the-oaks"}'::jsonb
  );

  -- Ashley & Mark: Pecan Pavilion
  insert into public.layouts (
    event_id, venue_space_id, name, is_primary
  )
  values (
    v_ashley_event, v_pecan, 'Pecan Pavilion Layout', true
  )
  returning id into v_layout;

  insert into public.layout_items (
    layout_id, object_type, label, x, y, rotation, scale, metadata
  )
  values
    (v_layout, 'round-table', 'Round table', 175, 145, 0, 1, '{"app_id":"ashley-table-1","area_external_key":"pecan-pavilion"}'::jsonb),
    (v_layout, 'round-table', 'Round table', 355, 145, 0, 1, '{"app_id":"ashley-table-2","area_external_key":"pecan-pavilion"}'::jsonb),
    (v_layout, 'dance-floor', 'Dance floor', 520, 220, 0, 0.9, '{"app_id":"ashley-dance","area_external_key":"pecan-pavilion"}'::jsonb);

  -- Seed only the messages that were previously browser-only.
  delete from public.messages
  where event_id in (v_sarah_event, v_ashley_event, v_jennifer_event)
    and coalesce(metadata ->> 'development_seed', 'false') = 'true';

  insert into public.messages (
    event_id, sender_user_id, sender_role, sender_name, body,
    context_kind, context_id, context_label, metadata, created_at
  )
  values
    (
      v_sarah_event, null, 'client', 'Sarah & John',
      'Hi! We started looking through the Pinrose Prop Shop. Could we use the gold lanterns around the guest tables?',
      'inventory', null, 'Gold Lantern Set',
      '{"app_id":"sample-msg-1","development_seed":true,"attachments":[],"context":{"kind":"inventory","id":"gold-lantern","label":"Gold Lantern Set"},"read_by_bride":true,"read_by_venue":true}'::jsonb,
      '2026-08-18T14:22:00-05:00'::timestamptz
    ),
    (
      v_sarah_event, null, 'venue', 'Chandelier Oaks Team',
      'Absolutely. Keep that combination in your selections and we can use the final setup sheet when the date gets closer.',
      null, null, null,
      '{"app_id":"sample-msg-2","development_seed":true,"attachments":[],"context":null,"read_by_bride":true,"read_by_venue":true}'::jsonb,
      '2026-08-18T15:06:00-05:00'::timestamptz
    ),
    (
      v_sarah_event, null, 'client', 'Sarah & John',
      'Perfect. We also started a layout for the Pecan Pavilion so you can see the general table and dance-floor placement.',
      'area', null, 'Pecan Pavilion',
      '{"app_id":"sample-msg-3","development_seed":true,"attachments":[],"context":{"kind":"area","id":"pecan-pavilion","label":"Pecan Pavilion"},"read_by_bride":true,"read_by_venue":true}'::jsonb,
      '2026-08-19T10:41:00-05:00'::timestamptz
    ),
    (
      v_sarah_event, null, 'venue', 'Chandelier Oaks Team',
      'I see it. Keep using the designer and this thread for changes so everything stays attached to your wedding workspace.',
      'area', null, 'Pecan Pavilion',
      '{"app_id":"sample-msg-4","development_seed":true,"attachments":[],"context":{"kind":"area","id":"pecan-pavilion","label":"Pecan Pavilion"},"read_by_bride":false,"read_by_venue":true}'::jsonb,
      '2026-08-20T09:18:00-05:00'::timestamptz
    ),
    (
      v_ashley_event, null, 'client', 'Ashley & Mark',
      'Can we keep the gazebo ceremony very simple and move most of the décor to the pavilion?',
      'area', null, 'Hilltop Gazebo',
      '{"app_id":"ashley-msg-1","development_seed":true,"attachments":[],"context":{"kind":"area","id":"hilltop-gazebo","label":"Hilltop Gazebo"},"read_by_bride":true,"read_by_venue":false}'::jsonb,
      '2026-08-19T16:10:00-05:00'::timestamptz
    );
end $$;

commit;

-- Verification summary. Expected after first run:
-- Sarah: 3 selections, 7 layout items, 4 messages
-- Ashley: 2 selections, 3 layout items, 1 message
-- Jennifer: 0/0/0
select
  e.access_slug,
  count(distinct es.id) as selections,
  count(distinct li.id) as layout_items,
  count(distinct m.id) as messages
from public.events e
left join public.event_selections es on es.event_id = e.id
left join public.layouts l on l.event_id = e.id
left join public.layout_items li on li.layout_id = l.id
left join public.messages m on m.event_id = e.id
where e.venue_id = '31183032-827c-4412-828b-aad38c704524'
group by e.id, e.access_slug, e.event_date
order by e.event_date;
