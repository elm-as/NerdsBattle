-- ── Rooms de matchmaking temps réel ─────────────────────────────────────────
create table if not exists public.game_rooms (
  id           uuid        primary key default gen_random_uuid(),
  mode         text        not null check (mode in ('1v1','2v2','blitz')),
  subject_id   text        not null,
  level_id     text        not null,
  topic        text        not null default '',
  status       text        not null default 'waiting'
                           check (status in ('waiting','ready','playing','done')),
  host_id      uuid        not null references auth.users(id) on delete cascade,
  guest_id     uuid        references auth.users(id) on delete set null,
  questions    jsonb,                -- remplies par le host une fois l'IA appelée
  created_at   timestamptz not null default now(),
  started_at   timestamptz
);

-- Index pour chercher une room ouverte (mode + subject + level)
create index if not exists game_rooms_open_idx
  on public.game_rooms (mode, subject_id, level_id, status, created_at desc)
  where status = 'waiting';

-- Nettoyage auto des rooms > 10 min (au cas où un joueur abandonne)
create or replace function public.cleanup_old_rooms()
returns void language sql security definer as $$
  delete from public.game_rooms
  where created_at < now() - interval '10 minutes'
    and status in ('waiting', 'ready');
$$;

-- RLS
alter table public.game_rooms enable row level security;

-- Tout le monde peut lire les rooms en attente (pour matchmaking)
create policy "Read open rooms"
  on public.game_rooms for select
  using (status = 'waiting' or auth.uid() in (host_id, guest_id));

-- Seul le host peut créer
create policy "Host can insert"
  on public.game_rooms for insert
  with check (auth.uid() = host_id);

-- Host et guest peuvent mettre à jour (rejoindre, changer status)
create policy "Players can update"
  on public.game_rooms for update
  using (auth.uid() in (host_id, guest_id) or status = 'waiting');
