-- ============================================================
-- Migration 009 — Synchronise les données joueur avec Supabase
-- ============================================================

-- 1. Ajouter les colonnes de stats à la table profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS streak_count INTEGER DEFAULT 0 CHECK (streak_count >= 0);

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS streak_last DATE;

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0 CHECK (total_xp >= 0);

-- 2. Mettre à jour les valeurs NULL
UPDATE public.profiles SET streak_count = 0 WHERE streak_count IS NULL;
UPDATE public.profiles SET total_xp = 0 WHERE total_xp IS NULL;

-- 3. S'assurer que quiz_history existe avec la bonne structure
-- (déjà créée dans 001_initial_schema.sql, mais on vérifie)

-- 4. Ajouter une colonne user_id si elle n'existe pas déjà
-- et s'assurer qu'elle référence bien profiles.id

-- 5. Permissions
GRANT ALL ON public.quiz_history TO authenticated;
GRANT SELECT ON public.quiz_history TO anon;

-- 6. Policy pour quiz_history (déjà dans 001 mais on s'assure)
DROP POLICY IF EXISTS "history: own read" ON public.quiz_history;
DROP POLICY IF EXISTS "history: own insert" ON public.quiz_history;

CREATE POLICY "history: own read"
  ON public.quiz_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "history: own insert"
  ON public.quiz_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 7. Supprimer et recréer la vue leaderboard pour inclure les nouvelles colonnes
DROP VIEW IF EXISTS public.leaderboard;

CREATE VIEW public.leaderboard AS
SELECT
  p.id,
  p.name,
  p.avatar_seed,
  p.avatar_url,
  p.level_id,
  p.country,
  p.total_xp,
  p.streak_count,
  rank() over (order by p.total_xp desc) as rank
FROM public.profiles p
WHERE p.total_xp > 0 OR p.streak_count > 0;

-- 8. Recréer la permission pour la vue leaderboard
GRANT SELECT ON public.leaderboard TO anon, authenticated;

