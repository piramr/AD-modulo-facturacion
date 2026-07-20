import { useEffect, useState } from 'react'
import { CheckCircle2, Clock3 } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import CerrarSesionModal from '../../components/facturacion/CerrarSesionModal'
import PaginationControls from '../../components/facturacion/PaginationControls'

const money = (value) => `$${Number(value || 0).toFixed(2)}`
const dateText = (value) => (value ? new Date(value).toLocaleString('es-EC') : 'Sin fecha')

export default function TurnosRevisionView() {
  const f = useOutletContext()
  const [loading, setLoading] = useState(true)
  const [sesionSeleccionada, setSesionSeleccionada] = useState(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(5)
  const sesiones = f.sesionesRevision || []
  const totalPages = Math.max(1, Math.ceil(sesiones.length / limit))
  const currentPage = Math.min(page, totalPages)
  const pageInfo = {
    currentPage,
    totalPages,
    totalCount: sesiones.length,
    hasPreviousPage: currentPage > 1,
    hasNextPage: currentPage < totalPages,
  }
  const sesionesVisibles = sesiones.slice((currentPage - 1) * limit, currentPage * limit)

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
      <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm dark:border-amber-800 dark:bg-amber-950/20">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Sesiones pendientes de revision</p>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
              Aqui se agrupan los turnos pendientes de cierre definitivo por parte del administrador.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-white/70 px-3 py-2 text-sm font-semibold text-amber-800 dark:border-amber-700 dark:bg-slate-950/40 dark:text-amber-300">
            <Clock3 className="h-4 w-4" />
            {f.sesionesRevision?.length || 0} pendientes
          </div>
        </div>
      </section>

      {loading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950">
          Cargando turnos...
        </div>
      ) : (f.sesionesRevision?.length || 0) === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950">
          No hay turnos en revision en este momento.
        </div>
      ) : (
        <div className="space-y-3">
          {sesionesVisibles.map((sesion) => (
            <div key={sesion.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {sesion.caja?.codigo} - {sesion.caja?.descripcion}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Cajero: {sesion.usuarioId} - Apertura: {dateText(sesion.fechaApertura)} - Envio: {dateText(sesion.fechaCierre)}
                  </p>
                  <div className="mt-3 grid gap-2 text-xs sm:grid-cols-4">
                    <span className="rounded-md bg-slate-50 px-2 py-1 dark:bg-slate-900">
                      Facturas: <strong>{sesion.cantidadFacturas}</strong>
                    </span>
                    <span className="rounded-md bg-slate-50 px-2 py-1 dark:bg-slate-900">
                      Efectivo: <strong>{money(sesion.totalVentasEfectivo)}</strong>
                    </span>
                    <span className="rounded-md bg-slate-50 px-2 py-1 dark:bg-slate-900">
                      Esperado: <strong>{money(sesion.montoCierreEsperado)}</strong>
                    </span>
                    <span className="rounded-md bg-slate-50 px-2 py-1 dark:bg-slate-900">
                      Real: <strong>{money(sesion.montoCierreReal)}</strong>
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-md bg-red-50 px-2 py-1 font-medium text-red-700 dark:bg-red-950/30 dark:text-red-300">
                      Faltante: {money(sesion.faltante)}
                    </span>
                    <span className="rounded-md bg-emerald-50 px-2 py-1 font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                      Sobrante: {money(sesion.sobrante)}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => abrirCerrarModal(sesion)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Cerrar turno
                </button>
              </div>
            </div>
          ))}
          <PaginationControls
            pageInfo={pageInfo}
            onPageChange={setPage}
            pageSize={limit}
            onPageSizeChange={(nextLimit) => {
              setLimit(nextLimit)
              setPage(1)
            }}
          />
        </div>
      )}

      <CerrarSesionModal
        isOpen={f.showCerrarModal}
        sesionActiva={sesionSeleccionada || f.sesionActiva}
        form={f.cierreForm}
        cuentas={f.cuentasBancarias}
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
