-- Migration: Correction de la valeur par défaut Elo
-- Objectif: S'assurer que tous les nouveaux joueurs commencent à 400 Elo (bronze)

-- 1. Modifier la valeur par défaut de la colonne elo à 400
ALTER TABLE profiles 
ALTER COLUMN elo SET DEFAULT 400;

-- 2. Modifier la valeur par défaut du rang à 'bronze'
ALTER TABLE profiles 
ALTER COLUMN elo_rank SET DEFAULT 'bronze';

-- 3. Mettre à jour les profils qui ont encore 1000 Elo (ancienne valeur par défaut)
UPDATE profiles 
SET 
  elo = 400,
  elo_rank = 'bronze'
WHERE elo = 1000 AND (
  -- Seulement ceux qui n'ont pas encore joué de battle (nouveaux joueurs)
  wins = 0 AND losses = 0
);

-- 4. S'assurer que le trigger update_elo_rank est à jour
DROP TRIGGER IF EXISTS update_elo_rank_trigger ON profiles;

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

CREATE TRIGGER update_elo_rank_trigger
  BEFORE INSERT OR UPDATE OF elo ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_elo_rank();
