-- Migration: Table de cache pour les questions générées par IA
-- Objectif: Éviter de regénérer les questions à chaque fois

CREATE TABLE IF NOT EXISTS generated_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id TEXT NOT NULL UNIQUE,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour la recherche rapide
CREATE INDEX IF NOT EXISTS idx_generated_questions_course_id 
ON generated_questions(course_id);

-- Index sur la date de génération pour nettoyer les vieux cache
CREATE INDEX IF NOT EXISTS idx_generated_questions_generated_at 
ON generated_questions(generated_at);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_generated_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_generated_questions_timestamp ON generated_questions;

CREATE TRIGGER update_generated_questions_timestamp
  BEFORE UPDATE ON generated_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_generated_questions_updated_at();

-- Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON generated_questions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON generated_questions TO anon;

-- Commentaires
COMMENT ON TABLE generated_questions IS 'Cache des questions de quiz générées par IA pour chaque cours';
COMMENT ON COLUMN generated_questions.course_id IS 'ID du cours (format: sujet-niveau-slug)';
COMMENT ON COLUMN generated_questions.questions IS 'Tableau JSON des questions au format quiz';
COMMENT ON COLUMN generated_questions.generated_at IS 'Date de dernière génération (pour expiration du cache)';
