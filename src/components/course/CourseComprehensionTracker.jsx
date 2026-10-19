import React from 'react'
import { CheckCircle, AlertCircle, HelpCircle } from 'lucide-react'

/**
 * Sélecteur interactif d'auto-évaluation de la compréhension de la leçon.
 */
export default function CourseComprehensionTracker({ level, onSelectLevel }) {
  return (
    <div className="flex items-center gap-2 px-1 text-xs">
      <span className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">Assimilation :</span>
      <button
        onClick={() => onSelectLevel('mastered')}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
          level === 'mastered'
            ? 'bg-emerald-500 text-white shadow-xs'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-500/10'
        }`}
      >
        <CheckCircle size={12} />
        <span>Compris</span>
      </button>

      <button
        onClick={() => onSelectLevel('review')}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
          level === 'review'
            ? 'bg-amber-500 text-white shadow-xs'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-amber-500/10'
        }`}
      >
        <AlertCircle size={12} />
        <span>À revoir</span>
      </button>

      <button
        onClick={() => onSelectLevel('struggling')}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
          level === 'struggling'
            ? 'bg-rose-500 text-white shadow-xs'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-rose-500/10'
        }`}
      >
        <HelpCircle size={12} />
        <span>Difficile</span>
      </button>
    </div>
  )
}
