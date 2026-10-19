import React, { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import { Card, CardBody } from '../components/ui/Card.jsx'
import MarkdownRenderer from '../components/ui/MarkdownRenderer.jsx'
import { getCourseById } from '../lib/contentLoader.js'
import { getSubject } from '../data/subjects.js'
import { getLevel } from '../data/levels.js'

import CourseHeaderCard from '../components/course/CourseHeaderCard.jsx'
import CourseReadingToolbar from '../components/course/CourseReadingToolbar.jsx'
import CourseKeyPointsMemo from '../components/course/CourseKeyPointsMemo.jsx'
import CourseApplicationExercise from '../components/course/CourseApplicationExercise.jsx'
import CourseQuizPreview from '../components/course/CourseQuizPreview.jsx'
import CourseStickyActionBar from '../components/course/CourseStickyActionBar.jsx'

/**
 * Écran complet de lecture d'une leçon académique avec outils d'étude interactifs.
 * Conforme à la charte ElmasCore (modulaire, < 350 lignes, séparation de responsabilités).
 */
export default function CourseDetail() {
  const { courseId } = useParams()
  const navigate = useNavigate()

  const [fontSize, setFontSize] = useState(() => {
    try {
      return localStorage.getItem('nerdsbattle_reader_font') || 'base'
    } catch {
      return 'base'
    }
  })

  const handleChangeFontSize = (size) => {
    setFontSize(size)
    try {
      localStorage.setItem('nerdsbattle_reader_font', size)
    } catch {}
  }

  const course = getCourseById(courseId)

  if (!course) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">Le cours demandé est introuvable ou a été déplacé.</p>
        <Link
          to="/courses"
          className="inline-block px-4 py-2 rounded-xl bg-brand text-white font-display font-bold text-xs"
        >
          Consulter le catalogue des cours
        </Link>
      </div>
    )
  }

  const subject = getSubject(course.subjectId)
  const level = getLevel(course.levelId)
  const questions = Array.isArray(course.questions) ? course.questions : []
  const hasExercise = Boolean(course.exercise?.question?.trim())
  const hasKeyPoints = Array.isArray(course.keyPoints) && course.keyPoints.length > 0

  const handleStartQuiz = () => navigate(`/quiz/${course.id}`)
  const handleStartChallenge = () => navigate(`/quiz/${course.id}?mode=challenge`)

  const handleJumpTo = (elementId) => {
    const el = document.getElementById(elementId)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="space-y-4 pb-12">
      {/* 1. En-tête héroïque du cours */}
      <CourseHeaderCard
        course={course}
        subject={subject}
        level={level}
        questionsCount={questions.length}
        onBack={() => navigate(-1)}
      />

      {/* 2. Barre d'outils de confort de lecture */}
      <CourseReadingToolbar
        fontSize={fontSize}
        onChangeFontSize={handleChangeFontSize}
        hasKeyPoints={hasKeyPoints}
        hasExercise={hasExercise}
        onJumpToKeyPoints={() => handleJumpTo('course-key-points')}
        onJumpToExercise={() => handleJumpTo('course-exercise')}
      />

      {/* 3. Fiche mémo interactive des points clés (avec assimilation) */}
      {hasKeyPoints && (
        <CourseKeyPointsMemo courseId={course.id} keyPoints={course.keyPoints} />
      )}

      {/* 4. Corps principal de la leçon (avec KaTeX et graphiques de cours) */}
      <Card className="border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <CardBody className="p-4 sm:p-6 space-y-3 max-w-full overflow-hidden">
          <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <BookOpen size={18} className="text-brand" />
            <h2 className="font-display font-bold text-sm uppercase tracking-wider text-slate-900 dark:text-white">
              Contenu de la Leçon
            </h2>
          </div>

          <div className="pt-1 max-w-full overflow-hidden">
            <MarkdownRenderer
              content={course.lesson}
              fontSize={fontSize}
            />
          </div>
        </CardBody>
      </Card>

      {/* 5. Exercice d'application et démonstration pas à pas */}
      {hasExercise && (
        <CourseApplicationExercise exercise={course.exercise} />
      )}

      {/* 6. Aperçu des questions d'auto-évaluation */}
      {questions.length > 0 && (
        <CourseQuizPreview
          questions={questions}
          onStartQuiz={handleStartQuiz}
        />
      )}

      {/* 7. Barre d'action inférieure sticky pour passage à l'action immédiat */}
      <CourseStickyActionBar
        onStartQuiz={handleStartQuiz}
        onStartChallenge={handleStartChallenge}
        questionsCount={questions.length}
      />
    </div>
  )
}
