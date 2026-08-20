-- Defense in depth: exposed application tables must never be reachable as anon.
-- Existing authenticated ownership policies continue to govern row access.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles', 'my_links', 'businesses', 'business_links',
    'business_social_links', 'business_notes', 'website_checks',
    'business_development_keys', 'learning', 'goals', 'daily_tasks',
    'tasks', 'job_applications'
  ]
  loop
    if to_regclass(format('public.%I', table_name)) is not null then
      execute format('alter table public.%I enable row level security', table_name);
      execute format('revoke all privileges on table public.%I from anon', table_name);
    end if;
  end loop;
end $$;
