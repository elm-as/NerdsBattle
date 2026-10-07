-- Migration: Fonctions RPC pour les stats PvP
-- Objectif: Créer les fonctions increment_wins et increment_losses

-- Fonction pour incrémenter les victoires
DROP FUNCTION IF EXISTS increment_wins(UUID);

CREATE OR REPLACE FUNCTION increment_wins(p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET wins = COALESCE(wins, 0) + 1,
      win_streak = COALESCE(win_streak, 0) + 1,
      updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour incrémenter les défaites
DROP FUNCTION IF EXISTS increment_losses(UUID);

CREATE OR REPLACE FUNCTION increment_losses(p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET losses = COALESCE(losses, 0) + 1,
      win_streak = 0,  -- Reset streak
      updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissions
GRANT EXECUTE ON FUNCTION increment_wins(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_losses(UUID) TO authenticated;

-- Commentaires
COMMENT ON FUNCTION increment_wins IS 'Incrémente les victoires et la série de victoires';
COMMENT ON FUNCTION increment_losses IS 'Incrémente les défaites et reset la série';
