-- Preserve Laravel validation for direct business CRUD.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'businesses_direct_crud_check') then
    alter table public.businesses add constraint businesses_direct_crud_check check (
      char_length(btrim(name)) between 1 and 160 and
      (description is null or char_length(description) <= 2000) and
      display_order >= 0
    ) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'business_links_direct_crud_check') then
    alter table public.business_links add constraint business_links_direct_crud_check check (
      char_length(btrim(link_type)) between 1 and 50 and
      link_type ~* '^(website|email|admin|hosting|domain|analytics|business-suite|github|other|custom:[a-z0-9][a-z0-9 _-]*)$' and
      char_length(btrim(name)) between 1 and 120 and
      char_length(url) <= 2048 and url ~* '^https?://' and
      display_order >= 0
    ) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'business_social_links_direct_crud_check') then
    alter table public.business_social_links add constraint business_social_links_direct_crud_check check (
      char_length(btrim(platform)) between 1 and 50 and
      (username is null or char_length(username) <= 120) and
      char_length(url) <= 2048 and url ~* '^https?://' and
      display_order >= 0
    ) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'business_notes_direct_crud_check') then
    alter table public.business_notes add constraint business_notes_direct_crud_check check (
      content is null or char_length(content) <= 50000
    ) not valid;
  end if;
end $$;

create index if not exists businesses_user_archive_order_idx
  on public.businesses (user_id, is_archived, display_order, created_at);
create index if not exists business_links_business_order_idx
  on public.business_links (business_id, display_order);
create index if not exists business_social_links_business_order_idx
  on public.business_social_links (business_id, display_order);
create index if not exists website_checks_business_checked_idx
  on public.website_checks (business_id, checked_at desc);
