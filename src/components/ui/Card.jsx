export function Card({ className = '', children, ...rest }) {
  return (
    <div
      className={`rounded-2xl bg-white dark:bg-canvas-surface border border-black/5 dark:border-white/5 shadow-card ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}

export function CardBody({ className = '', children }) {
  return <div className={`p-4 ${className}`}>{children}</div>
}
