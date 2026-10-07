-- ============================================================
-- Migration 015 — Ajout XP et avatar_seed dans game_rooms
-- ============================================================

-- Ajouter les colonnes pour XP et avatar_seed
ALTER TABLE public.game_rooms 
  ADD COLUMN IF NOT EXISTS host_xp INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS guest_xp INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS host_avatar_seed TEXT,
  ADD COLUMN IF NOT EXISTS guest_avatar_seed TEXT;

-- Mettre à jour le trigger pour récupérer aussi xp et avatar_seed
CREATE OR REPLACE FUNCTION public.update_room_player_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Si guest rejoint, récupérer son profil
  IF NEW.guest_id IS NOT NULL AND OLD.guest_id IS NULL THEN
    SELECT 
      name, 
      avatar_url, 
      COALESCE(total_xp, 0),
      avatar_seed
    INTO 
      NEW.guest_name, 
      NEW.guest_avatar,
      NEW.guest_xp,
      NEW.guest_avatar_seed
    FROM public.profiles
    WHERE id = NEW.guest_id;
  END IF;
  
  -- Si host crée, récupérer son profil
  IF TG_OP = 'INSERT' THEN
    SELECT 
      name, 
      avatar_url,
      COALESCE(total_xp, 0),
      avatar_seed
    INTO 
      NEW.host_name, 
      NEW.host_avatar,
      NEW.host_xp,
      NEW.host_avatar_seed
    FROM public.profiles
    WHERE id = NEW.host_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Le trigger existe déjà, pas besoin de le recréer
