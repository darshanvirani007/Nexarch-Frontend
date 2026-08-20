-- Align legacy My Links checks with the canonical values emitted by the frontend.
-- Existing rows are preserved; NOT VALID avoids rejecting historical aliases.

alter table public.my_links drop constraint if exists my_links_type_check;
alter table public.my_links drop constraint if exists my_links_category_check;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'my_links_type_values_check') then
    alter table public.my_links add constraint my_links_type_values_check check (
      link_type in (
        'freelance', 'upwork', 'fiverr', 'email', 'blog', 'youtube',
        'github', 'supabase', 'vercel', 'linkedin', 'reddit', 'leetcode',
        'gpt / chatgpt', 'udemy', 'project euler', 'everyday website', 'other'
      )
    ) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'my_links_category_values_check') then
    alter table public.my_links add constraint my_links_category_values_check check (
      category in ('work', 'email', 'blog', 'youtube', 'development', 'social', 'others')
    ) not valid;
  end if;
end $$;
