-- Nullable columns allow an existing browser preference to seed the database
-- on first login instead of overwriting it with a server default.
alter table public.profiles
  add column if not exists appearance_theme text,
  add column if not exists appearance_palette text,
  add column if not exists appearance_density text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_appearance_values_check') then
    alter table public.profiles add constraint profiles_appearance_values_check check (
      (appearance_theme is null or appearance_theme in ('dark', 'light', 'system')) and
      (appearance_palette is null or appearance_palette in ('graphite', 'slate', 'navy', 'forest', 'burgundy', 'espresso')) and
      (appearance_density is null or appearance_density in ('comfortable', 'compact'))
    ) not valid;
  end if;
end $$;
