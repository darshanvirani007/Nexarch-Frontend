-- Expand profile timezone choices while retaining the direct-CRUD safety checks.
alter table public.profiles
  drop constraint if exists profiles_direct_crud_check;

alter table public.profiles
  add constraint profiles_direct_crud_check check (
    (full_name is null or char_length(full_name) <= 160) and
    (country is null or char_length(country) <= 100) and
    (contact_no is null or char_length(contact_no) <= 40) and
    timezone in (
      'UTC',
      'Europe/Dublin', 'Europe/London', 'Europe/Lisbon', 'Europe/Paris',
      'Europe/Berlin', 'Europe/Amsterdam', 'Europe/Madrid', 'Europe/Rome',
      'Europe/Warsaw', 'Europe/Athens', 'Europe/Helsinki', 'Europe/Kyiv',
      'Europe/Istanbul', 'Africa/Cairo', 'Africa/Lagos', 'Africa/Johannesburg',
      'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Hong_Kong',
      'Asia/Tokyo', 'Asia/Seoul', 'Australia/Perth', 'Australia/Adelaide',
      'Australia/Sydney', 'Australia/Melbourne', 'Pacific/Auckland',
      'America/Toronto', 'America/Vancouver', 'America/New_York',
      'America/Chicago', 'America/Denver', 'America/Los_Angeles',
      'America/Mexico_City', 'America/Sao_Paulo'
    )
  ) not valid;
