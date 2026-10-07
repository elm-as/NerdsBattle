import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

export function FillInputInline({ currentQ, onAnswer }) {
  const [local, setLocal] = useState('')

  const handleChange = (val) => {
    setLocal(val)
    onAnswer(val)
  }

  useEffect(() => { setLocal('') }, [currentQ?.id])

  return (
    <div>
      <input
        type="text"
        autoFocus
        inputMode="text"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        value={local}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Écris ta réponse ici..."
        className="w-full h-14 px-5 rounded-2xl border-2 border-black/10 dark:border-white/10 bg-transparent font-mono text-lg focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
      />
      <p className="text-[10px] text-ink-mute mt-2 text-center">
        Appuie sur <kbd className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono text-[10px]">Entrée ↵</kbd> ou utilise le bouton en bas
      </p>
    </div>
  )
}

export function FillSubmitBar({ value, onChange, onSubmit, timeLeft }) {
  const canSubmit = value.trim().length > 0

  return (
    <div className="shrink-0 px-4 py-3 bg-canvas-light dark:bg-canvas-dark border-t border-black/5 dark:border-white/5">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-ink-mute font-medium">Valide avant la fin du chrono</span>
          <span className={`text-xs font-bold tabular-nums ${timeLeft <= 5 ? 'text-rose-500' : 'text-ink-mute'}`}>
            {timeLeft}s
          </span>
        </div>

        <motion.button
          onClick={onSubmit}
          disabled={!canSubmit}
          className={`w-full py-3.5 rounded-2xl font-display font-bold text-base flex items-center justify-center gap-2 transition-all ${
            canSubmit
              ? 'bg-gradient-to-r from-brand to-violet-500 text-white shadow-lg shadow-brand/25 active:scale-[0.98]'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
          }`}
          whileTap={canSubmit ? { scale: 0.98 } : {}}
        >
          <Check size={20} />
          Valider
        </motion.button>
      </div>
    </div>
  )
}
