-- ── Table signalements de questions ─────────────────────────────────────────
create table if not exists public.question_reports (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete set null,
  question_id   text not null,
  subject_id    text,
  level_id      text,
  question_json jsonb,
  created_at    timestamptz not null default now()
);

alter table public.question_reports enable row level security;

create policy "Users can insert own reports"
  on public.question_reports for insert
  with check (auth.uid() = user_id);

create policy "Admins can read all reports"
  on public.question_reports for select
  using (auth.uid() = user_id);

-- ── Index sur total_xp pour les requêtes leaderboard ───────────────────────
create index if not exists profiles_xp_idx on public.profiles (total_xp desc);

-- Lecture publique du leaderboard existant (créé dans 001_initial_schema.sql)
-- La vue public.leaderboard expose déjà : id, name, avatar_seed, level_id, country, total_xp, rank
grant select on public.leaderboard to anon, authenticated;
