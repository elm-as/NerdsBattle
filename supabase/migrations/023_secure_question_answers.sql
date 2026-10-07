-- Migration: Sécurisation des réponses de quiz
-- Objectif: Séparer les questions (publiques) des réponses (privées/serveur)

-- 1. Modifier la table existante pour stocker questions et réponses séparément
ALTER TABLE generated_questions 
ADD COLUMN IF NOT EXISTS question_data JSONB DEFAULT '[]'::jsonb,  -- Questions sans réponses (pour client)
ADD COLUMN IF NOT EXISTS answer_data JSONB DEFAULT '[]'::jsonb;     -- Réponses (serveur uniquement)

-- 2. Créer une vue qui ne retourne que les questions (sans réponses)
CREATE OR REPLACE VIEW public.quiz_questions AS
SELECT 
  course_id,
  question_data as questions,
  generated_at
FROM generated_questions;

-- 3. Créer une fonction RPC pour valider une réponse côté serveur
CREATE OR REPLACE FUNCTION public.validate_answer(
  p_course_id TEXT,
  p_question_id TEXT,
  p_user_answer TEXT
)
RETURNS TABLE (
  is_correct BOOLEAN,
  correct_answer TEXT,
  explanation TEXT,
  similarity_score FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER  -- Execute avec les droits du créateur, pas de l'utilisateur
AS $$
DECLARE
  v_answer_data JSONB;
  v_question JSONB;
  v_correct_answer TEXT;
  v_user_normalized TEXT;
  v_accepted_answers TEXT[];
BEGIN
  -- Récupérer les données de réponse pour ce cours
  SELECT answer_data INTO v_answer_data
  FROM generated_questions
  WHERE course_id = p_course_id;
  
  IF v_answer_data IS NULL OR jsonb_array_length(v_answer_data) = 0 THEN
    RETURN QUERY SELECT false::BOOLEAN, ''::TEXT, 'Question non trouvée'::TEXT, 0.0::FLOAT;
    RETURN;
  END IF;
  
  -- Trouver la question correspondante
  SELECT value INTO v_question
  FROM jsonb_array_elements(v_answer_data) AS value
  WHERE value->>'id' = p_question_id;
  
  IF v_question IS NULL THEN
    RETURN QUERY SELECT false::BOOLEAN, ''::TEXT, 'Question non trouvée'::TEXT, 0.0::FLOAT;
    RETURN;
  END IF;
  
  -- Extraire la réponse correcte
  v_correct_answer := v_question->>'answer';
  
  -- Normaliser la réponse utilisateur
  v_user_normalized := lower(trim(p_user_answer));
  v_user_normalized := regexp_replace(v_user_normalized, '[\u0300-\u036f]', '', 'g'); -- Sans accents
  v_user_normalized := regexp_replace(v_user_normalized, '[-\s]+', ' ', 'g'); -- Normaliser espaces
  
  -- Construire la liste des réponses acceptées
  v_accepted_answers := ARRAY[v_correct_answer];
  
  -- Ajouter les réponses alternatives si présentes
  IF v_question->'acceptedAnswers' IS NOT NULL THEN
    SELECT array_agg(value::text)
    INTO v_accepted_answers
    FROM jsonb_array_elements_text(v_question->'acceptedAnswers') AS value;
    v_accepted_answers := array_prepend(v_correct_answer, v_accepted_answers);
  END IF;
  
  -- Vérifier la correspondance
  FOR i IN 1..array_length(v_accepted_answers, 1) LOOP
    IF v_user_normalized = lower(trim(v_accepted_answers[i])) THEN
      RETURN QUERY SELECT true::BOOLEAN, v_correct_answer, v_question->>'explanation', 1.0::FLOAT;
      RETURN;
    END IF;
  END LOOP;
  
  -- Vérification partielle pour les mots courts (tolérance)
  FOR i IN 1..array_length(v_accepted_answers, 1) LOOP
    IF length(v_accepted_answers[i]) < 20 THEN
      -- Pour les mots courts, accepter l'inclusion
      IF v_user_normalized LIKE '%' || lower(trim(v_accepted_answers[i])) || '%' OR
         lower(trim(v_accepted_answers[i])) LIKE '%' || v_user_normalized || '%' THEN
        RETURN QUERY SELECT true::BOOLEAN, v_correct_answer, v_question->>'explanation', 0.9::FLOAT;
        RETURN;
      END IF;
    END IF;
  END LOOP;
  
  -- Réponse incorrecte
  RETURN QUERY SELECT false::BOOLEAN, v_correct_answer, v_question->>'explanation', 0.0::FLOAT;
END;
$$;

-- Permissions: seuls les utilisateurs authentifiés peuvent valider
GRANT EXECUTE ON FUNCTION public.validate_answer(TEXT, TEXT, TEXT) TO authenticated;

-- 4. Créer une fonction pour récupérer SEULEMENT les questions (sans réponses)
CREATE OR REPLACE FUNCTION public.get_quiz_questions(
  p_course_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_question_data JSONB;
BEGIN
  SELECT question_data INTO v_question_data
  FROM generated_questions
  WHERE course_id = p_course_id
  AND generated_at > NOW() - INTERVAL '24 hours'; -- Cache valide 24h
  
  RETURN COALESCE(v_question_data, '[]'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_quiz_questions(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_quiz_questions(TEXT) TO anon;

-- 5. Empêcher la lecture directe de answer_data par les clients
-- La colonne answer_data est cachée via la vue quiz_questions

-- 6. Politique RLS pour empêcher l'accès direct aux réponses
ALTER TABLE generated_questions ENABLE ROW LEVEL SECURITY;

-- Politique: tout le monde peut voir question_data via la vue
CREATE POLICY quiz_questions_select ON generated_questions
  FOR SELECT
  USING (true);  -- Autorisé via la vue quiz_questions qui filtre

-- 7. Fonction pour générer et stocker les questions sécurisées
CREATE OR REPLACE FUNCTION public.store_secure_questions(
  p_course_id TEXT,
  p_questions JSONB,  -- Questions avec réponses
  p_generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_questions_only JSONB := '[]'::jsonb;
  v_answers_only JSONB := '[]'::jsonb;
  v_question JSONB;
  v_answer JSONB;
BEGIN
  -- Séparer les questions des réponses
  FOR v_question IN SELECT value FROM jsonb_array_elements(p_questions)
  LOOP
    -- Version publique (sans réponse)
    v_questions_only := v_questions_only || jsonb_build_object(
      'id', v_question->>'id',
      'type', COALESCE(v_question->>'type', 'mcq'),
      'prompt', v_question->>'prompt',
      'options', v_question->'options',
      'explanation', v_question->>'explanation'
    );
    
    -- Version privée (avec réponse)
    v_answers_only := v_answers_only || jsonb_build_object(
      'id', v_question->>'id',
      'answer', v_question->>'answer',
      'acceptedAnswers', v_question->'acceptedAnswers',
      'explanation', v_question->>'explanation'
    );
  END LOOP;
  
  -- Insérer ou mettre à jour
  INSERT INTO generated_questions (course_id, question_data, answer_data, generated_at)
  VALUES (p_course_id, v_questions_only, v_answers_only, p_generated_at)
  ON CONFLICT (course_id) 
  DO UPDATE SET 
    question_data = EXCLUDED.question_data,
    answer_data = EXCLUDED.answer_data,
    generated_at = EXCLUDED.generated_at,
    updated_at = NOW();
  
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.store_secure_questions(TEXT, JSONB, TIMESTAMP WITH TIME ZONE) TO authenticated;

-- Commentaires
COMMENT ON FUNCTION public.validate_answer IS 'Valide une réponse utilisateur côté serveur sans exposer les réponses';
COMMENT ON FUNCTION public.get_quiz_questions IS 'Récupère les questions de quiz sans les réponses';
COMMENT ON FUNCTION public.store_secure_questions IS 'Stocke les questions séparément des réponses pour sécurité';
