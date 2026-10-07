-- ============================================================
-- Migration 016 — Fix matchmaking : schéma, policies, trigger
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. Harmoniser le CHECK constraint sur status
--    Le code JS utilise : waiting / ready / playing / done
--    La migration 010 avait ajouté : finished / cancelled
--    On accepte tous les statuts pour ne rien casser.
-- ──────────────────────────────────────────────────────────────

-- Supprimer l'ancien CHECK constraint (nom variable selon migration)
ALTER TABLE public.game_rooms DROP CONSTRAINT IF EXISTS game_rooms_status_check;

-- Recréer avec tous les statuts nécessaires
ALTER TABLE public.game_rooms
  ADD CONSTRAINT game_rooms_status_check
  CHECK (status IN ('waiting', 'ready', 'playing', 'done', 'finished', 'cancelled'));

-- ──────────────────────────────────────────────────────────────
-- 2. Supprimer les policies RLS conflictuelles (005 + 010)
--    et recréer un set unique et sécurisé
-- ──────────────────────────────────────────────────────────────

-- Supprimer toutes les policies existantes sur game_rooms
DROP POLICY IF EXISTS "Read open rooms"        ON public.game_rooms;
DROP POLICY IF EXISTS "Host can insert"        ON public.game_rooms;
DROP POLICY IF EXISTS "Players can update"     ON public.game_rooms;   -- ← celle avec OR status='waiting' (dangereuse)
DROP POLICY IF EXISTS "rooms: public read"     ON public.game_rooms;
DROP POLICY IF EXISTS "rooms: host insert"     ON public.game_rooms;
DROP POLICY IF EXISTS "rooms: participants update" ON public.game_rooms;

-- SELECT : voir les rooms waiting (pour matchmaking) + ses propres rooms
CREATE POLICY "rooms: select"
  ON public.game_rooms FOR SELECT
  USING (
    status = 'waiting'
    OR host_id = auth.uid()
    OR guest_id = auth.uid()
  );

-- INSERT : seul l'hôte crée sa room
CREATE POLICY "rooms: insert"
  ON public.game_rooms FOR INSERT
  WITH CHECK (host_id = auth.uid());

-- UPDATE : participants OU guest qui rejoint une room waiting
-- Le guest n'est pas encore dans guest_id au moment du join,
-- donc on a besoin de laisser les users authentifiés updater les rooms 'waiting'
-- mais SEULEMENT si guest_id est NULL (pas déjà prise)
CREATE POLICY "rooms: update"
  ON public.game_rooms FOR UPDATE
  USING (
    host_id = auth.uid()
    OR guest_id = auth.uid()
    OR (status = 'waiting' AND guest_id IS NULL)
  );

-- DELETE : le host peut supprimer sa room
CREATE POLICY "rooms: delete"
  ON public.game_rooms FOR DELETE
  USING (host_id = auth.uid());

-- ──────────────────────────────────────────────────────────────
-- 3. Index pour filtrer les rooms fraîches dans le matchmaking
-- ──────────────────────────────────────────────────────────────

-- Supprimer les anciens index si nécessaire
DROP INDEX IF EXISTS game_rooms_open_idx;

CREATE INDEX IF NOT EXISTS game_rooms_matchmaking_idx
  ON public.game_rooms (mode, subject_id, status, created_at DESC)
  WHERE status = 'waiting' AND guest_id IS NULL;

-- ──────────────────────────────────────────────────────────────
-- 4. Mettre à jour cleanup_old_rooms() pour nettoyer aussi
--    les rooms 'ready' abandonnées (> 3 min) et les zombies
-- ──────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.cleanup_old_rooms()
RETURNS void AS $$
BEGIN
  -- Rooms 'waiting' de plus de 5 minutes → supprimées
  DELETE FROM public.game_rooms
  WHERE status = 'waiting'
    AND created_at < now() - interval '5 minutes';

  -- Rooms 'ready' de plus de 3 minutes (guest a rejoint mais jamais commencé)
  DELETE FROM public.game_rooms
  WHERE status = 'ready'
    AND created_at < now() - interval '3 minutes';

  -- Rooms 'playing' de plus de 30 minutes (partie zombie)
  DELETE FROM public.game_rooms
  WHERE status = 'playing'
    AND created_at < now() - interval '30 minutes';

  -- Rooms 'done'/'finished' de plus de 1 heure
  DELETE FROM public.game_rooms
  WHERE status IN ('done', 'finished')
    AND created_at < now() - interval '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ──────────────────────────────────────────────────────────────
-- 5. Corriger le trigger update_room_player_data
--    Le trigger fait autorité : il remplit les données depuis profiles.
--    Il ne doit PAS écraser si le profil n'a pas la donnée (NULL).
-- ──────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_room_player_data()
RETURNS TRIGGER AS $$
DECLARE
  v_name TEXT;
  v_avatar TEXT;
  v_xp INTEGER;
  v_seed TEXT;
BEGIN
  -- Si guest rejoint (guest_id passe de NULL à une valeur)
  IF NEW.guest_id IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.guest_id IS NULL) THEN
    SELECT
      name,
      avatar_url,
      COALESCE(total_xp, 0),
      avatar_seed
    INTO v_name, v_avatar, v_xp, v_seed
    FROM public.profiles
    WHERE id = NEW.guest_id;

    -- Toujours utiliser les données du profil (source de vérité, anti-triche)
    NEW.guest_name        := COALESCE(v_name, NEW.guest_name, 'Adversaire');
    NEW.guest_avatar      := COALESCE(v_avatar, NEW.guest_avatar);
    NEW.guest_xp          := COALESCE(v_xp, NEW.guest_xp, 0);
    NEW.guest_avatar_seed := COALESCE(v_seed, NEW.guest_avatar_seed);
  END IF;

  -- Si host crée la room
  IF TG_OP = 'INSERT' THEN
    SELECT
      name,
      avatar_url,
      COALESCE(total_xp, 0),
      avatar_seed
    INTO v_name, v_avatar, v_xp, v_seed
    FROM public.profiles
    WHERE id = NEW.host_id;

    NEW.host_name        := COALESCE(v_name, NEW.host_name, 'Hôte');
    NEW.host_avatar      := COALESCE(v_avatar, NEW.host_avatar);
    NEW.host_xp          := COALESCE(v_xp, NEW.host_xp, 0);
    NEW.host_avatar_seed := COALESCE(v_seed, NEW.host_avatar_seed);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Le trigger existe déjà (migration 012), pas besoin de le recréer

