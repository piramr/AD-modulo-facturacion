import { Printer, Trash2 } from 'lucide-react'
import StatusBadge from './StatusBadge'

const money = (value) => `$${new Intl.NumberFormat('es-EC').format(Number(value) || 0)}`

export default function InvoicesTable({ records, onDelete, onPrint, isDeleting = false }) {
  if (!records.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
        No hay facturas que coincidan con los filtros actuales.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-medium text-slate-500 dark:bg-slate-900 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">Numero</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Pago</th>
              <th className="px-4 py-3">Emision</th>
              <th className="px-4 py-3">Subtotal</th>
              <th className="px-4 py-3">IVA</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Accion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {records.map((factura) => (
              <tr key={factura.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-900">
                <td className="px-4 py-3 font-medium text-slate-950 dark:text-slate-50">{factura.numero_factura}</td>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{factura.clienteNombre}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{factura.tipo_pago}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{factura.fecha_emision}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{money(factura.subtotal)}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{money(factura.total_iva)}</td>
                <td className="px-4 py-3 font-semibold text-slate-950 dark:text-slate-50">{money(factura.total)}</td>
                <td className="px-4 py-3"><StatusBadge value={factura.estado} /></td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onPrint(factura)}
                      disabled={isDeleting}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
                      aria-label={`Imprimir factura ${factura.numero_factura}`}
                    >
                      <Printer className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(factura.id)}
                      disabled={isDeleting}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/40"
                      aria-label={`Anular factura ${factura.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
