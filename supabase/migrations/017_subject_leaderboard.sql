-- ============================================================
-- Migration : Classement par matière
-- ============================================================

-- ─── Table : subject_xp (XP par matière pour chaque utilisateur) ─────────────────
create table if not exists public.subject_xp (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid        not null references public.profiles(id) on delete cascade,
  subject_id  text        not null check (char_length(subject_id) <= 32),
  xp          integer     not null default 0 check (xp >= 0),
  updated_at  timestamptz not null default now(),
  unique(user_id, subject_id)
);

-- Index pour performance
 create index subject_xp_user_idx on public.subject_xp(user_id);
 create index subject_xp_subject_idx on public.subject_xp(subject_id);
 create index subject_xp_xp_idx on public.subject_xp(subject_id, xp desc);

-- Trigger : updated_at automatique
 create trigger subject_xp_updated_at
   before update on public.subject_xp
   for each row execute function public.set_updated_at();

-- RLS Policies
 alter table public.subject_xp enable row level security;

 create policy "subject_xp: own read"
   on public.subject_xp for select
   using (auth.uid() = user_id);

 create policy "subject_xp: public read by subject"
   on public.subject_xp for select
   using (true);  -- Le classement par matière est public

-- ─── Vue : leaderboard_by_subject ─────────────────────────────────────────────
create or replace view public.leaderboard_by_subject as
select
  p.id,
  p.name,
  p.avatar_seed,
  p.avatar_url,
  p.level_id,
  p.country,
  sx.subject_id,
  sx.xp as total_xp,
  rank() over (partition by sx.subject_id order by sx.xp desc) as rank
from public.profiles p
join public.subject_xp sx on p.id = sx.user_id
where sx.xp > 0;

-- Lecture publique de la vue
grant select on public.leaderboard_by_subject to anon, authenticated;

-- ─── Fonction : récupérer le classement par matière ─────────────────────────────
create or replace function public.get_leaderboard_by_subject(p_subject_id text, p_limit integer default 50)
returns table (
  id uuid,
  name text,
  avatar_seed text,
  avatar_url text,
  level_id text,
  country text,
  subject_id text,
  total_xp integer,
  rank bigint
) language sql stable as $$
  select *
  from public.leaderboard_by_subject
  where subject_id = p_subject_id
  order by rank
  limit p_limit;
$$;

-- ─── Fonction : mettre à jour l'XP par matière (à appeler après un quiz) ─────────
create or replace function public.update_subject_xp(
  p_user_id uuid,
  p_subject_id text,
  p_xp_to_add integer
) returns void language plpgsql as $$
begin
  insert into public.subject_xp (user_id, subject_id, xp)
  values (p_user_id, p_subject_id, p_xp_to_add)
  on conflict (user_id, subject_id)
  do update set xp = subject_xp.xp + p_xp_to_add, updated_at = now();
end;
$$;

-- ─── Trigger : mise à jour automatique de subject_xp après un quiz ──────────────
create or replace function public.handle_quiz_completion()
returns trigger language plpgsql as $$
begin
  -- Mettre à jour l'XP totale du profil (déjà géré ailleurs mais on s'assure)
  -- Mettre à jour l'XP par matière
  perform public.update_subject_xp(NEW.user_id, NEW.subject_id, NEW.score);
  return NEW;
end;
$$;

-- Supprimer le trigger s'il existe déjà pour éviter les doublons
 drop trigger if exists on_quiz_completed on public.quiz_history;

 create trigger on_quiz_completed
   after insert on public.quiz_history
   for each row
   execute function public.handle_quiz_completion();
