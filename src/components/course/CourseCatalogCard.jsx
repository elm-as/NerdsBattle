import React from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Clock, ListChecks, Play, ChevronRight, CheckCircle, AlertCircle, Sparkles } from 'lucide-react'
import { getSubject } from '../../data/subjects.js'
import MathText from '../ui/MathText.jsx'

/**
 * Carte de présentation d'un cours dans le catalogue avec statut d'avancement personnalisé.
 */
export default function CourseCatalogCard({ course, levelName, stats }) {
  const subject = getSubject(course.subjectId)
  const Icon = subject?.icon || BookOpen

  // Détermination du badge de statut selon l'historique de l'élève
  const renderStatusBadge = () => {
    if (!stats) {
      return (
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
          Nouveau
        </span>
      )
    }

    const accuracyPct = Math.round((stats.accuracyTotal / stats.count) * 100)
    if (accuracyPct >= 75) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 tabular-nums">
          <CheckCircle size={11} /> Maîtrisé {accuracyPct}%
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 tabular-nums">
        <AlertCircle size={11} /> À revoir {accuracyPct}%
      </span>
    )
  }

  return (
    <div className="group relative bg-white dark:bg-slate-900/90 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-brand/40 transition-all space-y-3">
      <div className="flex items-start gap-3.5">
        <div
          className={`shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br ${
            subject?.color || 'from-brand to-violet-500'
          } grid place-items-center text-white shadow-sm`}
        >
          <Icon size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
              <span className="text-brand">{subject?.name}</span>
              <span>·</span>
              <span>{levelName}</span>
            </div>
            {renderStatusBadge()}
          </div>

          <Link to={`/course/${course.id}`}>
            <h2 className="font-display font-bold text-base text-slate-900 dark:text-white group-hover:text-brand transition-colors leading-snug">
              <MathText>{course.title}</MathText>
            </h2>
          </Link>

          {course.summary && (
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
              <MathText>{course.summary}</MathText>
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium tabular-nums">
          <span className="flex items-center gap-1">
            <ListChecks size={13} className="text-brand" /> {course.questionCount} Qs
          </span>
          <span className="flex items-center gap-1">
            <Clock size={13} /> {course.estimatedMinutes || 15} min
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/quiz/${course.id}`}
            className="px-2.5 py-1.5 rounded-lg bg-brand/10 hover:bg-brand/20 text-brand text-xs font-bold flex items-center gap-1 transition-colors"
          >
            <Play size={12} fill="currentColor" /> Quiz
          </Link>
          <Link
            to={`/course/${course.id}`}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-xs font-bold flex items-center gap-1 transition-colors"
          >
            Fiche <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}
