-- Table pour le rate limiting des appels IA (génération de questions)
create table if not exists public.ai_rate_limits (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Index pour les requêtes de comptage par user + fenêtre temporelle
create index if not exists ai_rate_limits_user_time_idx
  on public.ai_rate_limits (user_id, created_at desc);

-- Nettoyage automatique des entrées > 2h (via pg_cron ou trigger)
-- On garde 2h pour avoir une marge de sécurité
create or replace function public.cleanup_ai_rate_limits()
returns void language sql security definer as $$
  delete from public.ai_rate_limits
  where created_at < now() - interval '2 hours';
$$;

-- RLS : chaque user ne voit que ses propres entrées
alter table public.ai_rate_limits enable row level security;

create policy "Users can read own rate limits"
  on public.ai_rate_limits for select
  using (auth.uid() = user_id);

-- L'insert se fait via service role depuis l'Edge Function (pas besoin de policy insert pour les users)
