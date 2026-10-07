-- Migration: Correction des Elo existants
-- Objectif: Passer les profils de Elo 1000/silver à 400/bronze

-- 1. Mettre à jour les profils existants qui ont encore l'ancienne valeur par défaut
UPDATE profiles 
SET 
  elo = 400,
  elo_rank = 'bronze'
WHERE elo = 1000 AND elo_rank = 'silver';

-- 2. S'assurer que le trigger update_elo_rank est bien en place
-- D'abord supprimer le trigger (dépend de la fonction)
DROP TRIGGER IF EXISTS update_elo_rank_trigger ON profiles;
DROP TRIGGER IF EXISTS trigger_update_elo_rank ON profiles;

-- Puis supprimer la fonction
DROP FUNCTION IF EXISTS update_elo_rank();

CREATE OR REPLACE FUNCTION update_elo_rank()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour le rang selon l'Elo
  IF NEW.elo < 1000 THEN
    NEW.elo_rank := 'bronze';
  ELSIF NEW.elo < 1500 THEN
    NEW.elo_rank := 'silver';
  ELSIF NEW.elo < 2000 THEN
    NEW.elo_rank := 'gold';
  ELSIF NEW.elo < 2500 THEN
    NEW.elo_rank := 'platinum';
  ELSIF NEW.elo < 3000 THEN
    NEW.elo_rank := 'diamond';
  ELSE
    NEW.elo_rank := 'legend';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Recréer le trigger sur la table profiles
CREATE TRIGGER update_elo_rank_trigger
  BEFORE INSERT OR UPDATE OF elo ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_elo_rank();

-- 4. Fixer la vue leaderboard_by_subject pour utiliser Elo au lieu de XP
-- (La version précédente utilisait sx.xp mais on veut le classement par Elo)
DROP VIEW IF EXISTS leaderboard_by_subject;

CREATE VIEW leaderboard_by_subject AS
SELECT 
  p.id,
  p.name,
  p.avatar_url,
  p.avatar_seed,
  p.level_id,
  p.country,
  p.elo,
  p.elo_rank,
  sx.subject_id,
  sx.xp as subject_xp,
  p.wins,
  p.losses,
  CASE 
    WHEN (p.wins + p.losses) > 0 
    THEN ROUND((p.wins::numeric / (p.wins + p.losses)) * 100, 1)
    ELSE 0 
  END as win_rate,
  RANK() OVER (PARTITION BY sx.subject_id ORDER BY p.elo DESC) as rank
FROM profiles p
LEFT JOIN subject_xp sx ON sx.user_id = p.id
WHERE sx.xp > 0 AND (p.wins + p.losses) > 0;

-- 5. Créer une vue alternative pour le classement par matière basé sur l'XP (optionnel)
DROP VIEW IF EXISTS leaderboard_by_subject_xp;

CREATE VIEW leaderboard_by_subject_xp AS
SELECT 
  p.id,
  p.name,
  p.avatar_url,
  p.avatar_seed,
  p.level_id,
  p.country,
  sx.subject_id,
  sx.xp as total_xp,
  RANK() OVER (PARTITION BY sx.subject_id ORDER BY sx.xp DESC) as rank
FROM profiles p
JOIN subject_xp sx ON p.id = sx.user_id
WHERE sx.xp > 0;

-- 6. Permissions
GRANT SELECT ON leaderboard_by_subject TO anon, authenticated;
GRANT SELECT ON leaderboard_by_subject_xp TO anon, authenticated;

-- 7. Commentaires
-- 8. Vue pour le classement par niveau scolaire (Elo)
DROP VIEW IF EXISTS leaderboard_by_level;

CREATE VIEW leaderboard_by_level AS
SELECT 
  p.id,
  p.name,
  p.avatar_url,
  p.avatar_seed,
  p.level_id,
  p.country,
  p.elo,
  p.elo_rank,
  p.wins,
  p.losses,
  CASE 
    WHEN (p.wins + p.losses) > 0 
    THEN ROUND((p.wins::numeric / (p.wins + p.losses)) * 100, 1)
    ELSE 0 
  END as win_rate,
  RANK() OVER (PARTITION BY p.level_id ORDER BY p.elo DESC) as rank
FROM profiles p
WHERE (p.wins + p.losses) > 0;

-- 9. Fonction pour récupérer le classement par niveau
DROP FUNCTION IF EXISTS get_leaderboard_by_level(text, integer);

CREATE OR REPLACE FUNCTION get_leaderboard_by_level(p_level_id text, p_limit integer default 50)
RETURNS TABLE (
  id uuid,
  name text,
  avatar_url text,
  avatar_seed text,
  level_id text,
  country text,
  elo integer,
  elo_rank text,
  wins integer,
  losses integer,
  win_rate numeric,
  rank bigint
) LANGUAGE sql STABLE AS $$
  SELECT *
  FROM leaderboard_by_level
  WHERE level_id = p_level_id
  ORDER BY rank
  LIMIT p_limit;
$$;

-- 10. Permissions
GRANT SELECT ON leaderboard_by_level TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_leaderboard_by_level(text, integer) TO anon, authenticated;

-- 11. Fonction pour recalculer subject_xp à partir de quiz_history
DROP FUNCTION IF EXISTS recalculate_subject_xp();

CREATE OR REPLACE FUNCTION recalculate_subject_xp()
RETURNS INTEGER AS $$
DECLARE
  inserted_count INTEGER;
BEGIN
  -- Vider la table subject_xp
  DELETE FROM subject_xp;
  
  -- Recalculer à partir de quiz_history
  INSERT INTO subject_xp (user_id, subject_id, xp, updated_at)
  SELECT 
    user_id,
    subject_id,
    SUM(score * 10) as xp,  -- 10 XP par point
    NOW() as updated_at
  FROM quiz_history
  WHERE subject_id IS NOT NULL
  GROUP BY user_id, subject_id;
  
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION recalculate_subject_xp() TO authenticated;

-- 12. Recalculer immédiatement les subject_xp
-- Note: Si quiz_history est vide, cette fonction ne fera rien
SELECT recalculate_subject_xp();

-- 13. Insérer des données de test pour subject_xp si profiles.subjects existe
-- Cette requête fonctionne avec le format text[] (array PostgreSQL)
INSERT INTO subject_xp (user_id, subject_id, xp, updated_at)
SELECT 
  p.id,
  unnest(p.subjects) as subject_id,
  p.total_xp as xp,
  NOW() as updated_at
FROM profiles p
WHERE p.subjects IS NOT NULL 
  AND array_length(p.subjects, 1) > 0
  AND p.total_xp > 0
ON CONFLICT (user_id, subject_id) DO UPDATE 
SET xp = EXCLUDED.xp, updated_at = NOW();

-- Commentaires
COMMENT ON VIEW leaderboard_by_subject IS 'Classement par matière basé sur l''Elo (comme chess.com) - inclut seulement les joueurs avec au moins 1 partie';
COMMENT ON VIEW leaderboard_by_subject_xp IS 'Classement par matière basé sur l''XP (alternatif)';
COMMENT ON VIEW leaderboard_by_level IS 'Classement par niveau scolaire basé sur l''Elo - inclut seulement les joueurs avec au moins 1 partie';
COMMENT ON FUNCTION recalculate_subject_xp() IS 'Recalcule les XP par matière à partir de l''historique des quiz';
