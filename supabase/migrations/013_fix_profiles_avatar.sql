-- ============================================================
-- Migration 013 — Ajout avatar_url manquant dans profiles
-- ============================================================

-- Ajouter la colonne avatar_url si elle n'existe pas
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Mettre à jour la vue leaderboard pour inclure avatar_url
CREATE OR REPLACE VIEW public.leaderboard AS
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

-- Réappliquer les permissions
GRANT SELECT ON public.leaderboard TO anon, authenticated;

-- Vérifier que tous les profils ont un level_id
UPDATE public.profiles 
SET level_id = 'terminale' 
WHERE level_id IS NULL OR level_id = '';

