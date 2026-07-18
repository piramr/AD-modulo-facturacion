import { useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import {
  ClipboardCheck,
  Edit2,
  MonitorCheck,
  Plus,
  Power,
  Settings,
  X,
} from "lucide-react";
import StatusBadge from "../../components/facturacion/StatusBadge";
import TurnosRevisionView from "./TurnosRevisionView";

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
            <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-50">
              {title}
            </h3>
            {description ? (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {description}
              </p>
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

function CajaModal({
  isOpen,
  editingId,
  form,
  onChange,
  onSubmit,
  onClose,
  isSubmitting,
}) {
  return (
    <ModalShell
      isOpen={isOpen}
      title={editingId ? "Editar caja" : "Nueva caja"}
      description="Configura punto de emision y secuencial."
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
            disabled={isSubmitting}
            className="inline-flex h-9 items-center rounded-md bg-slate-950 px-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200"
          >
            {isSubmitting ? "Guardando..." : "Guardar"}
          </button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Codigo">
          <input
            value={form.codigo}
            onChange={(e) => onChange("codigo", e.target.value)}
            className={inputClass}
            placeholder="CAJA-01"
          />
        </Field>
        <Field label="Establecimiento">
          <input
            value={form.establecimiento}
            onChange={(e) => onChange("establecimiento", e.target.value)}
            className={inputClass}
            placeholder="001"
            maxLength={3}
          />
        </Field>
        <Field label="Descripcion">
          <input
            value={form.descripcion}
            onChange={(e) => onChange("descripcion", e.target.value)}
            className={inputClass}
            placeholder="Caja principal"
          />
        </Field>
        <Field label="Punto de emision">
          <input
            value={form.puntoEmision}
            onChange={(e) => onChange("puntoEmision", e.target.value)}
            className={inputClass}
            placeholder="001"
            maxLength={3}
          />
        </Field>
        {editingId ? (
          <Field label="Secuencial actual">
            <input
              type="number"
              value={form.secuencialActual}
              onChange={(e) => onChange("secuencialActual", e.target.value)}
              className={inputClass}
              min={0}
            />
          </Field>
        ) : null}
      </div>
    </ModalShell>
  );
}

function SesionModal({
  isOpen,
  cajas,
  form,
  onChange,
  onSubmit,
  onClose,
  isSubmitting,
}) {
  const cajasActivas = cajas.filter((c) => c.estado === "ACTIVO");

  return (
    <ModalShell
      isOpen={isOpen}
      title="Abrir turno de caja"
      description="Selecciona una caja disponible e ingresa el monto inicial."
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
            disabled={isSubmitting}
            className="inline-flex h-9 items-center rounded-md bg-slate-950 px-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200"
          >
            {isSubmitting ? "Abriendo..." : "Abrir turno"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Caja">
          <select
            value={form.cajaId}
            onChange={(e) => onChange("cajaId", e.target.value)}
            className={inputClass}
          >
            <option value="">Elige una caja disponible</option>
            {cajasActivas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.codigo} - {c.descripcion} ({c.establecimiento}-
                {c.puntoEmision})
              </option>
            ))}
          </select>
        </Field>
        <Field label="Monto de apertura">
          <input
            type="number"
            min={0}
            step="0.01"
            value={form.montoApertura}
            onChange={(e) => onChange("montoApertura", e.target.value)}
            className={inputClass}
            placeholder="0.00"
          />
        </Field>
      </div>
    </ModalShell>
  );
}

function RevisarModal({
  isOpen,
  sesionActiva,
  form,
  onChange,
  onSubmit,
  onClose,
  isSubmitting,
}) {
  return (
    <ModalShell
      isOpen={isOpen && Boolean(sesionActiva)}
      title="Enviar turno a revision"
      description="Registra el monto contado en caja para calcular diferencias."
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
            disabled={isSubmitting}
            className="inline-flex h-9 items-center rounded-md bg-slate-950 px-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200"
          >
            {isSubmitting ? "Enviando..." : "Enviar a revision"}
          </button>
        </>
      }
    >
      {sesionActiva ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="grid grid-cols-2 gap-2">
              <span className="text-slate-500">Caja</span>
              <span className="font-medium">{sesionActiva.caja?.codigo}</span>
              <span className="text-slate-500">Facturas</span>
              <span className="font-medium">
                {sesionActiva.cantidadFacturas}
              </span>
              <span className="text-slate-500">Ventas efectivo</span>
              <span className="font-medium">
                {money(sesionActiva.totalVentasEfectivo)}
              </span>
              <span className="text-slate-500">Ventas credito</span>
              <span className="font-medium">
                {money(sesionActiva.totalVentasCredito)}
              </span>
              <span className="text-slate-500">Apertura</span>
              <span className="font-medium">
                {money(sesionActiva.montoApertura)}
              </span>
            </div>
          </div>
          <Field label="Monto de cierre real">
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.montoCierreReal}
              onChange={(e) => onChange("montoCierreReal", e.target.value)}
              className={inputClass}
              placeholder="0.00"
            />
          </Field>
        </div>
      ) : null}
    </ModalShell>
  );
}

