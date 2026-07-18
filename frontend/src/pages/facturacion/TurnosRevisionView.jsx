import { useEffect, useState } from 'react'
import { CheckCircle2, Clock3 } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import CerrarSesionModal from '../../components/facturacion/CerrarSesionModal'

export default function TurnosRevisionView() {
  const f = useOutletContext()
  const [loading, setLoading] = useState(true)
  const [sesionSeleccionada, setSesionSeleccionada] = useState(null)

  useEffect(() => {
    let mounted = true
    Promise.resolve(f.reloadSesionesRevision?.())
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  const abrirCerrarModal = (sesion) => {
    setSesionSeleccionada(sesion)
    f.openCerrarModal?.(sesion)
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm dark:border-amber-800 dark:bg-amber-950/20">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Turnos en revisión</p>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
              Aquí se agrupan los turnos pendientes de cierre definitivo por parte del administrador.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-white/70 px-3 py-2 text-sm font-semibold text-amber-800 dark:border-amber-700 dark:bg-slate-950/40 dark:text-amber-300">
            <Clock3 className="h-4 w-4" />
            {f.sesionesRevision?.length || 0} pendientes
          </div>
        </div>
      </section>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950">
          Cargando turnos...
        </div>
      ) : (f.sesionesRevision?.length || 0) === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950">
          No hay turnos en revisión en este momento.
        </div>
      ) : (
        <div className="space-y-3">
          {f.sesionesRevision.map((sesion) => (
            <div key={sesion.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {sesion.caja?.codigo} — {sesion.caja?.descripcion}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Apertura: ${Number(sesion.montoApertura || 0).toFixed(2)} · Facturas: {sesion.cantidadFacturas} · Estado: {sesion.estado}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => abrirCerrarModal(sesion)}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Cerrar turno
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CerrarSesionModal
        isOpen={f.showCerrarModal}
        sesionActiva={sesionSeleccionada || f.sesionActiva}
        form={f.cierreForm}
        onChange={(index, field, value) => f.updateDistribucionCuenta(index, field, value)}
        onAddRow={f.addDistribucionCuenta}
        onRemoveRow={f.removeDistribucionCuenta}
        onSubmit={f.handleCerrarSesion}
        onClose={() => {
          setSesionSeleccionada(null)
          f.closeCerrarModal?.()
        }}
        isSubmitting={f.isSubmitting}
      />
    </div>
  )
}
