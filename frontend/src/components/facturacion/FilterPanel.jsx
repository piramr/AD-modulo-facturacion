import { SlidersHorizontal, X } from 'lucide-react'
import { useState } from 'react'

// ── Clientes ──────────────────────────────────────────────────────────────────
function ClienteFilters({ onApply, onCancel }) {
  const [form, setForm] = useState({
    nombre: '',
    cedula: '',
    tipoCliente: 'Todos',
    estado: 'Todos',
  })

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <label className="space-y-1">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-slate-400">Nombre</span>
        <input
          value={form.nombre}
          onChange={(e) => set('nombre', e.target.value)}
          placeholder="Ej: Juan Pérez"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
      </label>
      <label className="space-y-1">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-slate-400">Cédula</span>
        <input
          value={form.cedula}
          onChange={(e) => set('cedula', e.target.value)}
          placeholder="Ej: 1234567890"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
      </label>
      <label className="space-y-1">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-slate-400">Tipo de cliente</span>
        <select
          value={form.tipoCliente}
          onChange={(e) => set('tipoCliente', e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        >
          {['Todos', 'Contado', 'Crédito'].map((o) => <option key={o}>{o}</option>)}
        </select>
      </label>
      <label className="space-y-1">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-slate-400">Estado</span>
        <select
          value={form.estado}
          onChange={(e) => set('estado', e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        >
          {['Todos', 'Activo', 'Inactivo'].map((o) => <option key={o}>{o}</option>)}
        </select>
      </label>
      <Actions onApply={() => onApply(form)} onCancel={onCancel} />
    </div>
  )
}

// ── Facturas ──────────────────────────────────────────────────────────────────
function FacturaFilters({ onApply, onCancel }) {
  const [form, setForm] = useState({
    numeroFactura: '',
    clienteNombre: '',
    tipoPago: 'Todos',
    estado: 'Todos',
    fechaDesde: '',
    fechaHasta: '',
  })

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <label className="space-y-1">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-slate-400">Número de factura</span>
        <input
          value={form.numeroFactura}
          onChange={(e) => set('numeroFactura', e.target.value)}
          placeholder="Ej: 001-001-000000001"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
      </label>
      <label className="space-y-1">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-slate-400">Cliente</span>
        <input
          value={form.clienteNombre}
          onChange={(e) => set('clienteNombre', e.target.value)}
          placeholder="Nombre del cliente"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
      </label>
      <label className="space-y-1">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-slate-400">Tipo de pago</span>
        <select
          value={form.tipoPago}
          onChange={(e) => set('tipoPago', e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        >
          {['Todos', 'Efectivo', 'Crédito'].map((o) => <option key={o}>{o}</option>)}
        </select>
      </label>
      <label className="space-y-1">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-slate-400">Estado</span>
        <select
          value={form.estado}
          onChange={(e) => set('estado', e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        >
          {['Todos', 'Emitida', 'Pagada', 'Anulada'].map((o) => <option key={o}>{o}</option>)}
        </select>
      </label>
      <label className="space-y-1">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-slate-400">Fecha desde</span>
        <input
          type="date"
          value={form.fechaDesde}
          onChange={(e) => set('fechaDesde', e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
      </label>
      <label className="space-y-1">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-slate-400">Fecha hasta</span>
        <input
          type="date"
          value={form.fechaHasta}
          onChange={(e) => set('fechaHasta', e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
      </label>
      <Actions onApply={() => onApply(form)} onCancel={onCancel} />
    </div>
  )
}

// ── Botones compartidos ───────────────────────────────────────────────────────
function Actions({ onApply, onCancel }) {
  return (
    <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-full">
      <button
        type="button"
        onClick={onApply}
        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-700"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Aplicar filtros
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
      >
        <X className="h-4 w-4" />
        Cancelar
      </button>
    </div>
  )
}

// ── Componente principal exportado ────────────────────────────────────────────
export default function FilterPanel({ mode, onApply, onCancel }) {
  return (
    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 shadow-sm dark:border-indigo-900/40 dark:bg-indigo-950/20">
      <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.24em] text-indigo-500">
        Filtros avanzados
      </p>
      {mode === 'cliente'
        ? <ClienteFilters onApply={onApply} onCancel={onCancel} />
        : <FacturaFilters onApply={onApply} onCancel={onCancel} />}
    </div>
  )
}