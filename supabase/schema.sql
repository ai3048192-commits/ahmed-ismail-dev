-- =====================================================================
--  Portfolio database — full reset
--  Run this in Supabase → SQL Editor. It DELETES every old table and
--  creates the new schema. Then run seed.sql to load the content.
--  A JSON backup of the old data lives in supabase/backup-old-data.json
-- =====================================================================

-- ---------- 1. drop everything old (and new, so the file is re-runnable)
drop table if exists
  public.items, public.settings, public.education,
  public.messages, public.projects, public.skills,
  public.profile, public.experience, public.services,
  public.testimonials, public.visits, public.admins, public.site_settings,
  public.posts, public.packages, public.faqs, public.bookings, public.events, public.chat_log
cascade;
drop function if exists public.is_admin() cascade;
drop function if exists public.touch_updated_at() cascade;

-- ---------- 2. admins: only emails listed here can write anything
create table public.admins (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security; -- no policies: unreadable from the API

insert into public.admins (email) values ('ai3048192@gmail.com');

create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.admins
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
grant execute on function public.is_admin() to anon, authenticated;

create function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- 3. profile: one row with every site-wide text and link
create table public.profile (
  id              int primary key default 1 check (id = 1),
  full_name_en    text not null default '',
  full_name_ar    text not null default '',
  role_en         text not null default '',
  role_ar         text not null default '',
  hero_title_en   text not null default '',
  hero_title_ar   text not null default '',
  hero_desc_en    text not null default '',
  hero_desc_ar    text not null default '',
  about_en        text not null default '',
  about_ar        text not null default '',
  location_en     text not null default '',
  location_ar     text not null default '',
  available       boolean not null default true,
  years_experience int not null default 0,
  email           text not null default '',
  whatsapp        text not null default '',
  reply_time_en   text not null default '',
  reply_time_ar   text not null default '',
  github_url      text not null default '',
  linkedin_url    text not null default '',
  x_url           text not null default '',
  facebook_url    text not null default '',
  cv_url          text not null default '',
  avatar_url      text not null default '',
  logo_url        text not null default '',
  chat_enabled    boolean not null default true,
  chat_context    text not null default '',
  updated_at      timestamptz not null default now()
);

-- ---------- 4. content tables
create table public.skills (
  id          bigint generated always as identity primary key,
  name_en     text not null,
  name_ar     text not null default '',
  desc_en     text not null default '',
  desc_ar     text not null default '',
  category    text not null default 'Frontend',
  color       text not null default '#a3e635',
  level       int  not null default 80 check (level between 0 and 100),
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

create table public.projects (
  id            bigint generated always as identity primary key,
  name_en       text not null,
  name_ar       text not null default '',
  desc_en       text not null default '',
  desc_ar       text not null default '',
  category      text not null default 'Applications',
  tags_en       text[] not null default '{}',
  tags_ar       text[] not null default '{}',
  role_en       text not null default '',
  role_ar       text not null default '',
  highlights_en text[] not null default '{}',
  highlights_ar text[] not null default '{}',
  problem_en    text not null default '',
  problem_ar    text not null default '',
  solution_en   text not null default '',
  solution_ar   text not null default '',
  result_en     text not null default '',
  result_ar     text not null default '',
  url           text not null default '',
  repo_url      text not null default '',
  image         text not null default '',
  gallery       text[] not null default '{}',
  year          int,
  featured      boolean not null default false,
  published     boolean not null default true,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);

-- kind: work = jobs, education = degrees/courses, certificate = certificates
create table public.experience (
  id          bigint generated always as identity primary key,
  kind        text not null default 'work' check (kind in ('work', 'education', 'certificate')),
  title_en    text not null,
  title_ar    text not null default '',
  org_en      text not null default '',
  org_ar      text not null default '',
  period      text not null default '',
  desc_en     text not null default '',
  desc_ar     text not null default '',
  image       text not null default '',
  verify_url  text not null default '',
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create table public.services (
  id          bigint generated always as identity primary key,
  title_en    text not null,
  title_ar    text not null default '',
  desc_en     text not null default '',
  desc_ar     text not null default '',
  icon        text not null default 'code',
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create table public.testimonials (
  id          bigint generated always as identity primary key,
  name        text not null,
  role_en     text not null default '',
  role_ar     text not null default '',
  quote_en    text not null default '',
  quote_ar    text not null default '',
  avatar      text not null default '',
  published   boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- ---------- 5. data visitors write (insert only)
create table public.messages (
  id          bigint generated always as identity primary key,
  name        text not null check (char_length(name) between 2 and 120),
  email       text not null check (char_length(email) between 5 and 200),
  topic       text not null default 'other' check (char_length(topic) <= 40),
  message     text not null check (char_length(message) between 10 and 4000),
  is_read     boolean not null default false,
  starred     boolean not null default false,
  created_at  timestamptz not null default now()
);

create table public.visits (
  id          bigint generated always as identity primary key,
  path        text not null default '/' check (char_length(path) <= 300),
  referrer    text not null default '' check (char_length(referrer) <= 500),
  lang        text not null default '' check (char_length(lang) <= 8),
  device      text not null default '' check (char_length(device) <= 20),
  created_at  timestamptz not null default now()
);
create index visits_created_at_idx on public.visits (created_at desc);
create index messages_created_at_idx on public.messages (created_at desc);

create trigger profile_touch before update on public.profile
  for each row execute function public.touch_updated_at();

-- ---------- 6. row level security
alter table public.profile      enable row level security;
alter table public.skills       enable row level security;
alter table public.projects     enable row level security;
alter table public.experience   enable row level security;
alter table public.services     enable row level security;
alter table public.testimonials enable row level security;
alter table public.messages     enable row level security;
alter table public.visits       enable row level security;

-- public read, admin write
create policy "public read"  on public.profile    for select using (true);
create policy "admin write"  on public.profile    for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "public read"  on public.skills     for select using (true);
create policy "admin write"  on public.skills     for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "public read"  on public.experience for select using (true);
create policy "admin write"  on public.experience for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "public read"  on public.services   for select using (true);
create policy "admin write"  on public.services   for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- hidden (unpublished) rows are visible to the admin only
create policy "public read"  on public.projects     for select using (published or public.is_admin());
create policy "admin write"  on public.projects     for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "public read"  on public.testimonials for select using (published or public.is_admin());
create policy "admin write"  on public.testimonials for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- visitors can only insert; only the admin reads / edits / deletes
create policy "anyone sends" on public.messages for insert with check (is_read = false and starred = false);
create policy "admin reads"  on public.messages for select to authenticated using (public.is_admin());
create policy "admin edits"  on public.messages for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin clears" on public.messages for delete to authenticated using (public.is_admin());

create policy "anyone logs"  on public.visits for insert with check (true);
create policy "admin reads"  on public.visits for select to authenticated using (public.is_admin());
create policy "admin clears" on public.visits for delete to authenticated using (public.is_admin());

grant select on public.profile, public.skills, public.projects, public.experience,
                public.services, public.testimonials to anon, authenticated;
grant insert on public.messages, public.visits to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;

-- ---------- 7. storage bucket for images and the CV
insert into storage.buckets (id, name, public, file_size_limit)
values ('media', 'media', true, 10485760)
on conflict (id) do update set public = true, file_size_limit = 10485760;

drop policy if exists "media admin read"   on storage.objects;
drop policy if exists "media admin insert" on storage.objects;
drop policy if exists "media admin update" on storage.objects;
drop policy if exists "media admin delete" on storage.objects;
create policy "media admin read"   on storage.objects for select to authenticated using (bucket_id = 'media' and public.is_admin());
create policy "media admin insert" on storage.objects for insert to authenticated with check (bucket_id = 'media' and public.is_admin());
create policy "media admin update" on storage.objects for update to authenticated using (bucket_id = 'media' and public.is_admin());
create policy "media admin delete" on storage.objects for delete to authenticated using (bucket_id = 'media' and public.is_admin());
