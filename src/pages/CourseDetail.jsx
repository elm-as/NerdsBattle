import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BookOpen, Bookmark, BookmarkCheck, Play, Pause, FileText, Search, ArrowUp, X } from 'lucide-react'
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
import CourseNotesModal from '../components/course/CourseNotesModal.jsx'
import CourseComprehensionTracker from '../components/course/CourseComprehensionTracker.jsx'

function formatStudyTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function safeGetStorage(key, fallback) {
  try {
    const val = localStorage.getItem(key)
    return val !== null ? val : fallback
  } catch {
    return fallback
  }
}

/**
 * Écran complet de lecture d'une leçon académique avec outils d'étude interactifs.
 * Conforme à la charte ElmasCore (modulaire, <= 350 lignes, séparation de responsabilités).
 */
export default function CourseDetail() {
  const { courseId } = useParams()
  const navigate = useNavigate()

  // 1. Taille de police de lecture
  const [fontSize, setFontSize] = useState(() => safeGetStorage('nerdsbattle_reader_font', 'base'))
  // 2. Onglet d'étude actif (vue complète, cours, mémo, exercice)
  const [activeTab, setActiveTab] = useState('all')
  // 3. Mise en favoris / Marque-page du cours
  const [isBookmarked, setIsBookmarked] = useState(() => {
    try {
      return JSON.parse(safeGetStorage('nerdsbattle_bookmarks', '[]')).includes(courseId)
    } catch {
      return false
    }
  })
  // 4. Chronomètre de temps d'étude actif
  const [studySeconds, setStudySeconds] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(true)
  // 5. Statut d'assimilation / Compréhension auto-évaluée
  const [understandingLevel, setUnderstandingLevel] = useState(() => {
    try {
      return JSON.parse(safeGetStorage('nerdsbattle_comprehension', '{}'))[courseId] || 'none'
    } catch {
      return 'none'
    }
  })
  // 6. Bloc-notes de révision de l'élève
  const [isNotesOpen, setIsNotesOpen] = useState(false)
  const [notesText, setNotesText] = useState(() => safeGetStorage(`nerdsbattle_notes_${courseId}`, ''))
  // 7. Recherche de mots-clés dans la leçon
  const [isSearchVisible, setIsSearchVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  // 8. Bouton retour en haut de page
  const [showBackToTop, setShowBackToTop] = useState(false)

  useEffect(() => {
    if (!isTimerRunning) return
    const interval = setInterval(() => setStudySeconds((s) => s + 1), 1000)
    return () => clearInterval(interval)
  }, [isTimerRunning])

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 400)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleChangeFontSize = (size) => {
    setFontSize(size)
    try { localStorage.setItem('nerdsbattle_reader_font', size) } catch {}
  }

  const handleToggleBookmark = () => {
    const next = !isBookmarked
    setIsBookmarked(next)
    try {
      const saved = JSON.parse(safeGetStorage('nerdsbattle_bookmarks', '[]'))
      const updated = next ? [...new Set([...saved, courseId])] : saved.filter((id) => id !== courseId)
      localStorage.setItem('nerdsbattle_bookmarks', JSON.stringify(updated))
    } catch {}
  }

  const handleSelectUnderstanding = (level) => {
    setUnderstandingLevel(level)
    try {
      const ratings = JSON.parse(safeGetStorage('nerdsbattle_comprehension', '{}'))
      ratings[courseId] = level
      localStorage.setItem('nerdsbattle_comprehension', JSON.stringify(ratings))
    } catch {}
  }

  const handleSaveNotes = (val) => {
    setNotesText(val)
    try { localStorage.setItem(`nerdsbattle_notes_${courseId}`, val) } catch {}
  }

  const course = getCourseById(courseId)

  if (!course) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">Le cours demandé est introuvable ou a été déplacé.</p>
        <Link to="/courses" className="inline-block px-4 py-2 rounded-xl bg-brand text-white font-display font-bold text-xs">
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
  const handleJumpTo = (id) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="space-y-4 pb-16 relative">
      <CourseHeaderCard course={course} subject={subject} level={level} questionsCount={questions.length} onBack={() => navigate(-1)} />

      {/* Barre d'outils interactive (Chrono, Favoris, Notes, Recherche) */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTimerRunning((r) => !r)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold hover:bg-slate-200 transition-colors"
            title={isTimerRunning ? 'Mettre en pause' : 'Reprendre'}
          >
            {isTimerRunning ? <Pause size={12} className="text-brand" /> : <Play size={12} className="text-emerald-500" />}
            <span className="tabular-nums">{formatStudyTime(studySeconds)}</span>
          </button>

          <button
            onClick={handleToggleBookmark}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-bold transition-all ${
              isBookmarked ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}
            title="Mettre en favoris"
          >
            {isBookmarked ? <BookmarkCheck size={14} className="text-amber-500" /> : <Bookmark size={14} />}
            <span className="hidden sm:inline">{isBookmarked ? 'Enregistré' : 'Enregistrer'}</span>
          </button>

          <button
            onClick={() => setIsNotesOpen(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-bold transition-all ${
              notesText.trim() ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}
            title="Notes personnelles"
          >
            <FileText size={14} />
            <span className="hidden sm:inline">Notes{notesText.trim() ? ' •' : ''}</span>
          </button>

          <button
            onClick={() => setIsSearchVisible((v) => !v)}
            className={`p-1.5 rounded-xl transition-colors ${isSearchVisible ? 'bg-brand/15 text-brand' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            title="Rechercher"
          >
            <Search size={14} />
          </button>
        </div>

        <CourseReadingToolbar
          fontSize={fontSize}
          onChangeFontSize={handleChangeFontSize}
          hasKeyPoints={hasKeyPoints}
          hasExercise={hasExercise}
          onJumpToKeyPoints={() => { setActiveTab('all'); handleJumpTo('course-key-points') }}
          onJumpToExercise={() => { setActiveTab('all'); handleJumpTo('course-exercise') }}
        />
      </div>

      {isSearchVisible && (
        <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
          <Search size={15} className="text-slate-400 ml-1" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un terme, une formule..."
            className="flex-1 bg-transparent text-xs text-slate-800 dark:text-slate-100 outline-hidden"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="p-1 text-slate-400 hover:text-slate-600">
              <X size={13} />
            </button>
          )}
        </div>
      )}

      {/* Auto-évaluation de la compréhension */}
      <CourseComprehensionTracker level={understandingLevel} onSelectLevel={handleSelectUnderstanding} />

      {/* Onglets de filtrage */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs font-bold">
        {[
          { id: 'all', label: 'Vue complète' },
          { id: 'lesson', label: 'Leçon détaillée' },
          ...(hasKeyPoints ? [{ id: 'memo', label: 'Points Clés' }] : []),
          ...(hasExercise ? [{ id: 'exercise', label: 'Exercice' }] : [])
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
              activeTab === tab.id ? 'bg-white dark:bg-slate-700 text-brand shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Fiche mémo interactive des points clés */}
      {hasKeyPoints && (activeTab === 'all' || activeTab === 'memo') && (
        <div id="course-key-points">
          <CourseKeyPointsMemo courseId={course.id} keyPoints={course.keyPoints} />
        </div>
      )}

      {/* Corps principal de la leçon */}
      {(activeTab === 'all' || activeTab === 'lesson') && (
        <Card className="border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <CardBody className="p-4 sm:p-6 space-y-3 max-w-full overflow-hidden">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-brand" />
                <h2 className="font-display font-bold text-sm uppercase tracking-wider text-slate-900 dark:text-white">Contenu de la Leçon</h2>
              </div>
              <span className="text-[11px] font-bold text-slate-400 tabular-nums">{course.estimatedMinutes || 10} min</span>
            </div>
            <div className="pt-1 max-w-full overflow-hidden">
              <MarkdownRenderer content={course.lesson} fontSize={fontSize} />
            </div>
          </CardBody>
        </Card>
      )}

      {/* Exercice d'application */}
      {hasExercise && (activeTab === 'all' || activeTab === 'exercise') && (
        <div id="course-exercise">
          <CourseApplicationExercise exercise={course.exercise} />
        </div>
      )}

      {/* Aperçu des questions d'auto-évaluation */}
      {questions.length > 0 && activeTab === 'all' && (
        <CourseQuizPreview questions={questions} onStartQuiz={handleStartQuiz} />
      )}

      <CourseStickyActionBar onStartQuiz={handleStartQuiz} onStartChallenge={handleStartChallenge} questionsCount={questions.length} />

      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-20 right-4 z-40 p-2.5 rounded-full bg-brand text-white shadow-lg hover:bg-brand-dark transition-all scale-100 hover:scale-105"
          title="Retour en haut"
        >
          <ArrowUp size={16} />
        </button>
      )}

      <CourseNotesModal isOpen={isNotesOpen} onClose={() => setIsNotesOpen(false)} notesText={notesText} onSaveNotes={handleSaveNotes} />
    </div>
  )
}
