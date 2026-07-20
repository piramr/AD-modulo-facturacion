import { Banknote, Plus, X } from "lucide-react";

const inputClass =
  "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-600 dark:focus:ring-slate-800";
const labelClass = "text-xs font-medium text-slate-500 dark:text-slate-400";
const money = (value) => `$${Number(value || 0).toFixed(2)}`;

function Field({ label, children }) {
  return (
    <label className="space-y-1">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

function ModalShell({ isOpen, title, description, onClose, children, footer }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-50">{title}</h3>
            {description ? (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="px-5 py-4">{children}</div>
        <footer className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3 dark:border-slate-800 dark:bg-slate-900">
          {footer}
        </footer>
      </div>
    </div>
  );
}

export default function CerrarSesionModal({
  isOpen,
  sesionActiva,
  form,
  cuentas = [],
  onChange,
  onAddRow,
  onRemoveRow,
  onSubmit,
  onClose,
  isSubmitting,
}) {
  const totalDepositar = (form?.distribucionCuentas || []).reduce(
    (sum, row) => sum + Number(row.monto || 0),
    0
  );
  const totalEsperado = Number(sesionActiva?.totalVentasEfectivo || 0);
  const diferencia = Number((totalDepositar - totalEsperado).toFixed(2));
  const puedeCerrar = Math.abs(diferencia) < 0.0001;

  return (
    <ModalShell
      isOpen={isOpen && Boolean(sesionActiva)}
      title="Depositar y cerrar turno"
      description="Distribuye el dinero en efectivo en las cuentas para cerrar definitivamente la caja."
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting || !puedeCerrar}
            className="inline-flex h-9 items-center rounded-md bg-emerald-600 px-3 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {isSubmitting ? "Cerrando..." : "Cerrar turno"}
          </button>
        </>
      }
    >
      {sesionActiva ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300">
            <div className="flex items-center gap-2 font-semibold">
              <Banknote className="h-4 w-4" />
              <span>Total esperado de ventas en efectivo</span>
            </div>
            <p className="mt-1 text-lg font-black">{money(totalEsperado)}</p>
          </div>

          {(form?.distribucionCuentas || []).map((row, index) => (
            <div key={`${row.cuentaId || "row"}-${index}`} className="grid gap-3 sm:grid-cols-[1fr_140px_auto]">
              <Field label={`Cuenta ${index + 1}`}>
                <select
                  value={row.cuentaId}
                  onChange={(e) => onChange(index, "cuentaId", e.target.value)}
                  className={inputClass}
                >
                  <option value="">Selecciona una cuenta</option>
                  {cuentas.map((cuenta) => (
                    <option key={cuenta.cuentaId} value={cuenta.cuentaId}>
                      {cuenta.entidadBancaria || cuenta.nombre || cuenta.cuentaId}
                      {cuenta.nroCuenta ? ` - ${cuenta.nroCuenta}` : ""}
                      {cuenta.titular ? ` (${cuenta.titular})` : ""}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Monto">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={row.monto}
                  onChange={(e) => onChange(index, "monto", e.target.value)}
                  className={inputClass}
                  placeholder="0.00"
                />
              </Field>
              <button
                type="button"
                onClick={() => onRemoveRow(index)}
                disabled={(form?.distribucionCuentas || []).length === 1}
                className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 px-3 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={onAddRow}
            className="inline-flex items-center gap-2 rounded-md border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            <Plus className="h-4 w-4" />
            Agregar cuenta
          </button>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Total a depositar</span>
              <span className="font-bold text-slate-950 dark:text-slate-50">{money(totalDepositar)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-slate-500">Diferencia</span>
              <span className={puedeCerrar ? "font-semibold text-emerald-600" : "font-semibold text-amber-600"}>
                {money(diferencia)}
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </ModalShell>
  );
}
