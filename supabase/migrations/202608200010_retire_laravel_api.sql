-- Replaces the final Laravel-only deletion operation with an authenticated,
-- ownership-checked database function. All work is atomic.
create or replace function public.delete_business(target_business_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1
    from public.businesses
    where id = target_business_id
      and user_id = current_user_id
  ) then
    raise exception 'Business not found';
  end if;

  delete from vault.secrets
  where id in (
    select vault_secret_id
    from public.business_development_keys
    where business_id = target_business_id
      and user_id = current_user_id
      and vault_secret_id is not null
  );

  delete from public.business_development_keys where business_id = target_business_id and user_id = current_user_id;
  delete from public.business_links where business_id = target_business_id and user_id = current_user_id;
  delete from public.business_social_links where business_id = target_business_id and user_id = current_user_id;
  delete from public.website_checks where business_id = target_business_id and user_id = current_user_id;
  delete from public.business_notes where business_id = target_business_id and user_id = current_user_id;
  delete from public.businesses where id = target_business_id and user_id = current_user_id;
end;
$$;

revoke all on function public.delete_business(uuid) from public, anon;
grant execute on function public.delete_business(uuid) to authenticated;
