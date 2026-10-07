import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Crown, Sparkles, Star } from 'lucide-react'
import RankBadge from './RankBadge.jsx'

export default function LevelUpModal({ rank, onClose }) {
  // Auto-close after 5 seconds if not closed manually
  useEffect(() => {
    if (rank) {
      const t = setTimeout(onClose, 5000)
      return () => clearTimeout(t)
    }
  }, [rank, onClose])

  if (!rank) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, y: 50, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.8, y: 20, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="relative w-full max-w-sm bg-white dark:bg-canvas-surface rounded-3xl p-8 text-center shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Background rays effect */}
          <div className="absolute inset-0 opacity-10 dark:opacity-20 pointer-events-none flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent_0_340deg,currentColor_360deg)] text-brand"
            />
          </div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', damping: 12 }}
            className="relative mx-auto w-32 h-32 mb-6"
          >
            <RankBadge rank={rank} size="lg" showLabel={false} className="w-full h-full scale-[2] origin-center" />
            
            {/* Sparkles */}
            <motion.div
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5], rotate: [0, 90, 180] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.1 }}
              className="absolute -top-4 -right-4 text-amber-400"
            >
              <Sparkles size={24} />
            </motion.div>
            <motion.div
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5], rotate: [0, -90, -180] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.8 }}
              className="absolute -bottom-2 -left-4 text-brand"
            >
              <Star size={20} fill="currentColor" />
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="font-display text-3xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-brand to-violet-600">
              Nouveau Rang !
            </h2>
            <p className="text-ink-mute dark:text-slate-400 mb-8 text-lg">
              Tu as atteint le rang <strong className="text-ink dark:text-white">{rank.name}</strong>. Continue comme ça !
            </p>
            <button
              onClick={onClose}
              className="w-full py-4 rounded-2xl bg-brand text-white font-display font-bold text-lg hover:bg-brand-dark transition-colors active:scale-95"
            >
              Génial !
            </button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
