-- =====================================================================
--  Features: project pages, blog, pricing, FAQ, bookings, analytics
--  events, notifications and chat rate limiting.
--  Run after schema.sql, seed.sql and site-settings.sql. Safe to run again.
-- =====================================================================

-- ---------- slugs (readable URLs like /work/quran-application)
create or replace function public.slugify(t text) returns text
language sql immutable as $$
  select trim(both '-' from regexp_replace(lower(coalesce(t, '')), '[^a-z0-9]+', '-', 'g'));
$$;

-- fills an empty slug from name_en / title_en and keeps it unique per table
create or replace function public.fill_slug() returns trigger
language plpgsql as $$
declare
  base text;
  taken boolean;
begin
  if coalesce(new.slug, '') <> '' then
    new.slug := public.slugify(new.slug);
  else
    new.slug := public.slugify(coalesce(to_jsonb(new) ->> 'name_en', to_jsonb(new) ->> 'title_en'));
  end if;
  if new.slug = '' then
    new.slug := tg_table_name || '-' || new.id;
  end if;
  base := new.slug;
  execute format('select exists (select 1 from public.%I where slug = $1 and id <> $2)', tg_table_name)
    into taken using new.slug, new.id;
  if taken then
    new.slug := base || '-' || new.id;
  end if;
  return new;
end;
$$;

alter table public.projects add column if not exists slug text;
drop trigger if exists projects_slug on public.projects;
create trigger projects_slug before insert or update on public.projects
  for each row execute function public.fill_slug();
update public.projects set slug = '' where slug is null;
create unique index if not exists projects_slug_key on public.projects (slug);

-- ---------- blog
create table if not exists public.posts (
  id            bigint generated always as identity primary key,
  slug          text unique,
  title_en      text not null,
  title_ar      text not null default '',
  excerpt_en    text not null default '',
  excerpt_ar    text not null default '',
  body_en       text not null default '',
  body_ar       text not null default '',
  cover         text not null default '',
  tags          text[] not null default '{}',
  published     boolean not null default false,
  published_at  timestamptz not null default now(),
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);
drop trigger if exists posts_slug on public.posts;
create trigger posts_slug before insert or update on public.posts
  for each row execute function public.fill_slug();

-- ---------- pricing & FAQ
create table if not exists public.packages (
  id            bigint generated always as identity primary key,
  name_en       text not null,
  name_ar       text not null default '',
  price         text not null default '',
  period_en     text not null default '',
  period_ar     text not null default '',
  desc_en       text not null default '',
  desc_ar       text not null default '',
  features_en   text[] not null default '{}',
  features_ar   text[] not null default '{}',
  cta_en        text not null default '',
  cta_ar        text not null default '',
  highlighted   boolean not null default false,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);

create table if not exists public.faqs (
  id          bigint generated always as identity primary key,
  q_en        text not null,
  q_ar        text not null default '',
  a_en        text not null default '',
  a_ar        text not null default '',
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- ---------- bookings
create table if not exists public.bookings (
  id            bigint generated always as identity primary key,
  name          text not null check (char_length(name) between 2 and 120),
  email         text not null check (char_length(email) between 5 and 200),
  phone         text not null default '' check (char_length(phone) <= 40),
  topic         text not null default '' check (char_length(topic) <= 120),
  note          text not null default '' check (char_length(note) <= 2000),
  start_at      timestamptz not null,
  duration_min  int not null default 30 check (duration_min between 10 and 180),
  status        text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  notified_at   timestamptz,
  created_at    timestamptz not null default now()
);
-- one live booking per slot
create unique index if not exists bookings_slot_key on public.bookings (start_at) where status <> 'cancelled';
create index if not exists bookings_start_idx on public.bookings (start_at);

-- visitors may see which slots are taken, never who took them
create or replace function public.booked_slots(p_from timestamptz, p_to timestamptz)
returns table (start_at timestamptz, duration_min int)
language sql stable security definer set search_path = public as $$
  select b.start_at, b.duration_min from public.bookings b
  where b.status <> 'cancelled' and b.start_at >= p_from and b.start_at < p_to;
$$;
grant execute on function public.booked_slots(timestamptz, timestamptz) to anon, authenticated;

-- ---------- notifications: rows the notify function hasn't sent yet
-- the first run marks existing messages as already sent, so nothing old floods in
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'messages' and column_name = 'notified_at'
  ) then
    alter table public.messages add column notified_at timestamptz;
    update public.messages set notified_at = created_at;
  end if;
end;
$$;

-- ---------- analytics events (CV downloads, WhatsApp clicks, project opens, ...)
create table if not exists public.events (
  id          bigint generated always as identity primary key,
  type        text not null check (type in ('cv_download', 'whatsapp_click', 'email_click', 'project_open', 'project_link', 'post_open', 'booking_made', 'chat_open')),
  label       text not null default '' check (char_length(label) <= 200),
  created_at  timestamptz not null default now()
);
create index if not exists events_created_idx on public.events (created_at desc);

-- ---------- chat rate limit (written only by the chat edge function)
create table if not exists public.chat_log (
  id          bigint generated always as identity primary key,
  ip_hash     text not null,
  created_at  timestamptz not null default now()
);
create index if not exists chat_log_ip_idx on public.chat_log (ip_hash, created_at desc);

-- ---------- row level security
alter table public.posts    enable row level security;
alter table public.packages enable row level security;
alter table public.faqs     enable row level security;
alter table public.bookings enable row level security;
alter table public.events   enable row level security;
alter table public.chat_log enable row level security; -- no policies: service role only

drop policy if exists "public read" on public.posts;
drop policy if exists "admin write" on public.posts;
create policy "public read" on public.posts for select using (published or public.is_admin());
create policy "admin write" on public.posts for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read" on public.packages;
drop policy if exists "admin write" on public.packages;
create policy "public read" on public.packages for select using (true);
create policy "admin write" on public.packages for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read" on public.faqs;
drop policy if exists "admin write" on public.faqs;
create policy "public read" on public.faqs for select using (true);
create policy "admin write" on public.faqs for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "anyone books" on public.bookings;
drop policy if exists "admin reads" on public.bookings;
drop policy if exists "admin edits" on public.bookings;
drop policy if exists "admin clears" on public.bookings;
create policy "anyone books" on public.bookings for insert with check (
  status = 'pending' and notified_at is null
  and start_at > now() and start_at < now() + interval '120 days'
);
create policy "admin reads"  on public.bookings for select to authenticated using (public.is_admin());
create policy "admin edits"  on public.bookings for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin clears" on public.bookings for delete to authenticated using (public.is_admin());

drop policy if exists "anyone logs" on public.events;
drop policy if exists "admin reads" on public.events;
drop policy if exists "admin clears" on public.events;
create policy "anyone logs"  on public.events for insert with check (true);
create policy "admin reads"  on public.events for select to authenticated using (public.is_admin());
create policy "admin clears" on public.events for delete to authenticated using (public.is_admin());

grant select on public.posts, public.packages, public.faqs to anon, authenticated;
grant insert on public.bookings, public.events to anon, authenticated;
grant select, insert, update, delete on public.posts, public.packages, public.faqs, public.bookings, public.events to authenticated;
