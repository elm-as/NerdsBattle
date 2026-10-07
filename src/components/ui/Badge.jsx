export default function Badge({ children, tone = 'brand', className = '' }) {
  const tones = {
    brand: 'bg-brand/10 text-brand-700 dark:bg-brand-dark/15 dark:text-brand-dark',
    slate: 'bg-black/5 text-ink dark:bg-white/10 dark:text-slate-200',
    amber: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    rose:  'bg-rose-500/15 text-rose-700 dark:text-rose-300'
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  )
}
