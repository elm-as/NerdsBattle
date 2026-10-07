-- ============================================================
-- Migration 012 — Ajout des avatars dans game_rooms
-- ============================================================

-- Ajouter les colonnes pour les avatars
ALTER TABLE public.game_rooms 
  ADD COLUMN IF NOT EXISTS host_avatar TEXT,
  ADD COLUMN IF NOT EXISTS guest_avatar TEXT,
  ADD COLUMN IF NOT EXISTS host_name TEXT,
  ADD COLUMN IF NOT EXISTS guest_name TEXT;

-- Mettre à jour les avatars quand un joueur rejoint
CREATE OR REPLACE FUNCTION public.update_room_player_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Si guest rejoint, récupérer son profil
  IF NEW.guest_id IS NOT NULL AND OLD.guest_id IS NULL THEN
    SELECT name, avatar_url INTO NEW.guest_name, NEW.guest_avatar
    FROM public.profiles
    WHERE id = NEW.guest_id;
  END IF;
  
  -- Si host crée, récupérer son profil
  IF TG_OP = 'INSERT' THEN
    SELECT name, avatar_url INTO NEW.host_name, NEW.host_avatar
    FROM public.profiles
    WHERE id = NEW.host_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour automatiquement
DROP TRIGGER IF EXISTS set_room_player_data ON public.game_rooms;
CREATE TRIGGER set_room_player_data
  BEFORE INSERT OR UPDATE ON public.game_rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_room_player_data();

-- Mise à jour des rooms existantes
UPDATE public.game_rooms gr
SET 
  host_name = p.name,
  host_avatar = p.avatar_url
FROM public.profiles p
WHERE gr.host_id = p.id AND gr.host_name IS NULL;

