-- ============================================================
-- NerdsBattle — Migration initiale
-- À exécuter dans : Supabase Dashboard → SQL Editor
-- ============================================================

-- ─── Extensions ───────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Table : profiles ──────────────────────────────────────
-- Liée 1:1 à auth.users via id.
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  name         text        not null default 'Anonyme' check (char_length(name) <= 32),
  avatar_seed  text        not null default 'default'  check (char_length(avatar_seed) <= 16),
  level_id     text        not null default 'terminale',
  country      text        not null default 'FR'       check (char_length(country) <= 8),
  subjects     text[]      not null default '{}',
  total_xp     integer     not null default 0          check (total_xp >= 0 and total_xp <= 9999999),
  streak_count integer     not null default 0          check (streak_count >= 0),
  streak_last  date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Trigger : updated_at automatique
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Trigger : créer le profil dès qu'un user s'inscrit
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', 'Anonyme'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Table : quiz_history ──────────────────────────────────
create table if not exists public.quiz_history (
  id          uuid        primary key default uuid_generate_v4(),
  user_id     uuid        not null references public.profiles(id) on delete cascade,
  course_id   text        not null check (char_length(course_id) <= 128),
  subject_id  text        not null check (char_length(subject_id) <= 32),
  level_id    text        not null check (char_length(level_id) <= 32),
  mode        text        not null default 'solo' check (mode in ('solo','1v1','2v2','challenge')),
  ranked      boolean     not null default true,
  score       smallint    not null check (score >= 0 and score <= 120),
  accuracy    real        not null check (accuracy >= 0 and accuracy <= 1),
  correct     smallint    not null default 0,
  total       smallint    not null default 0,
  played_at   timestamptz not null default now()
);

create index quiz_history_user_idx on public.quiz_history(user_id, played_at desc);

-- ─── Table : courses ───────────────────────────────────────
-- Cours générés par l'IA ou importés manuellement.
create table if not exists public.courses (
  id                 text        primary key check (char_length(id) <= 128),
  subject_id         text        not null check (char_length(subject_id) <= 32),
  level_id           text        not null check (char_length(level_id) <= 32),
  slug               text        not null check (char_length(slug) <= 64),
  title              text        not null check (char_length(title) <= 128),
  summary            text        not null default '' check (char_length(summary) <= 512),
  lesson             text        not null default '' check (char_length(lesson) <= 16384),
  estimated_minutes  smallint    not null default 8 check (estimated_minutes >= 1 and estimated_minutes <= 60),
  tags               text[]      not null default '{}',
  questions          jsonb       not null default '[]',
  source             text        not null default 'ai' check (source in ('ai','manual')),
  created_by         uuid        references auth.users(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique(subject_id, level_id, slug)
);

create index courses_level_subject_idx on public.courses(level_id, subject_id);

create trigger courses_updated_at
  before update on public.courses
  for each row execute function public.set_updated_at();

-- ─── RLS Policies ──────────────────────────────────────────

alter table public.profiles    enable row level security;
alter table public.quiz_history enable row level security;
alter table public.courses     enable row level security;

-- profiles : lecture/écriture sur son propre profil uniquement
create policy "profiles: own read"   on public.profiles for select using (auth.uid() = id);
create policy "profiles: own update" on public.profiles for update using (auth.uid() = id);

-- quiz_history : lecture/écriture sur son propre historique
create policy "history: own read"   on public.quiz_history for select using (auth.uid() = user_id);
create policy "history: own insert" on public.quiz_history for insert with check (auth.uid() = user_id);

-- courses : lecture publique, insertion réservée aux authentifiés
create policy "courses: public read"   on public.courses for select using (true);
create policy "courses: auth insert"   on public.courses for insert with check (auth.uid() is not null);
create policy "courses: own update"    on public.courses for update using (auth.uid() = created_by);

-- ─── Vue : leaderboard ─────────────────────────────────────
create or replace view public.leaderboard as
select
  p.id,
  p.name,
  p.avatar_seed,
  p.level_id,
  p.country,
  p.total_xp,
  p.streak_count,
  rank() over (order by p.total_xp desc) as rank
from public.profiles p
where p.total_xp > 0;

-- Lecture publique de la vue
grant select on public.leaderboard to anon, authenticated;
