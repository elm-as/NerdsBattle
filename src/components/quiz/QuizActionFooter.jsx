import { ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'

export default function QuizActionFooter({
  locked,
  canValidate,
  onValidate,
  onNext,
  isLast,
  isWaiting,
}) {
  return (
    <div className="flex-shrink-0 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
      {!locked ? (
        <motion.button
          onClick={onValidate}
          disabled={!canValidate}
          className={`w-full py-4 rounded-2xl font-display font-bold text-lg flex items-center justify-center gap-2 transition-all ${
            canValidate ? 'bg-brand text-white shadow-lg shadow-brand/25' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
          whileTap={canValidate ? { scale: 0.98 } : {}}
        >
          Valider
        </motion.button>
      ) : (
        <motion.button
          onClick={onNext}
          disabled={isWaiting}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand to-violet-500 text-white font-display font-bold text-lg flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
          whileTap={{ scale: 0.98 }}
        >
          {isLast ? 'Voir le score' : 'Suivant'} <ChevronRight size={20} />
        </motion.button>
      )}
    </div>
  )
}
