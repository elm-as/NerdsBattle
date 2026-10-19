import React from 'react'
import { FileText, X } from 'lucide-react'

/**
 * Modal / Volet coulissant pour les notes de révision personnelles de l'élève.
 * Sauvegarde automatique en localStorage par cours.
 */
export default function CourseNotesModal({ isOpen, onClose, notesText, onSaveNotes }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-brand" />
            <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">Mes notes de révision</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <textarea
          value={notesText}
          onChange={(e) => onSaveNotes(e.target.value)}
          placeholder="Notez ici vos remarques, pièges d'examen, formules clés..."
          rows={6}
          className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-brand"
        />

        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Sauvegardé automatiquement</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-brand text-white font-bold hover:bg-brand-dark transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
