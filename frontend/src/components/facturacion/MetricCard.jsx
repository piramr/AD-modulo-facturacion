const toneClasses = {
  indigo: 'text-red-700 dark:text-red-500',
  emerald: 'text-emerald-600 dark:text-emerald-400',
  amber: 'text-amber-600 dark:text-amber-400',
  blue: 'text-blue-600 dark:text-blue-400',
  slate: 'text-slate-500 dark:text-slate-400',
}

export default function MetricCard({ title, value, sub, tone = 'indigo' }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{title}</p>
      <p className={`mt-3 text-2xl font-semibold tracking-tight ${toneClasses[tone] ?? toneClasses.indigo}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{sub}</p>
    </article>
  )
}
