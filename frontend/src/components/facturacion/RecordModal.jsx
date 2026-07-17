import { Plus, Trash2, X } from 'lucide-react'
import {
  CLIENTE_ESTADOS,
  FACTURA_ESTADOS,
  TIPO_CLIENTE_OPTIONS,
  TIPO_PAGO_OPTIONS,
} from '../../utils/validators'

const inputClass = 'w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-600 dark:focus:ring-slate-800'
const readonlyClass = 'w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400'
const labelClass = 'text-xs font-medium text-slate-500 dark:text-slate-400'
const money = (value) => new Intl.NumberFormat('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value) || 0)

function Field({ label, className = '', children }) {
  return (
    <label className={`space-y-1 ${className}`}>
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  )
}

function ClienteForm({ form, onFieldChange }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Cedula">
        <input value={form.cedula} onChange={(e) => onFieldChange('cedula', e.target.value)} type="text" inputMode="numeric" className={inputClass} placeholder="123456789" />
      </Field>
      <Field label="Fecha nacimiento">
        <input value={form.fecha_nacimiento} onChange={(e) => onFieldChange('fecha_nacimiento', e.target.value)} type="date" className={inputClass} />
      </Field>
      <Field label="Nombre" className="md:col-span-2">
        <input value={form.nombre} onChange={(e) => onFieldChange('nombre', e.target.value)} type="text" className={inputClass} placeholder="Nombre completo o razon social" />
      </Field>
      <Field label="Tipo cliente">
        <select value={form.tipo_cliente} onChange={(e) => onFieldChange('tipo_cliente', e.target.value)} className={inputClass}>
          {TIPO_CLIENTE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </Field>
      <Field label="Estado">
        <select value={form.estado} onChange={(e) => onFieldChange('estado', e.target.value)} className={inputClass}>
          {CLIENTE_ESTADOS.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
        </select>
      </Field>
      <Field label="Direccion" className="md:col-span-2">
        <input value={form.direccion} onChange={(e) => onFieldChange('direccion', e.target.value)} type="text" className={inputClass} placeholder="Direccion principal" />
      </Field>
      <Field label="Telefono">
        <input value={form.telefono} onChange={(e) => onFieldChange('telefono', e.target.value)} type="tel" className={inputClass} placeholder="+593 99 999 9999" />
      </Field>
      <Field label="Email">
        <input value={form.email} onChange={(e) => onFieldChange('email', e.target.value)} type="email" className={inputClass} placeholder="cliente@correo.com" />
      </Field>
    </div>
  )
}

function FacturaForm({
  form,
  onFieldChange,
  clients,
  products,
  detailForm,
  detailItems,
  onDetailFieldChange,
  onAddDetail,
  onRemoveDetail,
  totals,
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Cliente" className="md:col-span-2">
          <select value={form.cliente_id} onChange={(e) => onFieldChange('cliente_id', e.target.value)} className={inputClass}>
            <option value="">Selecciona un cliente</option>
            {clients.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>{cliente.nombre} - {cliente.cedula}</option>
            ))}
          </select>
        </Field>
        <Field label="Tipo pago">
          <select value={form.tipo_pago} onChange={(e) => onFieldChange('tipo_pago', e.target.value)} className={inputClass}>
            {TIPO_PAGO_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </Field>
        <Field label="Fecha emision">
          <input value={form.fecha_emision} onChange={(e) => onFieldChange('fecha_emision', e.target.value)} type="date" className={inputClass} />
        </Field>
        <Field label="Estado" className="md:col-span-2">
          <select value={form.estado} onChange={(e) => onFieldChange('estado', e.target.value)} className={inputClass}>
            {FACTURA_ESTADOS.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
          </select>
        </Field>
      </div>

      <section className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="text-sm font-semibold text-slate-950 dark:text-slate-50">Detalle de factura</h4>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Agrega productos desde Inventario y valida stock automaticamente.</p>
          </div>
          <button type="button" onClick={onAddDetail} className="inline-flex h-9 items-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200">
            <Plus className="h-4 w-4" />
            Agregar detalle
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_120px]">
          <Field label="Producto">
            <select value={detailForm?.producto_id ?? ''} onChange={(e) => onDetailFieldChange('producto_id', e.target.value)} className={inputClass}>
              <option value="">Selecciona un producto disponible</option>
              {products.map((producto) => (
                <option key={producto.codigo} value={producto.codigo}>{producto.codigo} - {producto.nombre} - Stock {producto.stockActual}</option>
              ))}
            </select>
          </Field>
          <Field label="Cantidad">
            <input value={detailForm?.cantidad ?? ''} onChange={(e) => onDetailFieldChange('cantidad', e.target.value)} type="number" min="1" step="1" className={inputClass} />
          </Field>
          <Field label="Producto seleccionado" className="md:col-span-2">
            <input value={detailForm?.producto_nombre ?? ''} readOnly type="text" className={readonlyClass} placeholder="Selecciona un producto" />
          </Field>
        </div>

        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-slate-50 text-xs font-medium text-slate-500 dark:bg-slate-900 dark:text-slate-400">
              <tr>
                <th className="px-3 py-2">Producto</th>
                <th className="px-3 py-2">Cant.</th>
                <th className="px-3 py-2">P. unit.</th>
                <th className="px-3 py-2">IVA</th>
                <th className="px-3 py-2">Subtotal</th>
                <th className="px-3 py-2 text-right">Accion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {detailItems.length === 0 ? (
                <tr><td className="px-3 py-4 text-slate-500 dark:text-slate-400" colSpan={6}>Sin detalles agregados todavia.</td></tr>
              ) : (
                detailItems.map((item) => (
                  <tr key={item.producto_id}>
                    <td className="px-3 py-2 font-medium text-slate-950 dark:text-slate-50">{item.producto_nombre}</td>
                    <td className="px-3 py-2">{item.cantidad}</td>
                    <td className="px-3 py-2">${money(item.precio_unitario)}</td>
                    <td className="px-3 py-2">{item.graba_iva ? 'Si' : 'No'}</td>
                    <td className="px-3 py-2 font-medium">${money(item.subtotal_linea)}</td>
                    <td className="px-3 py-2 text-right">
                      <button type="button" onClick={() => onRemoveDetail(item.producto_id)} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950">
            <span className="block text-xs text-slate-500">Subtotal</span>
            <span className="font-semibold text-slate-950 dark:text-slate-50">${money(totals.subtotal)}</span>
          </div>
          <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950">
            <span className="block text-xs text-slate-500">IVA</span>
            <span className="font-semibold text-slate-950 dark:text-slate-50">${money(totals.total_iva)}</span>
          </div>
          <div className="rounded-md border border-slate-900 bg-slate-950 px-3 py-2 text-sm text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-950">
            <span className="block text-xs opacity-70">Total</span>
            <span className="font-semibold">${money(totals.total)}</span>
          </div>
        </div>
      </section>
    </div>
  )
}

export default function RecordModal(props) {
  const {
    isOpen,
    mode,
    title,
    form,
    onFieldChange,
    onClose,
    onSubmit,
    clients = [],
    products = [],
    isSubmitting = false,
    detailForm,
    detailItems = [],
    onDetailFieldChange,
    onAddDetail,
    onRemoveDetail,
    totals = { subtotal: 0, total_iva: 0, total: 0 },
  } = props

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div>
            <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">{title}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{mode === 'cliente' ? 'Datos del cliente y estado comercial.' : 'Cabecera, productos y totales de la factura.'}</p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800" aria-label="Cerrar modal">
            <X className="h-4 w-4" />
          </button>
        </header>

        <form
          className="flex-1 overflow-y-auto px-5 py-4"
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit()
          }}
        >
          {mode === 'cliente' ? (
            <ClienteForm form={form} onFieldChange={onFieldChange} />
          ) : (
            <FacturaForm
              form={form}
              onFieldChange={onFieldChange}
              clients={clients}
              products={products}
              detailForm={detailForm}
              detailItems={detailItems}
              onDetailFieldChange={onDetailFieldChange}
              onAddDetail={onAddDetail}
              onRemoveDetail={onRemoveDetail}
              totals={totals}
            />
          )}
        </form>

        <footer className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3 dark:border-slate-800 dark:bg-slate-900">
          <button type="button" onClick={onClose} className="inline-flex h-9 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800">
            Cancelar
          </button>
          <button type="button" onClick={onSubmit} disabled={isSubmitting} className="inline-flex h-9 items-center rounded-md bg-slate-950 px-3 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200">
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </button>
        </footer>
      </div>
    </div>
  )
}
