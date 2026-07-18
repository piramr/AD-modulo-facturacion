// import { useOutletContext } from 'react-router-dom'
// import InvoicesTable from '../../components/facturacion/InvoicesTable'
// import PaginationControls from '../../components/facturacion/PaginationControls'
// import RecordModal from '../../components/facturacion/RecordModal'
// import RecordsToolbar from '../../components/facturacion/RecordsToolbar'

// export default function FacturasView() {
//   const facturacion = useOutletContext()

//   return (
//     <div className="space-y-4">
//       <RecordsToolbar
//         count={facturacion.filteredInvoices.length}
//         searchQuery={facturacion.searchQuery}
//         onSearchQueryChange={facturacion.setSearchQuery}
//         filterEstado={facturacion.filterEstado}
//         onFilterEstadoChange={facturacion.setFilterEstado}
//         filterOptions={[
//           { value: 'Todos', label: 'Todos' },
//           { value: 'Emitida', label: 'Emitida' },
//           { value: 'Pagada', label: 'Pagada' },
//           { value: 'Anulada', label: 'Anulada' },
//         ]}
//         onCreate={facturacion.openFacturaModal}
//         createLabel="Gestion de facturas"
//         createButtonLabel="Nueva factura"
//       />
//       <InvoicesTable
//         records={facturacion.filteredInvoices}
//         onDelete={facturacion.handleDeleteFactura}
//         onPrint={facturacion.handlePrintFactura}
//         isDeleting={facturacion.isSubmitting}
//       />
//       <PaginationControls pageInfo={facturacion.facturasPageInfo} onPageChange={facturacion.setFacturasPage} />
//       <RecordModal
//         isOpen={facturacion.showFacturaModal}
//         mode="factura"
//         title="Emitir factura"
//         form={facturacion.facturaForm}
//         onFieldChange={facturacion.handleInvoiceFieldChange}
//         onClose={facturacion.closeModal}
//         onSubmit={facturacion.handleSubmit}
//         clients={facturacion.availableClients}
//         products={facturacion.availableProducts}
//         isSubmitting={facturacion.isSubmitting}
//         detailForm={facturacion.detalleForm}
//         detailItems={facturacion.detalleItems}
//         onDetailFieldChange={facturacion.handleDetalleFieldChange}
//         onAddDetail={facturacion.addDetalleItem}
//         onRemoveDetail={facturacion.removeDetalleItem}
//         totals={facturacion.facturaTotals}
//       />
//     </div>
//   )
// }

import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { ClipboardCheck } from 'lucide-react'
import FilterPanel from '../../components/facturacion/FilterPanel'
import InvoicesTable from '../../components/facturacion/InvoicesTable'
import PaginationControls from '../../components/facturacion/PaginationControls'
import RecordModal from '../../components/facturacion/RecordModal'
import RecordsToolbar from '../../components/facturacion/RecordsToolbar'
import RevisarSesionModal from '../../components/facturacion/RevisarSesionModal'

export default function FacturasView() {
  const facturacion = useOutletContext()
  const [showFilters, setShowFilters] = useState(false)
  const [activeFilters, setActiveFilters] = useState(null)

  // Aplica los filtros avanzados encima de la lista ya filtrada por búsqueda/estado
  const records = (activeFilters ? facturacion.filteredInvoices.filter((f) => {
    const matchNumero = !activeFilters.numeroFactura || f.numero_factura.toLowerCase().includes(activeFilters.numeroFactura.toLowerCase())
    const matchCliente = !activeFilters.clienteNombre || (f.clienteNombre || '').toLowerCase().includes(activeFilters.clienteNombre.toLowerCase())
    const matchTipoPago = activeFilters.tipoPago === 'Todos' || f.tipo_pago === activeFilters.tipoPago
    const matchEstado = activeFilters.estado === 'Todos' || f.estado === activeFilters.estado
    const matchDesde = !activeFilters.fechaDesde || f.fecha_emision >= activeFilters.fechaDesde
    const matchHasta = !activeFilters.fechaHasta || f.fecha_emision <= activeFilters.fechaHasta
    return matchNumero && matchCliente && matchTipoPago && matchEstado && matchDesde && matchHasta
  }) : facturacion.filteredInvoices)

  const handleApply = (filters) => {
    setActiveFilters(filters)
    setShowFilters(false)
  }

  const handleCancel = () => {
    setActiveFilters(null)
    setShowFilters(false)
  }

  return (
    <div className="space-y-4">
      {facturacion.sesionActiva?.estado === 'ABIERTA' ? (
        <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/20">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                Turno activo en {facturacion.sesionActiva.caja?.codigo || 'caja'}
              </p>
              <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
                Al finalizar, cuenta el efectivo fisico y envia el turno a revision para ver el resumen.
              </p>
            </div>
            <button
              type="button"
              onClick={facturacion.openRevisarModal}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-amber-500 px-4 text-sm font-bold text-white transition hover:bg-amber-600"
            >
              <ClipboardCheck className="h-4 w-4" />
              Enviar turno a revision
            </button>
          </div>
        </section>
      ) : null}

      <RecordsToolbar
        count={records.length}
        searchQuery={facturacion.searchQuery}
        onSearchQueryChange={facturacion.setSearchQuery}
        filterEstado={facturacion.filterEstado}
        onFilterEstadoChange={facturacion.setFilterEstado}
        filterOptions={[{ value: 'Todos', label: 'Todos' }, { value: 'PAGADA', label: 'Pagada' }, { value: 'PAGO_PENDIENTE', label: 'Pendiente' }]}
        onCreate={facturacion.openFacturaModal}
        createLabel="Gestión de facturas"
        createButtonLabel="Nueva factura"
        onToggleFilters={() => setShowFilters((prev) => !prev)}
        filtersActive={!!activeFilters}
      />

      {showFilters && (
        <FilterPanel mode="factura" onApply={handleApply} onCancel={handleCancel} />
      )}

      <InvoicesTable records={records} onDelete={facturacion.handleDeleteFactura} onPrint={facturacion.handlePrintFactura} isDeleting={facturacion.isSubmitting} />
      <PaginationControls pageInfo={facturacion.facturasPageInfo} onPageChange={facturacion.setFacturasPage} />
      <RecordModal isOpen={facturacion.showFacturaModal} mode="factura" title="Emitir factura" form={facturacion.facturaForm} onFieldChange={facturacion.handleInvoiceFieldChange} onClose={facturacion.closeModal} onSubmit={facturacion.handleSubmit} clients={facturacion.availableClients} products={facturacion.availableProducts} isSubmitting={facturacion.isSubmitting} detailForm={facturacion.detalleForm} detailItems={facturacion.detalleItems} onDetailFieldChange={facturacion.handleDetalleFieldChange} onAddDetail={facturacion.addDetalleItem} onRemoveDetail={facturacion.removeDetalleItem} totals={facturacion.facturaTotals} />
      <RevisarSesionModal
        isOpen={facturacion.showRevisarModal}
        sesionActiva={facturacion.sesionActiva}
        form={facturacion.revisarForm}
        onChange={(field, value) => facturacion.setRevisarForm((prev) => ({ ...prev, [field]: value }))}
        onSubmit={facturacion.handleRevisarSesion}
        onClose={facturacion.closeRevisarModal}
        isSubmitting={facturacion.isSubmitting}
      />
    </div>
  )
}
