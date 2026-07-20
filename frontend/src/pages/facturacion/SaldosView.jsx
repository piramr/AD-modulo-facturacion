import { useEffect, useMemo, useState } from 'react'
import { Search, WalletCards } from 'lucide-react'
import { toast } from 'react-toastify'
import PanelCard from '../../components/facturacion/PanelCard'
import PaginationControls from '../../components/facturacion/PaginationControls'
import {
  enrichCuentasConCXC,
  getMovimientosCuenta,
  getSaldoCuenta,
  getSaldosCuentas,
} from '../../api/facturacionService'

const money = (value) => `$${Number(value || 0).toFixed(2)}`
const dateText = (value) => (value ? new Date(value).toLocaleString() : 'Sin fecha')
const pageInfoFor = (items, page, limit) => {
  const totalCount = items.length
  const totalPages = Math.max(1, Math.ceil(totalCount / limit))
  const currentPage = Math.min(page, totalPages)
  return {
    currentPage,
    totalPages,
    totalCount,
    hasPreviousPage: currentPage > 1,
    hasNextPage: currentPage < totalPages,
  }
}
const slicePage = (items, page, limit) => {
  const safePage = pageInfoFor(items, page, limit).currentPage
  return items.slice((safePage - 1) * limit, safePage * limit)
}

