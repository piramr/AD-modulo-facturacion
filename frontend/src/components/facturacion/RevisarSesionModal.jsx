import { useEffect, useState } from 'react'
import { ClipboardCheck, X } from 'lucide-react'

const inputClass =
  'w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-600 dark:focus:ring-slate-800'
const labelClass = 'text-xs font-medium text-slate-500 dark:text-slate-400'
const money = (value) => `$${Number(value || 0).toFixed(2)}`

const dateTime = (value) => {
  if (!value) return 'Pendiente'
  return new Date(value).toLocaleString('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function RevisarSesionModal({
  isOpen,
  sesionActiva,
  form,
  onChange,
  onSubmit,
  onClose,
  isSubmitting,
}) {
  const [showSummary, setShowSummary] = useState(false)

  useEffect(() => {
    if (isOpen) setShowSummary(false)
  }, [isOpen])

  if (!isOpen || !sesionActiva) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-50">
              {showSummary ? 'Resumen del turno' : 'Enviar turno a revision'}
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {showSummary
                ? 'Confirma el monto fisico antes de enviarlo al administrador.'
                : 'Ingresa el dinero fisico contado al finalizar tu turno.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="space-y-4 px-5 py-4">
          {showSummary ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-slate-500 dark:text-slate-400">Caja</span>
                  <span className="text-right font-medium text-slate-900 dark:text-slate-100">
                    {sesionActiva.caja?.codigo || sesionActiva.cajaId}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">Cajero</span>
                  <span className="text-right font-medium text-slate-900 dark:text-slate-100">
                    {sesionActiva.usuarioId || 'Actual'}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">Apertura</span>
                  <span className="text-right font-medium text-slate-900 dark:text-slate-100">
                    {dateTime(sesionActiva.fechaApertura)}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">Cierre</span>
                  <span className="text-right font-medium text-slate-900 dark:text-slate-100">
                    Ahora
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">Monto físico ingresado</span>
                  <span className="text-right font-medium text-slate-900 dark:text-slate-100">
                    {money(form.montoCierreReal)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-300">
                Cuenta el efectivo real de la caja y registra ese valor. El resumen se mostrara en el siguiente paso.
              </div>

              <label className="block space-y-1">
                <span className={labelClass}>Monto fisico recaudado</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.montoCierreReal}
                  onChange={(event) => {
                    setShowSummary(false)
                    onChange('montoCierreReal', event.target.value)
                  }}
                  className={inputClass}
                  placeholder="0.00"
                />
              </label>
            </>
          )}
        </div>

        <footer className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3 dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            onClick={showSummary ? () => setShowSummary(false) : onClose}
            className="inline-flex h-9 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {showSummary ? 'Volver' : 'Cancelar'}
          </button>
          <button
            type="button"
            onClick={showSummary ? onSubmit : () => setShowSummary(true)}
            disabled={isSubmitting || !form.montoCierreReal}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-amber-500 px-3 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-60"
          >
            <ClipboardCheck className="h-4 w-4" />
            {showSummary ? (isSubmitting ? 'Enviando...' : 'Confirmar envio') : 'Ver resumen'}
          </button>
        </footer>
      </div>
    </div>
  )
}
