export default function PanelCard({ title, children, className = '' }) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 ${className}`}>
      {title ? <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-50">{title}</h3> : null}
      <div className={title ? 'mt-4' : ''}>{children}</div>
    </section>
  )
}
