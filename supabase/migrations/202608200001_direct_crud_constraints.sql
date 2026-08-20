-- Enforce the Laravel validation invariants at the database boundary.
-- NOT VALID avoids blocking deployment on historical rows while still
-- enforcing each constraint for new and changed data.

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'my_links_direct_crud_check') then
    alter table public.my_links add constraint my_links_direct_crud_check check (
      char_length(btrim(link_type)) between 1 and 50 and
      char_length(btrim(category)) between 1 and 50 and
      char_length(btrim(name)) between 1 and 120 and
      char_length(url) <= 2048 and url ~* '^https?://' and
      display_order >= 0
    ) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'learning_direct_crud_check') then
    alter table public.learning add constraint learning_direct_crud_check check (
      char_length(btrim(title)) between 1 and 200 and
      char_length(btrim(category)) between 1 and 50 and
      status in ('to_learn', 'not_started', 'in_progress', 'completed') and
      (provider_or_author is null or char_length(provider_or_author) <= 160) and
      (resource_url is null or (char_length(resource_url) <= 2048 and resource_url ~* '^https?://')) and
      display_order >= 0
    ) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'goals_direct_crud_check') then
    alter table public.goals add constraint goals_direct_crud_check check (
      char_length(btrim(title)) between 1 and 200 and
      char_length(btrim(category)) between 1 and 50 and
      char_length(btrim(measure)) between 1 and 120 and
      char_length(btrim(unit)) between 1 and 40 and
      target_value > 0 and display_order >= 0
    ) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'daily_tasks_direct_crud_check') then
    alter table public.daily_tasks add constraint daily_tasks_direct_crud_check check (
      char_length(btrim(task)) between 1 and 500 and display_order >= 0
    ) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'tasks_direct_crud_check') then
    alter table public.tasks add constraint tasks_direct_crud_check check (
      char_length(btrim(task)) between 1 and 500 and display_order >= 0
    ) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'job_applications_direct_crud_check') then
    alter table public.job_applications add constraint job_applications_direct_crud_check check (
      char_length(btrim(job_name)) between 1 and 200 and
      (job_link is null or (char_length(job_link) <= 2048 and job_link ~* '^https?://')) and
      status in ('pending', 'applied', 'accepted', 'rejected') and
      display_order >= 0
    ) not valid;
  end if;
end $$;

create index if not exists my_links_user_order_idx on public.my_links (user_id, display_order, created_at);
create index if not exists learning_user_order_idx on public.learning (user_id, display_order, created_at);
create index if not exists goals_user_order_idx on public.goals (user_id, display_order, created_at);
create index if not exists daily_tasks_user_date_order_idx on public.daily_tasks (user_id, task_date, display_order, created_at);
create index if not exists tasks_user_order_idx on public.tasks (user_id, display_order, created_at);
create index if not exists job_applications_user_order_idx on public.job_applications (user_id, display_order, created_at);