export default function SaldosView() {
  const [saldos, setSaldos] = useState([])
  const [movimientos, setMovimientos] = useState([])
  const [selectedSaldo, setSelectedSaldo] = useState(null)
  const [searchCuentaId, setSearchCuentaId] = useState('')
  const [saldosPage, setSaldosPage] = useState(1)
  const [saldosLimit, setSaldosLimit] = useState(5)
  const [movimientosPage, setMovimientosPage] = useState(1)
  const [movimientosLimit, setMovimientosLimit] = useState(5)
  const [detallePage, setDetallePage] = useState(1)
  const [detalleLimit, setDetalleLimit] = useState(5)
  const [isLoading, setIsLoading] = useState(true)
  const [busyAction, setBusyAction] = useState('')

  const movimientosDetalle = useMemo(
    () => selectedSaldo?.movimientos || [],
    [selectedSaldo],
  )
  const saldosPorCuentaId = useMemo(
    () => saldos.reduce((acc, saldo) => {
      acc[saldo.cuentaId] = saldo
      return acc
    }, {}),
    [saldos],
  )
  const saldosPageInfo = pageInfoFor(saldos, saldosPage, saldosLimit)
  const movimientosPageInfo = pageInfoFor(movimientos, movimientosPage, movimientosLimit)
  const detallePageInfo = pageInfoFor(movimientosDetalle, detallePage, detalleLimit)
  const saldosVisibles = slicePage(saldos, saldosPage, saldosLimit)
  const movimientosVisibles = slicePage(movimientos, movimientosPage, movimientosLimit)
  const movimientosDetalleVisibles = slicePage(movimientosDetalle, detallePage, detalleLimit)

  const reload = async () => {
    setIsLoading(true)
    try {
      const [saldosData, movimientosData] = await Promise.all([
        getSaldosCuentas(),
        getMovimientosCuenta(100),
      ])
      const saldosLocales = saldosData || []
      setSaldos(saldosLocales)
      setMovimientos(movimientosData || [])
      setSaldosPage(1)
      setMovimientosPage(1)

      enrichCuentasConCXC(saldosLocales)
        .then((saldosEnriquecidos) => {
          setSaldos(saldosEnriquecidos)
          setSelectedSaldo((current) => (
            current
              ? saldosEnriquecidos.find((saldo) => saldo.cuentaId === current.cuentaId) || current
              : current
          ))
        })
        .catch(() => {
          toast.info('Saldos cargados. No fue posible obtener informacion adicional de CXC.')
        })
    } catch (error) {
      toast.error(error.message || 'No fue posible cargar saldos.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    reload()
  }, [])

  const handleBuscarCuenta = async (event) => {
    event.preventDefault()
    if (!searchCuentaId.trim()) {
      toast.error('Ingresa el ID de la cuenta.')
      return
    }

    setBusyAction('buscar')
    try {
      const saldo = await getSaldoCuenta(searchCuentaId.trim())
      setSelectedSaldo(saldo)
      setDetallePage(1)
      enrichCuentasConCXC([saldo])
        .then(([saldoEnriquecido]) => {
          if (saldoEnriquecido) setSelectedSaldo(saldoEnriquecido)
        })
        .catch(() => {})
    } catch (error) {
      toast.error(error.message || 'No fue posible consultar la cuenta.')
    } finally {
      setBusyAction('')
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <PanelCard title="Saldos de cuentas bancarias">
          <div className="space-y-4">
            <form onSubmit={handleBuscarCuenta} className="flex flex-col gap-2 sm:flex-row">
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-slate-500 dark:border-slate-800 dark:bg-slate-950">
                <Search className="h-4 w-4" />
                <input
                  value={searchCuentaId}
                  onChange={(event) => setSearchCuentaId(event.target.value)}
                  className="h-10 min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400 dark:text-slate-100"
                  placeholder="Buscar cuenta por UUID"
                />
              </div>
              <button
                type="submit"
                disabled={busyAction === 'buscar'}
                className="inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200"
              >
                Buscar
              </button>
            </form>

            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
              {isLoading ? (
                <p className="p-4 text-sm text-slate-500">Cargando saldos...</p>
              ) : saldos.length === 0 ? (
                <div className="p-6 text-center">
                  <WalletCards className="mx-auto h-8 w-8 text-slate-400" />
                  <p className="mt-3 text-sm font-semibold">No hay saldos registrados.</p>
                </div>
              ) : (
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-medium text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Banco / cuenta</th>
                      <th className="px-4 py-3">Titular</th>
                      <th className="px-4 py-3">Saldo disponible</th>
                      <th className="px-4 py-3">Actualizacion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {saldosVisibles.map((saldo) => (
                      <tr
                        key={saldo.cuentaId}
                        className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900"
                        onClick={() => setSelectedSaldo(saldo)}
                      >
                        <td className="max-w-[280px] px-4 py-3">
                          <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                            {saldo.entidadBancaria || saldo.nombre || saldo.cuentaId}
                          </p>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                            {saldo.nombre || saldo.codigo || 'Cuenta bancaria'} {saldo.nroCuenta ? `- ${saldo.nroCuenta}` : ''}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          <p className="truncate">{saldo.titular || '-'}</p>
                          <p className="truncate text-xs text-slate-400">{saldo.tipoCuenta || ''}</p>
                        </td>
                        <td className="px-4 py-3">{money(saldo.saldoDisponible ?? saldo.saldoActual)}</td>
                        <td className="px-4 py-3 text-slate-500">{dateText(saldo.ultimaActualizacion)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <PaginationControls
              pageInfo={saldosPageInfo}
              onPageChange={setSaldosPage}
              pageSize={saldosLimit}
              onPageSizeChange={(limit) => {
                setSaldosLimit(limit)
                setSaldosPage(1)
              }}
            />
          </div>
        </PanelCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <PanelCard title="Movimientos recientes">
          <div className="space-y-3">
            {movimientos.length === 0 ? (
              <p className="text-sm text-slate-500">No hay movimientos recientes.</p>
            ) : movimientosVisibles.map((movimiento) => {
              const cuenta = saldosPorCuentaId[movimiento.cuentaId] || {}

              return (
                <div key={movimiento.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold">{movimiento.tipo}</span>
                    <span className={movimiento.tipo === 'INGRESO' ? 'text-sm font-bold text-emerald-600' : 'text-sm font-bold text-red-600'}>
                      {money(movimiento.monto)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{movimiento.descripcion}</p>
                  <p className="mt-1 truncate text-xs text-slate-400">
                    {cuenta.entidadBancaria || cuenta.nombre || movimiento.cuentaId}
                    {cuenta.nroCuenta ? ` - ${cuenta.nroCuenta}` : ''}
                  </p>
                  <p className="mt-1 truncate text-xs text-slate-400">
                    {cuenta.titular ? `${cuenta.titular} - ` : ''}{dateText(movimiento.fechaMovimiento)}
                  </p>
                </div>
              )
            })}
            <PaginationControls
              compact
              pageInfo={movimientosPageInfo}
              onPageChange={setMovimientosPage}
              pageSize={movimientosLimit}
              onPageSizeChange={(limit) => {
                setMovimientosLimit(limit)
                setMovimientosPage(1)
              }}
            />
          </div>
        </PanelCard>

        <PanelCard title="Detalle de cuenta">
          {!selectedSaldo ? (
            <p className="text-sm text-slate-500">Selecciona una cuenta o buscala por UUID para ver sus movimientos.</p>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="truncate text-sm font-semibold">
                  {selectedSaldo.entidadBancaria || selectedSaldo.nombre || selectedSaldo.cuentaId}
                </p>
                <p className="mt-1 truncate text-xs text-slate-500">
                  {selectedSaldo.nombre || selectedSaldo.codigo || 'Cuenta bancaria'}
                  {selectedSaldo.nroCuenta ? ` - ${selectedSaldo.nroCuenta}` : ''}
                </p>
                <p className="mt-1 truncate text-xs text-slate-500">
                  Titular: {selectedSaldo.titular || '-'} {selectedSaldo.tipoCuenta ? `(${selectedSaldo.tipoCuenta})` : ''}
                </p>
                <p className="mt-2 text-2xl font-bold">{money(selectedSaldo.saldoDisponible ?? selectedSaldo.saldoActual)}</p>
              </div>
              <div className="space-y-3">
                {movimientosDetalle.length === 0 ? (
                  <p className="text-sm text-slate-500">Esta cuenta no tiene movimientos.</p>
                ) : movimientosDetalleVisibles.map((movimiento) => (
                  <div key={movimiento.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold">{movimiento.tipo}</span>
                      <span className="text-sm font-bold">{money(movimiento.monto)}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{movimiento.descripcion}</p>
                    <p className="mt-1 text-xs text-slate-400">{dateText(movimiento.fechaMovimiento)}</p>
                  </div>
                ))}
                <PaginationControls
                  compact
                  pageInfo={detallePageInfo}
                  onPageChange={setDetallePage}
                  pageSize={detalleLimit}
                  onPageSizeChange={(limit) => {
                    setDetalleLimit(limit)
                    setDetallePage(1)
                  }}
                />
              </div>
            </div>
          )}
        </PanelCard>
      </section>
    </div>
  )
}
