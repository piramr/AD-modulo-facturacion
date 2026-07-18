import { useEffect, useMemo, useState } from 'react'
import { CreditCard, Landmark, TrendingUp } from 'lucide-react'
import { getSaldosCuentas } from '../../api/facturacionService'

const money = (value) => `$${Number(value || 0).toFixed(2)}`

export default function CuentasView() {
  const [cuentas, setCuentas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    getSaldosCuentas()
      .then((result) => {
        if (mounted) setCuentas(Array.isArray(result) ? result : [])
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  const totalGeneral = useMemo(
    () => cuentas.reduce((sum, cuenta) => sum + Number(cuenta.saldoActual || 0), 0),
    [cuentas]
  )

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">Cuentas y saldos</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Aquí se evidencian las cuentas registradas, su saldo actual y los movimientos asociados.
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
            Total general: {money(totalGeneral)}
          </div>
        </div>
      </section>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950">
          Cargando cuentas...
        </div>
      ) : cuentas.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950">
          No hay cuentas registradas todavía.
        </div>
      ) : (
        <div className="space-y-3">
          {cuentas.map((cuenta) => (
            <section key={cuenta.cuentaId} className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    <Landmark className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">{cuenta.cuentaId}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Última actualización: {cuenta.ultimaActualizacion ? new Date(cuenta.ultimaActualizacion).toLocaleString('es-EC') : 'Sin datos'}
                    </p>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-right dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Saldo actual</p>
                  <p className="text-lg font-semibold text-slate-950 dark:text-slate-50">{money(cuenta.saldoActual)}</p>
                </div>
              </div>

              <div className="grid gap-4 px-4 py-4 lg:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <TrendingUp className="h-4 w-4" />
                    Movimientos
                  </div>
                  {(!cuenta.movimientos || cuenta.movimientos.length === 0) ? (
                    <p className="text-sm text-slate-500">Sin movimientos registrados.</p>
                  ) : (
                    <ul className="space-y-2">
                      {cuenta.movimientos.slice(0, 5).map((mov) => (
                        <li key={mov.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-slate-700 dark:text-slate-300">{mov.descripcion}</span>
                            <span className={`font-semibold ${mov.tipo === 'INGRESO' ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {mov.tipo === 'INGRESO' ? '+' : '-'}{money(mov.monto)}
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {mov.referencia || 'Sin referencia'} · {new Date(mov.fechaMovimiento).toLocaleString('es-EC')}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <CreditCard className="h-4 w-4" />
                    Resumen de cierre
                  </div>
                  <p className="text-sm text-slate-500">
                    Esta vista evidencia el saldo disponible para depósitos y cierres de caja.
                  </p>
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
