-- Preserve the former Laravel profile validation at the database boundary.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_direct_crud_check') then
    alter table public.profiles add constraint profiles_direct_crud_check check (
      (full_name is null or char_length(full_name) <= 160) and
      (country is null or char_length(country) <= 100) and
      (contact_no is null or char_length(contact_no) <= 40) and
      timezone in ('Europe/Dublin', 'Europe/London')
    ) not valid;
  end if;
end $$;
