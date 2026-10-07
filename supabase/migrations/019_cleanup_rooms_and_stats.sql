-- Migration: Cleanup des rooms et optimisation des stats
-- Objectif: Nettoyer les rooms zombies et améliorer les performances

-- 1. Indexes pour game_rooms (performance critique)
CREATE INDEX IF NOT EXISTS idx_game_rooms_status ON game_rooms(status);
CREATE INDEX IF NOT EXISTS idx_game_rooms_created_at ON game_rooms(created_at);
CREATE INDEX IF NOT EXISTS idx_game_rooms_host_id ON game_rooms(host_id);
CREATE INDEX IF NOT EXISTS idx_game_rooms_guest_id ON game_rooms(guest_id);
CREATE INDEX IF NOT EXISTS idx_game_rooms_status_created ON game_rooms(status, created_at);

-- 2. Index pour quiz_history (performance)
CREATE INDEX IF NOT EXISTS idx_quiz_history_user_id ON quiz_history(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_history_played_at ON quiz_history(played_at);
CREATE INDEX IF NOT EXISTS idx_quiz_history_mode ON quiz_history(mode);

-- 3. Fonction pour nettoyer les vieilles rooms (zombies)
-- Supprimer d'abord si existe (pour éviter l'erreur de changement de type de retour)
DROP FUNCTION IF EXISTS cleanup_old_rooms();

CREATE OR REPLACE FUNCTION cleanup_old_rooms()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Supprimer les rooms en 'waiting' ou 'ready' depuis plus de 10 minutes
  -- et les rooms 'done' depuis plus de 1 heure
  DELETE FROM game_rooms
  WHERE (
    status IN ('waiting', 'ready') 
    AND created_at < NOW() - INTERVAL '10 minutes'
  )
  OR (
    status = 'done'
    AND updated_at < NOW() - INTERVAL '1 hour'
  )
  OR (
    status = 'playing'
    AND started_at < NOW() - INTERVAL '30 minutes'  -- Partie bloquée depuis 30min
  );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 4. Vue pour les statistiques réelles (en temps réel)
DROP VIEW IF EXISTS realtime_stats;
CREATE VIEW realtime_stats AS
SELECT
  -- Utilisateurs en ligne (sessions actives dans les dernières 5 minutes)
  (SELECT COUNT(DISTINCT user_id) 
   FROM auth.sessions 
   WHERE created_at > NOW() - INTERVAL '5 minutes'
  ) as users_online,
  
  -- Parties en cours (status 'playing' et pas vieilles)
  (SELECT COUNT(*) 
   FROM game_rooms 
   WHERE status = 'playing' 
   AND started_at > NOW() - INTERVAL '30 minutes'
  ) as active_games,
  
  -- Rooms en attente (matchmaking actif)
  (SELECT COUNT(*) 
   FROM game_rooms 
   WHERE status = 'waiting' 
   AND created_at > NOW() - INTERVAL '10 minutes'
  ) as waiting_rooms,
  
  -- Total des utilisateurs inscrits
  (SELECT COUNT(*) FROM profiles) as total_users,
  
  -- Battles aujourd'hui
  (SELECT COUNT(*) 
   FROM quiz_history 
   WHERE mode IN ('1v1', '2v2')
   AND played_at > CURRENT_DATE
  ) as battles_today,
  
  -- Dernière mise à jour
  NOW() as last_updated;

-- 5. Vue matérialisée pour les stats (mise à jour périodique, plus rapide)
DROP MATERIALIZED VIEW IF EXISTS cached_stats;
CREATE MATERIALIZED VIEW cached_stats AS
SELECT * FROM realtime_stats;

-- Index sur la vue matérialisée
CREATE UNIQUE INDEX idx_cached_stats_singleton ON cached_stats((1));

-- 6. Fonction pour rafraîchir les stats (à appeler par un cron)
DROP FUNCTION IF EXISTS refresh_cached_stats();

CREATE OR REPLACE FUNCTION refresh_cached_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY cached_stats;
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger pour nettoyer automatiquement quand une room est créée
-- (garde seulement les 50 rooms les plus récentes par statut)
DROP FUNCTION IF EXISTS trim_old_rooms();

CREATE OR REPLACE FUNCTION trim_old_rooms()
RETURNS TRIGGER AS $$
BEGIN
  -- Garder seulement les 100 rooms les plus récentes en 'waiting'/'ready'
  DELETE FROM game_rooms
  WHERE id IN (
    SELECT id FROM game_rooms
    WHERE status IN ('waiting', 'ready')
    ORDER BY created_at DESC
    OFFSET 100
  );
  
  -- Garder seulement les 50 rooms 'done' les plus récentes
  DELETE FROM game_rooms
  WHERE id IN (
    SELECT id FROM game_rooms
    WHERE status = 'done'
    ORDER BY updated_at DESC
    OFFSET 50
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS trim_rooms_trigger ON game_rooms;

-- Créer le trigger (déclenché après chaque insertion)
CREATE TRIGGER trim_rooms_trigger
  AFTER INSERT ON game_rooms
  FOR EACH ROW
  EXECUTE FUNCTION trim_old_rooms();

-- 8. Fonction utilitaire: Archiver une room terminée
DROP FUNCTION IF EXISTS archive_finished_room(UUID);

CREATE OR REPLACE FUNCTION archive_finished_room(room_uuid UUID)
RETURNS void AS $$
BEGIN
  -- Optionnel: insérer dans une table d'archive avant suppression
  -- Pour l'instant, on supprime simplement
  DELETE FROM game_rooms WHERE id = room_uuid AND status = 'done';
END;
$$ LANGUAGE plpgsql;

-- 9. Vue pour les rooms actives seulement (à utiliser dans l'UI)
DROP VIEW IF EXISTS active_rooms;
CREATE VIEW active_rooms AS
SELECT *
FROM game_rooms
WHERE (
  status = 'waiting' AND created_at > NOW() - INTERVAL '10 minutes'
)
OR (
  status = 'ready' AND created_at > NOW() - INTERVAL '10 minutes'
)
OR (
  status = 'playing' AND started_at > NOW() - INTERVAL '30 minutes'
);

-- 10. Permissions
GRANT SELECT ON realtime_stats TO anon, authenticated;
GRANT SELECT ON cached_stats TO anon, authenticated;
GRANT SELECT ON active_rooms TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_rooms() TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_cached_stats() TO authenticated;

-- Commentaire pour documentation
COMMENT ON FUNCTION cleanup_old_rooms IS 'Nettoie les rooms zombies. À appeler toutes les 5 minutes via un cron.';
COMMENT ON VIEW realtime_stats IS 'Statistiques en temps réel (peut être lent sur gros volume)';
COMMENT ON MATERIALIZED VIEW cached_stats IS 'Statistiques en cache (rapide, rafraîchir périodiquement)';
