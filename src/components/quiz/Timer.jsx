import { Timer as TimerIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function Timer({ seconds, onExpire, paused = false }) {
  const [remaining, setRemaining] = useState(seconds)

  useEffect(() => setRemaining(seconds), [seconds])

  useEffect(() => {
    if (paused) return
    if (remaining <= 0) {
      onExpire?.()
      return
    }
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000)
    return () => clearTimeout(id)
  }, [remaining, paused, onExpire])

  const danger = remaining <= 5
  const m = Math.floor(remaining / 60)
  const s = (remaining % 60).toString().padStart(2, '0')

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 h-9 rounded-2xl text-sm font-mono font-semibold transition-colors ${
        danger
          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300 animate-pulse'
          : 'bg-black/5 dark:bg-white/10 text-ink dark:text-slate-200'
      }`}
      aria-live="polite"
    >
      <TimerIcon size={16} />
      {m}:{s}
    </div>
  )
}
