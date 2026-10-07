-- ============================================================
-- Migration 010 — Système de matchmaking et salles de jeu
-- ============================================================

-- 1. Table des salles de jeu (game rooms)
CREATE TABLE IF NOT EXISTS public.game_rooms (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status          TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished', 'cancelled')),
  mode            TEXT NOT NULL DEFAULT '1v1' CHECK (mode IN ('1v1', '2v2')),
  level_id        TEXT NOT NULL,
  subject_id      TEXT,
  course_id       TEXT,
  host_score      INTEGER DEFAULT 0 CHECK (host_score >= 0),
  guest_score     INTEGER DEFAULT 0 CHECK (guest_score >= 0),
  host_ready      BOOLEAN DEFAULT false,
  guest_ready     BOOLEAN DEFAULT false,
  host_answers    JSONB DEFAULT '[]',
  guest_answers   JSONB DEFAULT '[]',
  current_question INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  started_at      TIMESTAMPTZ,
  finished_at     TIMESTAMPTZ,
  winner_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Index pour rechercher rapidement les salles disponibles
CREATE INDEX IF NOT EXISTS idx_game_rooms_status ON public.game_rooms(status);
CREATE INDEX IF NOT EXISTS idx_game_rooms_level ON public.game_rooms(level_id);
CREATE INDEX IF NOT EXISTS idx_game_rooms_host ON public.game_rooms(host_id);

-- 2. Table de présence (qui est en ligne)
CREATE TABLE IF NOT EXISTS public.user_presence (
  user_id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'in_game', 'away')),
  current_room_id UUID REFERENCES public.game_rooms(id) ON DELETE SET NULL,
  last_seen       TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 3. RLS Policies pour game_rooms
ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rooms: public read" ON public.game_rooms;
DROP POLICY IF EXISTS "rooms: host insert" ON public.game_rooms;
DROP POLICY IF EXISTS "rooms: participants update" ON public.game_rooms;

-- Tout le monde peut voir les salles en attente
CREATE POLICY "rooms: public read"
  ON public.game_rooms
  FOR SELECT
  USING (status = 'waiting' OR host_id = auth.uid() OR guest_id = auth.uid());

-- Seul l'hôte peut créer une salle
CREATE POLICY "rooms: host insert"
  ON public.game_rooms
  FOR INSERT
  WITH CHECK (host_id = auth.uid());

-- Les participants peuvent mettre à jour leur salle
CREATE POLICY "rooms: participants update"
  ON public.game_rooms
  FOR UPDATE
  USING (host_id = auth.uid() OR guest_id = auth.uid());

-- 4. RLS Policies pour user_presence
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "presence: own read" ON public.user_presence;
DROP POLICY IF EXISTS "presence: own upsert" ON public.user_presence;

CREATE POLICY "presence: public read"
  ON public.user_presence
  FOR SELECT
  USING (true);

CREATE POLICY "presence: own upsert"
  ON public.user_presence
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 5. Permissions
GRANT ALL ON public.game_rooms TO authenticated;
GRANT ALL ON public.user_presence TO authenticated;
GRANT SELECT ON public.game_rooms TO anon;
GRANT SELECT ON public.user_presence TO anon;

-- 6. Fonction pour nettoyer les vieilles salles (cron job)
CREATE OR REPLACE FUNCTION public.cleanup_old_rooms()
RETURNS void AS $$
BEGIN
  DELETE FROM public.game_rooms 
  WHERE status = 'waiting' 
    AND created_at < now() - interval '10 minutes';
  
  DELETE FROM public.game_rooms 
  WHERE status = 'finished' 
    AND finished_at < now() - interval '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Trigger pour mettre à jour last_seen
CREATE OR REPLACE FUNCTION public.update_presence_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.last_seen = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_presence_timestamp ON public.user_presence;
CREATE TRIGGER update_presence_timestamp
  BEFORE UPDATE ON public.user_presence
  FOR EACH ROW
  EXECUTE FUNCTION public.update_presence_timestamp();

