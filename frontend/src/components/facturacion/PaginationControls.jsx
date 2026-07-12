import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function PaginationControls({
  pageInfo,
  onPageChange,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20],
  disabled = false,
  compact = false,
}) {
  const currentPage = pageInfo?.currentPage || 1
  const totalPages = pageInfo?.totalPages || 1
  const totalCount = pageInfo?.totalCount || 0
  const wrapperClass = compact
    ? 'mb-3 flex flex-col gap-3 border-t border-slate-100 pt-3 text-xs dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between'
    : 'flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between'

  if (totalCount <= pageSizeOptions[0] && totalPages <= 1 && !onPageSizeChange) return null

  return (
    <div className={wrapperClass}>
      <p className="text-slate-500 dark:text-slate-400">
        Pagina <span className="font-bold text-slate-900 dark:text-slate-100">{currentPage}</span> de <span className="font-bold text-slate-900 dark:text-slate-100">{totalPages}</span> - {totalCount} registros
      </p>
      <div className="flex flex-wrap gap-2">
        {onPageSizeChange && (
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
            Mostrar
            <select
              value={pageSize}
              disabled={disabled}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold tracking-normal text-slate-700 outline-none transition-colors focus:border-red-600 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
        )}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={disabled || !pageInfo?.hasPreviousPage}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </button>
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={disabled || !pageInfo?.hasNextPage}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Siguiente
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
