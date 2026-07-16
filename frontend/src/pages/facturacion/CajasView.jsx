import { useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Edit2, Power, Plus, X, MonitorCheck, ClipboardCheck } from 'lucide-react'
import StatusBadge from '../../components/facturacion/StatusBadge'

const labelClass = 'text-[10px] font-extrabold uppercase tracking-[0.24em] text-slate-400'
const inputClass = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-red-400 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100'

function Field({ label, children }) {
  return (
    <label className="space-y-1">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  )
}

// ── Modal de caja (crear/editar) ──────────────────────────────────────────────
function CajaModal({ isOpen, editingId, form, onChange, onSubmit, onClose, isSubmitting }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
          <div>
            <p className={labelClass}>Formulario</p>
            <h3 className="mt-1 text-lg font-black text-slate-900 dark:text-slate-100">
              {editingId ? 'Editar caja' : 'Nueva caja'}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Código">
            <input value={form.codigo} onChange={(e) => onChange('codigo', e.target.value)} className={inputClass} placeholder="Ej: CAJA-01" />
          </Field>
          <Field label="Establecimiento">
            <input value={form.establecimiento} onChange={(e) => onChange('establecimiento', e.target.value)} className={inputClass} placeholder="001" maxLength={3} />
          </Field>
          <Field label="Descripción">
            <input value={form.descripcion} onChange={(e) => onChange('descripcion', e.target.value)} className={inputClass} placeholder="Caja principal" />
          </Field>
          <Field label="Punto de emisión">
            <input value={form.puntoEmision} onChange={(e) => onChange('puntoEmision', e.target.value)} className={inputClass} placeholder="001" maxLength={3} />
          </Field>
          {editingId && (
            <Field label="Secuencial actual">
              <input type="number" value={form.secuencialActual} onChange={(e) => onChange('secuencialActual', e.target.value)} className={inputClass} min={0} />
            </Field>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
            Cancelar
          </button>
          <button type="button" onClick={onSubmit} disabled={isSubmitting} className="rounded-xl bg-red-700 px-5 py-2 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-70">
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal abrir sesión ────────────────────────────────────────────────────────
function SesionModal({ isOpen, cajas, form, onChange, onSubmit, onClose, isSubmitting }) {
  if (!isOpen) return null
  const cajasActivas = cajas.filter((c) => c.estado === 'ACTIVO')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
          <div>
            <p className={labelClass}>Apertura de turno</p>
            <h3 className="mt-1 text-lg font-black text-slate-900 dark:text-slate-100">Abrir sesión de caja</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-5 space-y-4">
          <Field label="Seleccionar caja">
            <select value={form.cajaId} onChange={(e) => onChange('cajaId', e.target.value)} className={inputClass}>
              <option value="">Elige una caja disponible</option>
              {cajasActivas.map((c) => (
                <option key={c.id} value={c.id}>{c.codigo} — {c.descripcion} ({c.establecimiento}-{c.puntoEmision})</option>
              ))}
            </select>
          </Field>
          <Field label="Monto de apertura ($)">
            <input type="number" min={0} step="0.01" value={form.montoApertura} onChange={(e) => onChange('montoApertura', e.target.value)} className={inputClass} placeholder="0.00" />
          </Field>
        </div>
        <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">Cancelar</button>
          <button type="button" onClick={onSubmit} disabled={isSubmitting} className="rounded-xl bg-red-700 px-5 py-2 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-70">
            {isSubmitting ? 'Abriendo...' : 'Abrir turno'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal enviar a revisión ───────────────────────────────────────────────────
function RevisarModal({ isOpen, sesionActiva, form, onChange, onSubmit, onClose, isSubmitting }) {
  if (!isOpen || !sesionActiva) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
          <div>
            <p className={labelClass}>Cierre de turno</p>
            <h3 className="mt-1 text-lg font-black text-slate-900 dark:text-slate-100">Enviar a revisión</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-5 space-y-4">
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
            <p className={labelClass + ' mb-2'}>Resumen del turno</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-slate-500">Caja</span>
              <span className="font-bold">{sesionActiva.caja?.codigo}</span>
              <span className="text-slate-500">Facturas emitidas</span>
              <span className="font-bold">{sesionActiva.cantidadFacturas}</span>
              <span className="text-slate-500">Ventas efectivo</span>
              <span className="font-bold">${sesionActiva.totalVentasEfectivo}</span>
              <span className="text-slate-500">Ventas crédito</span>
              <span className="font-bold">${sesionActiva.totalVentasCredito}</span>
              <span className="text-slate-500">Monto apertura</span>
              <span className="font-bold">${sesionActiva.montoApertura}</span>
            </div>
          </div>
          <Field label="Monto de cierre real ($) — Lo que hay en caja">
            <input type="number" min={0} step="0.01" value={form.montoCierreReal} onChange={(e) => onChange('montoCierreReal', e.target.value)} className={inputClass} placeholder="0.00" />
          </Field>
        </div>
        <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">Cancelar</button>
          <button type="button" onClick={onSubmit} disabled={isSubmitting} className="rounded-xl bg-red-700 px-5 py-2 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-70">
            {isSubmitting ? 'Enviando...' : 'Enviar a revisión'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Vista principal ───────────────────────────────────────────────────────────
export default function CajasView() {
  const f = useOutletContext()

  useEffect(() => {
    f.reloadCajas()
  }, [])

  const formatMoney = (v) => `$${Number(v || 0).toFixed(2)}`

  return (
    <div className="space-y-6">

      {/* Sesión activa del cajero */}
      {f.sesionActiva ? (
        <div className={`rounded-2xl border p-4 ${
          f.sesionActiva.estado === 'ABIERTA'
            ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20'
            : 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20'
        }`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className={labelClass}>Tu turno activo</p>
              <p className="mt-1 text-base font-black text-slate-900 dark:text-slate-100">
                {f.sesionActiva.caja?.codigo} — {f.sesionActiva.caja?.descripcion}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Apertura: {formatMoney(f.sesionActiva.montoApertura)} · Facturas: {f.sesionActiva.cantidadFacturas} · Estado: <strong>{f.sesionActiva.estado}</strong>
              </p>
            </div>
            {f.sesionActiva.estado === 'ABIERTA' && (
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
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className={labelClass}>Sin turno activo</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">No tienes ningún turno de caja abierto en este momento.</p>
            </div>
            <button
              type="button"
              onClick={f.openSesionModal}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
            >
              <MonitorCheck className="h-4 w-4" />
              Abrir turno
            </button>
          </div>
        </div>
      )}

      {/* Encabezado de tabla + botón crear */}
      <div className="flex items-center justify-between">
        <div>
          <p className={labelClass}>Administración de cajas</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {f.cajas.length} caja{f.cajas.length !== 1 ? 's' : ''} registrada{f.cajas.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={f.openCajaModal}
          className="inline-flex items-center gap-2 rounded-xl bg-red-700 px-4 py-2 text-xs font-bold text-white hover:bg-red-800"
        >
          <Plus className="h-4 w-4" />
          Nueva caja
        </button>
      </div>

      {/* Tabla de cajas */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {f.cajasLoading ? (
          <p className="p-6 text-sm text-slate-500">Cargando cajas...</p>
        ) : f.cajas.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No hay cajas registradas.</p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Descripción</th>
                <th className="px-4 py-3">Establecimiento</th>
                <th className="px-4 py-3">Pto. Emisión</th>
                <th className="px-4 py-3">Secuencial</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {f.cajas.map((caja) => (
                <tr key={caja.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">{caja.codigo}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{caja.descripcion}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{caja.establecimiento}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{caja.puntoEmision}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{String(caja.secuencialActual).padStart(9, '0')}</td>
                  <td className="px-4 py-3"><StatusBadge value={caja.estado} /></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => f.openEditCajaModal(caja)}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      {caja.estado === 'ACTIVO' && (
                        <button
                          type="button"
                          onClick={() => f.handleInactivarCaja(caja.id, caja.codigo)}
                          className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                          title="Inactivar"
                        >
                          <Power className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modales */}
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
        onChange={(field, value) => f.setSesionForm((prev) => ({ ...prev, [field]: value }))}
        onSubmit={f.handleAbrirSesion}
        onClose={f.closeSesionModal}
        isSubmitting={f.isSubmitting}
      />
      <RevisarModal
        isOpen={f.showRevisarModal}
        sesionActiva={f.sesionActiva}
        form={f.revisarForm}
        onChange={(field, value) => f.setRevisarForm((prev) => ({ ...prev, [field]: value }))}
        onSubmit={f.handleRevisarSesion}
        onClose={f.closeRevisarModal}
        isSubmitting={f.isSubmitting}
      />
    </div>
  )
}