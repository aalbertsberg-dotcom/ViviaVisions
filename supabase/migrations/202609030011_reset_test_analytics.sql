begin;

-- v1.17 and v1.17.1 production smoke tests intentionally navigated public
-- routes and opened a partner detail card. Those automated checks were
-- recorded as real analytics. v1.17.2 disables analytics during Playwright
-- runs, so reset the analytics-only table once after the new deployment is live.
truncate table public.analytics_events restart identity;

commit;