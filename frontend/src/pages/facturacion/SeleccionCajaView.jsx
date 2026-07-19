import { useEffect, useState } from "react";
import { ArrowLeft, LogOut, Moon, Sun, X } from "lucide-react";

const labelClass =
  "text-[10px] font-extrabold uppercase tracking-[0.24em] text-slate-400";
const inputClass =
  "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-red-400 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";

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
  const [showAperturaModal, setShowAperturaModal] = useState(false);

  useEffect(() => {
    onRecargarCajas();
  }, []);

  const cajasDisponibles = (cajas || []).filter(
    (caja) => caja.estado === "ACTIVO",
  );
  const estaEnRevision = sesionActiva?.estado === "EN_REVISION";
  const iniciales = user?.userName?.slice(0, 2)?.toUpperCase() || "CJ";
  const cajaSeleccionada = cajasDisponibles.find(
    (caja) => caja.id === sesionForm.cajaId,
  );

  const seleccionarCaja = (caja) => {
    if (caja.estado !== "ACTIVO") return;
    setSesionForm((prev) => ({ ...prev, cajaId: caja.id, montoApertura: "" }));
    setShowAperturaModal(true);
  };

  const cerrarModal = () => {
    if (isSubmitting) return;
    setShowAperturaModal(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </button>
        <p className="text-base font-black tracking-[0.24em] text-red-700">
          FACTURACION
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleTheme}
            className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Cambiar tema"
          >
            {themeMode === "dark" ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
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
              Bienvenido, {user?.userName || "Cajero"}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {estaEnRevision
                ? "Tu turno esta en revision por el administrador."
                : "Selecciona una caja para comenzar tu turno."}
            </p>
          </div>

          {estaEnRevision ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-center dark:border-amber-800 dark:bg-amber-950/20">
              <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
                Turno en revision
              </p>
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-500">
                Caja: <strong>{sesionActiva?.caja?.codigo}</strong> - espera la
                aprobacion del administrador para continuar.
              </p>
              {/* <button
                type="button"
                onClick={() => window.history.back()}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver
              </button> */}
            </div>
          ) : (
            <div className="space-y-4">
              <p className={labelClass}>Cajas disponibles</p>
              {cajasLoading ? (
                <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  Cargando cajas...
                </div>
              ) : cajasDisponibles.length === 0 ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-600 shadow-sm dark:border-red-900 dark:bg-red-950/20 dark:text-red-300">
                  No hay cajas disponibles. Contacta al administrador.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {cajasDisponibles.map((caja) => (
                    <button
                      key={caja.id}
                      type="button"
                      onClick={() => seleccionarCaja(caja)}
                      className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-red-300 hover:bg-red-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-red-800 dark:hover:bg-red-950/20"
                    >
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {caja.codigo}
                      </span>
                      <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                        {caja.descripcion}
                      </span>
                      <span className="mt-3 inline-flex rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                        Disponible
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showAperturaModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950">
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Abrir caja
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {cajaSeleccionada?.codigo} - {cajaSeleccionada?.descripcion}
                </p>
              </div>
              <button
                type="button"
                onClick={cerrarModal}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </header>
            <div className="px-5 py-4">
              <label className="block space-y-1">
                <span className={labelClass}>Monto de apertura</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={sesionForm.montoApertura}
                  onChange={(event) =>
                    setSesionForm((prev) => ({
                      ...prev,
                      montoApertura: event.target.value,
                    }))
                  }
                  className={inputClass}
                  placeholder="0.00"
                />
              </label>
            </div>
            <footer className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3 dark:border-slate-800 dark:bg-slate-900">
              <button
                type="button"
                onClick={cerrarModal}
                className="inline-flex h-9 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={onAbrirSesion}
                disabled={
                  isSubmitting ||
                  !sesionForm.cajaId ||
                  sesionForm.montoApertura === ""
                }
                className="inline-flex h-9 items-center rounded-md bg-red-700 px-3 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-60"
              >
                {isSubmitting ? "Abriendo..." : "Abrir caja"}
              </button>
            </footer>
          </div>
        </div>
      ) : null}
    </div>
  );
}
