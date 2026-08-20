-- Permit valid global IANA timezone identifiers selected by the frontend.
alter table public.profiles
  drop constraint if exists profiles_direct_crud_check;

alter table public.profiles
  add constraint profiles_direct_crud_check check (
    (full_name is null or char_length(full_name) <= 160) and
    (country is null or char_length(country) <= 100) and
    (contact_no is null or char_length(contact_no) <= 40) and
    char_length(timezone) between 1 and 64 and
    timezone ~ '^[A-Za-z_+-]+(/[A-Za-z0-9_+-]+)*$'
  ) not valid;
