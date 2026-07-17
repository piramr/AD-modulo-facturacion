import { Pencil, Trash2 } from 'lucide-react'
import StatusBadge from './StatusBadge'

export default function ClientsTable({ records, onDelete, onEdit, isDeleting = false }) {
  if (!records.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
        No hay clientes que coincidan con los filtros actuales.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-medium text-slate-500 dark:bg-slate-900 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">Cedula</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Nacimiento</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Direccion</th>
              <th className="px-4 py-3">Telefono</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Accion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {records.map((cliente) => (
              <tr key={cliente.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-900">
                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{cliente.cedula}</td>
                <td className="px-4 py-3 font-medium text-slate-950 dark:text-slate-50">{cliente.nombre}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{cliente.fecha_nacimiento}</td>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{cliente.tipo_cliente}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{cliente.direccion}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{cliente.telefono}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{cliente.email}</td>
                <td className="px-4 py-3"><StatusBadge value={cliente.estado} /></td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(cliente)}
                      disabled={isDeleting}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
                      aria-label={`Editar cliente ${cliente.nombre}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(cliente.id)}
                      disabled={isDeleting}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/40"
                      aria-label={`Eliminar cliente ${cliente.nombre}`}
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
