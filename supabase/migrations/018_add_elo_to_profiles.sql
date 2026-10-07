-- Ajouter le système de classement Elo aux profils
-- Elo initial : 400 (niveau Bronze)
-- Elo minimum : 200 (jamais en dessous)

-- 1. Ajouter la colonne elo à la table profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS elo INTEGER DEFAULT 400;

-- 2. Ajouter des colonnes pour les statistiques Elo
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS elo_rank VARCHAR(50) DEFAULT 'bronze';  -- bronze, silver, gold, platinum, diamond, legend

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS wins INTEGER DEFAULT 0;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS losses INTEGER DEFAULT 0;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS win_streak INTEGER DEFAULT 0;

-- 3. Index pour rechercher rapidement par Elo
CREATE INDEX IF NOT EXISTS idx_profiles_elo ON profiles(elo DESC);

-- 4. Fonction pour mettre à jour le rang automatiquement selon l'Elo
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

-- 5. Trigger pour mettre à jour le rang automatiquement
DROP TRIGGER IF EXISTS trigger_update_elo_rank ON profiles;

CREATE TRIGGER trigger_update_elo_rank
  BEFORE INSERT OR UPDATE OF elo ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_elo_rank();

-- 6. Mettre à jour les rangs existants
UPDATE profiles SET elo_rank = 'bronze' WHERE elo < 1000;
UPDATE profiles SET elo_rank = 'silver' WHERE elo >= 1000 AND elo < 1500;
UPDATE profiles SET elo_rank = 'gold' WHERE elo >= 1500 AND elo < 2000;
UPDATE profiles SET elo_rank = 'platinum' WHERE elo >= 2000 AND elo < 2500;
UPDATE profiles SET elo_rank = 'diamond' WHERE elo >= 2500 AND elo < 3000;
UPDATE profiles SET elo_rank = 'legend' WHERE elo >= 3000;

-- 7. Supprimer d'abord les vues existantes (pour éviter les erreurs de colonnes)
DROP VIEW IF EXISTS leaderboard;
DROP VIEW IF EXISTS leaderboard_by_subject;

-- Recréer la vue leaderboard avec CLASSEMENT PAR ELO (pas par XP)
-- Un seul classement compétitif comme chess.com
CREATE VIEW leaderboard AS
SELECT 
  p.id,
  p.name,
  p.avatar_url,
  p.avatar_seed,
  p.level_id,
  p.country,
  p.elo,
  p.elo_rank,
  COALESCE(SUM(qh.score), 0) as total_xp,
  p.wins,
  p.losses,
  CASE 
    WHEN (p.wins + p.losses) > 0 
    THEN ROUND(p.wins::numeric / (p.wins + p.losses) * 100, 1)
    ELSE 0 
  END as win_rate,
  RANK() OVER (ORDER BY p.elo DESC) as rank  -- CLASSEMENT PAR ELO
FROM profiles p
LEFT JOIN quiz_history qh ON qh.user_id = p.id
GROUP BY p.id, p.name, p.avatar_url, p.avatar_seed, p.level_id, p.country, p.elo, p.elo_rank, p.wins, p.losses;

-- 8. Vue leaderboard_by_subject avec CLASSEMENT PAR ELO
CREATE VIEW leaderboard_by_subject AS
SELECT 
  p.id,
  p.name,
  p.avatar_url,
  p.avatar_seed,
  p.level_id,
  p.country,
  sx.subject_id,
  p.elo,
  p.elo_rank,
  COALESCE(sx.xp, 0) as total_xp,
  p.wins,
  p.losses,
  CASE 
    WHEN (p.wins + p.losses) > 0 
    THEN ROUND(p.wins::numeric / (p.wins + p.losses) * 100, 1)
    ELSE 0 
  END as win_rate,
  RANK() OVER (PARTITION BY sx.subject_id ORDER BY p.elo DESC) as rank  -- CLASSEMENT PAR ELO
FROM profiles p
LEFT JOIN subject_xp sx ON sx.user_id = p.id
WHERE sx.xp > 0 AND (p.wins + p.losses) > 0;  -- Seulement ceux qui ont fait des battles

-- 9. Ajouter colonnes Elo à quiz_history pour traçabilité
ALTER TABLE quiz_history 
ADD COLUMN IF NOT EXISTS elo_change INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS new_elo INTEGER;

-- 10. Vue pour le classement compétitif par Elo
DROP VIEW IF EXISTS leaderboard_competitive;
CREATE VIEW leaderboard_competitive AS
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
    THEN ROUND(p.wins::numeric / (p.wins + p.losses) * 100, 1)
    ELSE 0 
  END as win_rate,
  RANK() OVER (ORDER BY p.elo DESC) as rank
FROM profiles p
WHERE p.wins + p.losses > 0;  -- Seulement ceux qui ont joué au moins 1 battle

-- 11. Permissions
GRANT SELECT ON leaderboard_competitive TO anon, authenticated;
