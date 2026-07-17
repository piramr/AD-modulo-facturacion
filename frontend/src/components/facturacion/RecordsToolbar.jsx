import { Filter, Plus, Search, SlidersHorizontal } from 'lucide-react'

export default function RecordsToolbar({
  count,
  searchQuery,
  onSearchQueryChange,
  filterEstado,
  onFilterEstadoChange,
  filterOptions,
  onCreate,
  createLabel,
  createButtonLabel,
  onToggleFilters,
  filtersActive,
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">{createLabel}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Mostrando <span className="font-semibold text-slate-900 dark:text-slate-100">{count}</span> registros filtrados.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleFilters}
            className={[
              'inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors',
              filtersActive
                ? 'border-slate-950 bg-slate-950 text-white hover:bg-slate-800 dark:border-slate-100 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800',
            ].join(' ')}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
          </button>

          <button
            type="button"
            onClick={onCreate}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200"
          >
            <Plus className="h-4 w-4" />
            {createButtonLabel}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Busqueda</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              type="search"
              placeholder="Escribe para buscar"
              className="w-full rounded-md border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-600 dark:focus:ring-slate-800"
            />
          </div>
        </label>

        <label className="space-y-1">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Estado</span>
          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={filterEstado}
              onChange={(event) => onFilterEstadoChange(event.target.value)}
              className="w-full appearance-none rounded-md border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-600 dark:focus:ring-slate-800"
            >
              {filterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </label>
      </div>
    </div>
  )
}
