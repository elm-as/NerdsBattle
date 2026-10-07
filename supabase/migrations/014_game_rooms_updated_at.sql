-- ============================================================
-- Migration 014 — Ajout de updated_at dans game_rooms
-- ============================================================

-- Ajouter la colonne updated_at si elle n'existe pas
ALTER TABLE public.game_rooms 
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Mettre à jour les valeurs existantes
UPDATE public.game_rooms 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Trigger pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION public.set_game_rooms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS game_rooms_updated_at ON public.game_rooms;

-- Créer le trigger
CREATE TRIGGER game_rooms_updated_at
  BEFORE UPDATE ON public.game_rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.set_game_rooms_updated_at();

