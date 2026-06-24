// import { useOutletContext } from 'react-router-dom'
// import ClientsTable from '../../components/facturacion/ClientsTable'
// import PaginationControls from '../../components/facturacion/PaginationControls'
// import RecordModal from '../../components/facturacion/RecordModal'
// import RecordsToolbar from '../../components/facturacion/RecordsToolbar'

// export default function ClientesView() {
//   const facturacion = useOutletContext()

//   return (
//     <div className="space-y-4">
//       <RecordsToolbar count={facturacion.filteredClients.length} searchQuery={facturacion.searchQuery} onSearchQueryChange={facturacion.setSearchQuery} filterEstado={facturacion.filterEstado} onFilterEstadoChange={facturacion.setFilterEstado} filterOptions={[{ value: 'Todos', label: 'Todos' }, { value: 'Activo', label: 'Activo' }, { value: 'Inactivo', label: 'Inactivo' }]} onCreate={facturacion.openClienteModal} createLabel="Gestión de clientes" createButtonLabel="Nuevo cliente" />
//       <ClientsTable records={facturacion.filteredClients} onDelete={facturacion.handleDeleteCliente} onEdit={facturacion.openEditClienteModal} isDeleting={facturacion.isSubmitting} />
//       <PaginationControls pageInfo={facturacion.clientesPageInfo} onPageChange={facturacion.setClientesPage} />
//       <RecordModal isOpen={facturacion.showClienteModal} mode="cliente" title={facturacion.editingClienteId ? 'Editar cliente' : 'Registrar cliente'} form={facturacion.clienteForm} onFieldChange={facturacion.handleClienteFieldChange} onClose={facturacion.closeModal} onSubmit={facturacion.handleSubmit} isSubmitting={facturacion.isSubmitting} />
//     </div>
//   )
// }

import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import ClientsTable from '../../components/facturacion/ClientsTable'
import FilterPanel from '../../components/facturacion/FilterPanel'
import PaginationControls from '../../components/facturacion/PaginationControls'
import RecordModal from '../../components/facturacion/RecordModal'
import RecordsToolbar from '../../components/facturacion/RecordsToolbar'

export default function ClientesView() {
  const facturacion = useOutletContext()
  const [showFilters, setShowFilters] = useState(false)
  const [activeFilters, setActiveFilters] = useState(null)

  // Aplica los filtros avanzados encima de la lista ya filtrada por búsqueda/estado
  const records = (activeFilters ? facturacion.filteredClients.filter((c) => {
    const matchNombre = !activeFilters.nombre || c.nombre.toLowerCase().includes(activeFilters.nombre.toLowerCase())
    const matchCedula = !activeFilters.cedula || c.cedula.includes(activeFilters.cedula)
    const matchTipo = activeFilters.tipoCliente === 'Todos' || c.tipo_cliente === activeFilters.tipoCliente
    const matchEstado = activeFilters.estado === 'Todos' || c.estado === activeFilters.estado
    return matchNombre && matchCedula && matchTipo && matchEstado
  }) : facturacion.filteredClients)

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
        filterOptions={[{ value: 'Todos', label: 'Todos' }, { value: 'Activo', label: 'Activo' }, { value: 'Inactivo', label: 'Inactivo' }]}
        onCreate={facturacion.openClienteModal}
        createLabel="Gestión de clientes"
        createButtonLabel="Nuevo cliente"
        onToggleFilters={() => setShowFilters((prev) => !prev)}
        filtersActive={!!activeFilters}
      />

      {showFilters && (
        <FilterPanel mode="cliente" onApply={handleApply} onCancel={handleCancel} />
      )}

      <ClientsTable records={records} onDelete={facturacion.handleDeleteCliente} onEdit={facturacion.openEditClienteModal} isDeleting={facturacion.isSubmitting} />
      <PaginationControls pageInfo={facturacion.clientesPageInfo} onPageChange={facturacion.setClientesPage} />
      <RecordModal isOpen={facturacion.showClienteModal} mode="cliente" title={facturacion.editingClienteId ? 'Editar cliente' : 'Registrar cliente'} form={facturacion.clienteForm} onFieldChange={facturacion.handleClienteFieldChange} onClose={facturacion.closeModal} onSubmit={facturacion.handleSubmit} isSubmitting={facturacion.isSubmitting} />
    </div>
  )
}