export default function CajasView() {
  const f = useOutletContext();

  useEffect(() => {
    f.reloadCajas();
  }, []);

  return (
    <div className="space-y-4">
      {false && f.isCajero &&
        (f.sesionActiva ? (
          <div
            className={`rounded-2xl border p-4 ${
              f.sesionActiva.estado === "ABIERTA"
                ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20"
                : "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20"
            }`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className={labelClass}>Tu turno activo</p>
                <p className="mt-1 text-base font-black text-slate-900 dark:text-slate-100">
                  {f.sesionActiva.caja?.codigo} —{" "}
                  {f.sesionActiva.caja?.descripcion}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Apertura: $
                  {Number(f.sesionActiva.montoApertura || 0).toFixed(2)} ·
                  Facturas: {f.sesionActiva.cantidadFacturas} · Estado:{" "}
                  <strong>{f.sesionActiva.estado}</strong>
                </p>
              </div>
              {f.sesionActiva.estado === "ABIERTA" && (
                <button
                  type="button"
                  onClick={f.openRevisarModal}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white hover:bg-amber-600"
                >
                  <ClipboardCheck className="h-4 w-4" />
                  Enviar a revisión
                </button>
              )}
            </div>
          </div>
        ) : null)}

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-950 dark:text-slate-50">
              Administracion de cajas
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {f.cajas.length} cajas registradas
            </p>
          </div>
          <button
            type="button"
            onClick={f.openCajaModal}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200"
          >
            <Plus className="h-4 w-4" />
            Nueva caja
          </button>
        </div>

        <div className="overflow-x-auto">
          {f.cajasLoading ? (
            <p className="p-6 text-sm text-slate-500">Cargando cajas...</p>
          ) : f.cajas.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">
              No hay cajas registradas.
            </p>
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-medium text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Codigo</th>
                  <th className="px-4 py-3">Descripcion</th>
                  <th className="px-4 py-3">Establecimiento</th>
                  <th className="px-4 py-3">Pto. emision</th>
                  <th className="px-4 py-3">Secuencial</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {f.cajas.map((caja) => (
                  <tr
                    key={caja.id}
                    className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-900"
                  >
                    <td className="px-4 py-3 font-medium text-slate-950 dark:text-slate-50">
                      {caja.codigo}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      {caja.descripcion}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                      {caja.establecimiento}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                      {caja.puntoEmision}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                      {String(caja.secuencialActual).padStart(9, "0")}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge value={caja.estado} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => f.openEditCajaModal(caja)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => f.openEditCajaModal(caja)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                          title="Configurar"
                        >
                          <Settings className="h-4 w-4" />
                        </button>
                        {caja.estado === "ACTIVO" ? (
                          <button
                            type="button"
                            onClick={() =>
                              f.handleInactivarCaja(caja.id, caja.codigo)
                            }
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                            title="Inactivar"
                          >
                            <Power className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <TurnosRevisionView />

      <CajaModal
        isOpen={f.showCajaModal}
        editingId={f.editingCajaId}
        form={f.cajaForm}
        onChange={f.handleCajaFieldChange}
        onSubmit={f.submitCaja}
        onClose={f.closeCajaModal}
        isSubmitting={f.isSubmitting}
      />
      <SesionModal
        isOpen={f.showSesionModal}
        cajas={f.cajas}
        form={f.sesionForm}
        onChange={(field, value) =>
          f.setSesionForm((prev) => ({ ...prev, [field]: value }))
        }
        onSubmit={f.handleAbrirSesion}
        onClose={f.closeSesionModal}
        isSubmitting={f.isSubmitting}
      />
      <RevisarModal
        isOpen={f.showRevisarModal}
        sesionActiva={f.sesionActiva}
        form={f.revisarForm}
        onChange={(field, value) =>
          f.setRevisarForm((prev) => ({ ...prev, [field]: value }))
        }
        onSubmit={f.handleRevisarSesion}
        onClose={f.closeRevisarModal}
        isSubmitting={f.isSubmitting}
      />
    </div>
  );
}
