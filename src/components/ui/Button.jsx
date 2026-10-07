import { forwardRef } from 'react'

const variants = {
  primary:
    'bg-brand text-white hover:bg-brand-600 active:scale-[0.98] dark:bg-brand-dark shadow-card',
  ghost:
    'bg-transparent text-ink dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5',
  outline:
    'border border-ink/15 dark:border-white/15 text-ink dark:text-slate-100 hover:bg-black/5 dark:hover:bg-white/5',
  danger: 'bg-rose-500 text-white hover:bg-rose-600'
}

const sizes = {
  sm: 'h-9 px-3 text-sm rounded-xl',
  md: 'h-11 px-5 text-sm rounded-2xl',
  lg: 'h-14 px-6 text-base rounded-2xl',
  icon: 'h-10 w-10 rounded-2xl'
}

const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', className = '', children, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 font-display font-semibold transition-all disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
})

export default Button
