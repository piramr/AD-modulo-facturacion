import { useEffect } from 'react'
import { LogOut, Moon, Sun } from 'lucide-react'

const labelClass = 'text-[10px] font-extrabold uppercase tracking-[0.24em] text-slate-400'
const inputClass = 'w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-red-400 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100'

export default function SeleccionCajaView({
  cajas,
  cajasLoading,
  sesionActiva,
  sesionForm,
  setSesionForm,
  onAbrirSesion,
  onRecargarCajas,
  isSubmitting,
  user,
  onLogout,
  themeMode,
  onToggleTheme,
}) {
  useEffect(() => {
    onRecargarCajas()
  }, [])

  const cajasActivas = (cajas || []).filter((caja) => caja.estado === 'ACTIVO')
  const estaEnRevision = sesionActiva?.estado === 'EN_REVISION'
  const iniciales = user?.userName?.slice(0, 2)?.toUpperCase() || 'CJ'

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-base font-black tracking-[0.24em] text-red-700">FACTURACION</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleTheme}
            className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Cambiar tema"
          >
            {themeMode === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-slate-50 dark:border-slate-800 dark:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            Salir
          </button>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-700 text-xl font-black text-white">
              {iniciales}
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-100">
              Bienvenido, {user?.userName || 'Cajero'}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {estaEnRevision
                ? 'Tu turno esta en revision por el administrador.'
                : 'Selecciona una caja para comenzar tu turno.'}
            </p>
          </div>

          {estaEnRevision ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-center dark:border-amber-800 dark:bg-amber-950/20">
              <p className="text-sm font-bold text-amber-700 dark:text-amber-400">Turno en revision</p>
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-500">
                Caja: <strong>{sesionActiva?.caja?.codigo}</strong> - espera la aprobacion del administrador para continuar.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className={`${labelClass} mb-4`}>Apertura de turno</p>

              <div className="space-y-4">
                <label className="block space-y-1">
                  <span className={labelClass}>Seleccionar caja</span>
                  {cajasLoading ? (
                    <p className="text-sm text-slate-500">Cargando cajas...</p>
                  ) : cajasActivas.length === 0 ? (
                    <p className="text-sm text-red-600">No hay cajas activas disponibles. Contacta al administrador.</p>
                  ) : (
                    <select
                      value={sesionForm.cajaId}
                      onChange={(event) => setSesionForm((prev) => ({ ...prev, cajaId: event.target.value }))}
                      className={inputClass}
                    >
                      <option value="">Elige una caja</option>
                      {cajasActivas.map((caja) => (
                        <option key={caja.id} value={caja.id}>
                          {caja.codigo} - {caja.descripcion} ({caja.establecimiento}-{caja.puntoEmision})
                        </option>
                      ))}
                    </select>
                  )}
                </label>

                <label className="block space-y-1">
                  <span className={labelClass}>Monto de apertura ($)</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={sesionForm.montoApertura}
                    onChange={(event) => setSesionForm((prev) => ({ ...prev, montoApertura: event.target.value }))}
                    className={inputClass}
                    placeholder="0.00"
                  />
                </label>

                <button
                  type="button"
                  onClick={onAbrirSesion}
                  disabled={isSubmitting || cajasActivas.length === 0}
                  className="w-full rounded-lg bg-red-700 py-3 text-sm font-bold text-white transition hover:bg-red-800 disabled:opacity-70"
                >
                  {isSubmitting ? 'Abriendo turno...' : 'Abrir turno y entrar'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
