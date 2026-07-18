import { useEffect, useMemo, useState } from 'react'
import { Search, WalletCards } from 'lucide-react'
import { toast } from 'react-toastify'
import PanelCard from '../../components/facturacion/PanelCard'
import {
  createSaldoCuenta,
  getMovimientosCuenta,
  getSaldoCuenta,
  getSaldosCuentas,
} from '../../api/facturacionService'

const inputClass = 'w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-600 dark:focus:ring-slate-800 dark:disabled:bg-slate-900'
const money = (value) => `$${Number(value || 0).toFixed(2)}`
const dateText = (value) => (value ? new Date(value).toLocaleString() : 'Sin fecha')

export default function SaldosView() {
  const [saldos, setSaldos] = useState([])
  const [movimientos, setMovimientos] = useState([])
  const [selectedSaldo, setSelectedSaldo] = useState(null)
  const [searchCuentaId, setSearchCuentaId] = useState('')
  const [newCuentaId, setNewCuentaId] = useState('')
  const [newSaldoInicial, setNewSaldoInicial] = useState('0')
  const [isLoading, setIsLoading] = useState(true)
  const [busyAction, setBusyAction] = useState('')

  const movimientosDetalle = useMemo(
    () => selectedSaldo?.movimientos || [],
    [selectedSaldo],
  )

  const reload = async () => {
    setIsLoading(true)
    try {
      const [saldosData, movimientosData] = await Promise.all([
        getSaldosCuentas(),
        getMovimientosCuenta(10),
      ])
      setSaldos(saldosData || [])
      setMovimientos(movimientosData || [])
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
    } catch (error) {
      toast.error(error.message || 'No fue posible consultar la cuenta.')
    } finally {
      setBusyAction('')
    }
  }

  const handleCrearCuenta = async (event) => {
    event.preventDefault()
    if (!newCuentaId.trim()) {
      toast.error('Ingresa el ID de la cuenta bancaria.')
      return
    }

    setBusyAction('crear')
    try {
      await createSaldoCuenta({
        cuentaId: newCuentaId.trim(),
        saldoActual: Number(newSaldoInicial || 0),
      })
      toast.success('Cuenta inicializada correctamente.')
      setNewCuentaId('')
      setNewSaldoInicial('0')
      await reload()
    } catch (error) {
      toast.error(error.message || 'No fue posible inicializar la cuenta.')
    } finally {
      setBusyAction('')
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
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
                  <p className="mt-3 text-sm font-semibold">No hay cuentas inicializadas.</p>
                </div>
              ) : (
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-medium text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Cuenta</th>
                      <th className="px-4 py-3">Saldo</th>
                      <th className="px-4 py-3">Actualizacion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {saldos.map((saldo) => (
                      <tr
                        key={saldo.cuentaId}
                        className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900"
                        onClick={() => setSelectedSaldo(saldo)}
                      >
                        <td className="max-w-[240px] truncate px-4 py-3 font-medium">{saldo.cuentaId}</td>
                        <td className="px-4 py-3">{money(saldo.saldoActual)}</td>
                        <td className="px-4 py-3 text-slate-500">{dateText(saldo.ultimaActualizacion)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </PanelCard>

        <PanelCard title="Inicializar cuenta">
          <form onSubmit={handleCrearCuenta} className="space-y-4">
            <label className="block space-y-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Cuenta bancaria CXC</span>
              <input
                value={newCuentaId}
                onChange={(event) => setNewCuentaId(event.target.value)}
                disabled={busyAction === 'crear'}
                className={inputClass}
                placeholder="UUID de cuenta"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Saldo inicial</span>
              <input
                value={newSaldoInicial}
                onChange={(event) => setNewSaldoInicial(event.target.value)}
                disabled={busyAction === 'crear'}
                type="number"
                min={0}
                step="0.01"
                className={inputClass}
              />
            </label>
            <button
              type="submit"
              disabled={busyAction === 'crear'}
              className="inline-flex h-10 w-full items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200"
            >
              {busyAction === 'crear' ? 'Inicializando...' : 'Inicializar cuenta'}
            </button>
          </form>
        </PanelCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <PanelCard title="Movimientos recientes">
          <div className="space-y-3">
            {movimientos.length === 0 ? (
              <p className="text-sm text-slate-500">No hay movimientos recientes.</p>
            ) : movimientos.map((movimiento) => (
              <div key={movimiento.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold">{movimiento.tipo}</span>
                  <span className={movimiento.tipo === 'INGRESO' ? 'text-sm font-bold text-emerald-600' : 'text-sm font-bold text-red-600'}>
                    {money(movimiento.monto)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{movimiento.descripcion}</p>
                <p className="mt-1 truncate text-xs text-slate-400">{movimiento.cuentaId} - {dateText(movimiento.fechaMovimiento)}</p>
              </div>
            ))}
          </div>
        </PanelCard>

        <PanelCard title="Detalle de cuenta">
          {!selectedSaldo ? (
            <p className="text-sm text-slate-500">Selecciona una cuenta o buscala por UUID para ver sus movimientos.</p>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="truncate text-sm font-semibold">{selectedSaldo.cuentaId}</p>
                <p className="mt-1 text-2xl font-bold">{money(selectedSaldo.saldoActual)}</p>
              </div>
              <div className="space-y-3">
                {movimientosDetalle.length === 0 ? (
                  <p className="text-sm text-slate-500">Esta cuenta no tiene movimientos.</p>
                ) : movimientosDetalle.map((movimiento) => (
                  <div key={movimiento.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold">{movimiento.tipo}</span>
                      <span className="text-sm font-bold">{money(movimiento.monto)}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{movimiento.descripcion}</p>
                    <p className="mt-1 text-xs text-slate-400">{dateText(movimiento.fechaMovimiento)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </PanelCard>
      </section>
    </div>
  )
}
