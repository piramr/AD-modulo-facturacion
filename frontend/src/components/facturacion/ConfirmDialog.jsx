import { AlertTriangle } from 'lucide-react'

export default function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, isDanger = true }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-start gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${isDanger ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'}`}>
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <h4 className="text-base font-semibold text-slate-950 dark:text-slate-50">{title}</h4>
            <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 bg-slate-50 px-5 py-3 dark:bg-slate-900">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-9 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`inline-flex h-9 items-center rounded-md px-3 text-sm font-medium text-white transition-colors ${isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-950 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200'}`}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}
