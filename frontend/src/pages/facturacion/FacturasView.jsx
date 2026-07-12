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
import FilterPanel from '../../components/facturacion/FilterPanel'
import InvoicesTable from '../../components/facturacion/InvoicesTable'
import PaginationControls from '../../components/facturacion/PaginationControls'
import RecordModal from '../../components/facturacion/RecordModal'
import RecordsToolbar from '../../components/facturacion/RecordsToolbar'

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
      <RecordsToolbar
        count={records.length}
        searchQuery={facturacion.searchQuery}
        onSearchQueryChange={facturacion.setSearchQuery}
        filterEstado={facturacion.filterEstado}
        onFilterEstadoChange={facturacion.setFilterEstado}
        filterOptions={[{ value: 'Todos', label: 'Todos' }, { value: 'Emitida', label: 'Emitida' }, { value: 'Pagada', label: 'Pagada' }, { value: 'Anulada', label: 'Anulada' }]}
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
    </div>
  )
}