import { SlidersHorizontal, X } from 'lucide-react'
import { useState } from 'react'

const inputClass = 'w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-600 dark:focus:ring-slate-800'
const labelClass = 'text-xs font-medium text-slate-500 dark:text-slate-400'

function Field({ label, children }) {
  return (
    <label className="space-y-1">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  )
}

function Actions({ onApply, onCancel }) {
  return (
    <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-full">
      <button
        type="button"
        onClick={onApply}
        className="inline-flex h-9 items-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Aplicar filtros
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        <X className="h-4 w-4" />
        Limpiar
      </button>
    </div>
  )
}

function ClienteFilters({ onApply, onCancel }) {
  const [form, setForm] = useState({ nombre: '', cedula: '', tipoCliente: 'Todos', estado: 'Todos' })
  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Field label="Nombre">
        <input value={form.nombre} onChange={(e) => set('nombre', e.target.value)} placeholder="Ej: Juan Perez" className={inputClass} />
      </Field>
      <Field label="Cedula">
        <input value={form.cedula} onChange={(e) => set('cedula', e.target.value)} placeholder="Ej: 1234567890" className={inputClass} />
      </Field>
      <Field label="Tipo de cliente">
        <select value={form.tipoCliente} onChange={(e) => set('tipoCliente', e.target.value)} className={inputClass}>
          <option value="Todos">Todos</option>
          <option value="CONTADO">Contado</option>
          <option value="CREDITO">Credito</option>
        </select>
      </Field>
      <Field label="Estado">
        <select value={form.estado} onChange={(e) => set('estado', e.target.value)} className={inputClass}>
          <option value="Todos">Todos</option>
          <option value="ACTIVO">Activo</option>
          <option value="INACTIVO">Inactivo</option>
        </select>
      </Field>
      <Actions onApply={() => onApply(form)} onCancel={onCancel} />
    </div>
  )
}

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
      <Field label="Numero de factura">
        <input value={form.numeroFactura} onChange={(e) => set('numeroFactura', e.target.value)} placeholder="001-001-000000001" className={inputClass} />
      </Field>
      <Field label="Cliente">
        <input value={form.clienteNombre} onChange={(e) => set('clienteNombre', e.target.value)} placeholder="Nombre del cliente" className={inputClass} />
      </Field>
      <Field label="Tipo de pago">
        <select value={form.tipoPago} onChange={(e) => set('tipoPago', e.target.value)} className={inputClass}>
          <option value="Todos">Todos</option>
          <option value="EFECTIVO">Efectivo</option>
          <option value="CREDITO">Credito</option>
        </select>
      </Field>
      <Field label="Estado">
        <select value={form.estado} onChange={(e) => set('estado', e.target.value)} className={inputClass}>
          <option value="Todos">Todos</option>
          <option value="PAGADA">Pagada</option>
          <option value="PAGO_PENDIENTE">Pendiente</option>
        </select>
      </Field>
      <Field label="Fecha desde">
        <input type="date" value={form.fechaDesde} onChange={(e) => set('fechaDesde', e.target.value)} className={inputClass} />
      </Field>
      <Field label="Fecha hasta">
        <input type="date" value={form.fechaHasta} onChange={(e) => set('fechaHasta', e.target.value)} className={inputClass} />
      </Field>
      <Actions onApply={() => onApply(form)} onCancel={onCancel} />
    </div>
  )
}

export default function FilterPanel({ mode, onApply, onCancel }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">Filtros avanzados</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Refina los resultados visibles en la tabla.</p>
        </div>
      </div>
      {mode === 'cliente'
        ? <ClienteFilters onApply={onApply} onCancel={onCancel} />
        : <FacturaFilters onApply={onApply} onCancel={onCancel} />}
    </div>
  )
}
