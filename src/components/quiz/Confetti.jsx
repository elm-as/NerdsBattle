import { useEffect, useState } from 'react'

// Confettis CSS-only, sans dépendance.
export default function Confetti({ count = 60, duration = 1800 }) {
  const [alive, setAlive] = useState(true)
  useEffect(() => {
    const id = setTimeout(() => setAlive(false), duration)
    return () => clearTimeout(id)
  }, [duration])
  if (!alive) return null

  const colors = ['#10B981', '#22C55E', '#84CC16', '#FACC15', '#3B82F6', '#EC4899']
  const pieces = Array.from({ length: count }, (_, i) => {
    const left = Math.random() * 100
    const delay = Math.random() * 250
    const dur = 1200 + Math.random() * 800
    const color = colors[i % colors.length]
    const size = 6 + Math.random() * 6
    return (
      <span
        key={i}
        style={{
          left: `${left}%`,
          background: color,
          width: size,
          height: size,
          animationDelay: `${delay}ms`,
          animationDuration: `${dur}ms`
        }}
        className="absolute top-0 rounded-sm animate-[fall_1.4s_linear_forwards]"
      />
    )
  })

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces}
      <style>{`@keyframes fall { to { transform: translateY(110vh) rotate(720deg); opacity: 0.6; } }`}</style>
    </div>
  )
}
