-- =====================================================================
--  Site settings: colors, fonts, shapes, 3D, sections, SEO, ...
--  Run after schema.sql and seed.sql. Safe to run again.
--  Everything is one JSON row, so new options never need a migration;
--  missing keys fall back to the defaults in src/lib/settings.ts
-- =====================================================================

create table if not exists public.site_settings (
  id          int primary key default 1 check (id = 1),
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

alter table public.site_settings enable row level security;

drop trigger if exists site_settings_touch on public.site_settings;
create trigger site_settings_touch before update on public.site_settings
  for each row execute function public.touch_updated_at();

drop policy if exists "public read" on public.site_settings;
drop policy if exists "admin write" on public.site_settings;
create policy "public read" on public.site_settings for select using (true);
create policy "admin write" on public.site_settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant select on public.site_settings to anon, authenticated;
grant insert, update on public.site_settings to authenticated;

insert into public.site_settings (id, data) values (1, '{}'::jsonb)
on conflict (id) do nothing;
