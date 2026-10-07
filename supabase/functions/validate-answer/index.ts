import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

interface ValidateRequest {
  courseId: string
  questionId: string
  userAnswer: string
  questionType?: 'mcq' | 'truefalse' | 'fill'
}

serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, content-type'
      }
    })
  }

  try {
    const { courseId, questionId, userAnswer, questionType }: ValidateRequest = await req.json()
    
    if (!courseId || !questionId || userAnswer === undefined) {
      return new Response(
        JSON.stringify({ error: 'Paramètres manquants' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Créer client Supabase avec service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Appeler la fonction RPC pour valider
    const { data, error } = await supabase
      .rpc('validate_answer', {
        p_course_id: courseId,
        p_question_id: questionId,
        p_user_answer: String(userAnswer)
      })

    if (error) {
      console.error('[validate-answer] RPC error:', error)
      return new Response(
        JSON.stringify({ error: 'Erreur de validation' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const result = data?.[0] || { is_correct: false, correct_answer: '', explanation: '', similarity_score: 0 }

    return new Response(
      JSON.stringify({
        correct: result.is_correct,
        correctAnswer: result.correct_answer,
        explanation: result.explanation,
        similarity: result.similarity_score,
        questionId: questionId
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )

  } catch (err) {
    console.error('[validate-answer] Error:', err)
    return new Response(
      JSON.stringify({ error: 'Erreur interne' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
