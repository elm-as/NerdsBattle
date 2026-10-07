export default function Tabs({ tabs, value, onChange, className = '', size = 'md' }) {
  const sizes = {
    sm: { padding: 'px-3', height: 'h-7', text: 'text-xs', radius: 'rounded-lg' },
    md: { padding: 'px-4', height: 'h-9', text: 'text-sm', radius: 'rounded-xl' }
  }
  const s = sizes[size]

  return (
    <div
      role="tablist"
      className={`inline-flex p-1 rounded-2xl bg-black/5 dark:bg-white/5 ${className}`}
    >
      {tabs.map((t) => {
        const active = t.value === value
        return (
          <button
            key={t.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.value)}
            className={`${s.padding} ${s.height} ${s.text} ${s.radius} font-display font-semibold transition-all whitespace-nowrap ${
              active
                ? 'bg-white dark:bg-canvas-surface text-ink dark:text-slate-100 shadow-sm'
                : 'text-ink-mute hover:text-ink dark:hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}
