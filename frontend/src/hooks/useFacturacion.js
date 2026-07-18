import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  createCliente,
  createFactura,
  deleteCliente,
  deleteFactura,
  downloadFacturaPdf,
  downloadReporteClientesPdf,
  downloadReporteFacturasPdf,
  getFacturacionSnapshot,
  updateCliente,
} from '../api/facturacionService'
import {
  calculateFacturaTotals,
  FACTURA_ESTADOS,
  getFirstError,
  TIPO_CLIENTE_OPTIONS,
  TIPO_PAGO_OPTIONS,
  validateClienteForm,
  validateDetalleFacturaForm,
  validateFacturaForm,
} from '../utils/validators'

import {
  getCajas,
  getSesionActiva,
  getSesionesRevision,
  getPreferencias,
  crearCaja,
  actualizarCaja,
  inactivarCaja,
  abrirSesionCaja,
  revisarSesionCaja,
  cerrarSesionCaja,
} from '../api/facturacionService'

import { getStoredUser } from '../api/authService'
import { getRoleFlags } from '../utils/roles'

const THEME_KEY = 'facturacion-theme'
const INITIAL_CLIENT_FORM = {
  cedula: '',
  nombre: '',
  fecha_nacimiento: '',
  tipo_cliente: 'CONTADO',
  direccion: '',
  telefono: '',
  email: '',
  estado: 'ACTIVO',
}
const INITIAL_FACTURA_FORM = {
  cliente_id: '',
  tipo_pago: 'EFECTIVO',
  fecha_emision: new Date().toISOString().split('T')[0],
  estado: 'PAGADA',
}
const INITIAL_DETALLE_FORM = {
  producto_id: '',
  producto_nombre: '',
  cantidad: '',
  precio_unitario: '',
  graba_iva: true,
  porcentaje_iva_aplicado: 15,
  stock_actual: 0,
}

const DEFAULT_PAGE_SIZE = 10
const CLIENTE_ESTADOS = ['ACTIVO', 'INACTIVO']

const formatMoney = (value) => `$${new Intl.NumberFormat('es-CO').format(Number(value) || 0)}`

const getSectionFromPath = (pathname) => {
  if (pathname.includes('/clientes')) return 'Clientes'
  if (pathname.includes('/facturas')) return 'Facturas'
  if (pathname.includes('/reportes')) return 'Reportes'
  if (pathname.includes('/cajas')) return 'Cajas'
  if (pathname.includes('/cuentas')) return 'Cuentas'
  if (pathname.includes('/turnos-revision')) return 'Turnos en revision'
  if (pathname.includes('/saldos')) return 'Saldos'
  if (pathname.includes('/ajustes')) return 'Ajustes'
  return 'Resumen'
}

export function useFacturacion() {
  const location = useLocation()
  const [clientes, setClientes] = useState([])
  const [facturas, setFacturas] = useState([])
  const [productos, setProductos] = useState([])
  const [auditoria, setAuditoria] = useState([])
  const [clientesPage, setClientesPage] = useState(1)
  const [facturasPage, setFacturasPage] = useState(1)
  const [clientesLimit, setClientesLimit] = useState(DEFAULT_PAGE_SIZE)
  const [facturasLimit, setFacturasLimit] = useState(DEFAULT_PAGE_SIZE)
  const [clientesPageInfo, setClientesPageInfo] = useState({ currentPage: 1, totalPages: 1, totalCount: 0 })
  const [facturasPageInfo, setFacturasPageInfo] = useState({ currentPage: 1, totalPages: 1, totalCount: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('cliente')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterEstado, setFilterEstado] = useState('Todos')
  const [themeMode, setThemeMode] = useState(() => {
    if (typeof window === 'undefined') return 'light'
    const savedTheme = window.localStorage.getItem(THEME_KEY)
    if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  const [clienteForm, setClienteForm] = useState(INITIAL_CLIENT_FORM)
  const [editingClienteId, setEditingClienteId] = useState(null)
  const [facturaForm, setFacturaForm] = useState(INITIAL_FACTURA_FORM)
  const [detalleForm, setDetalleForm] = useState(INITIAL_DETALLE_FORM)
  const [detalleItems, setDetalleItems] = useState([])
  const [busyAction, setBusyAction] = useState(null)

  // ── ROL DEL USUARIO ───────────────────────────────────────────────────────────
  const storedUser = getStoredUser()
  const { roles: userRoles, isAdmin, isCajero } = useMemo(() => getRoleFlags(storedUser), [storedUser])

  // ── SESIÓN INICIAL ────────────────────────────────────────────────────────────
  const [sesionCargada, setSesionCargada] = useState(false)

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
  })

  const currentSection = useMemo(() => getSectionFromPath(location.pathname), [location.pathname])

  const applySnapshot = (snapshot) => {
    setClientes(snapshot.clientes)
    setFacturas(snapshot.facturas)
    setProductos(snapshot.productos)
    setAuditoria(snapshot.auditoria || [])
    setClientesPageInfo(snapshot.clientesPageInfo)
    setFacturasPageInfo(snapshot.facturasPageInfo)
  }

  const snapshotFilters = useMemo(() => {
    const estado = filterEstado === 'Todos' ? undefined : filterEstado
    const clienteEstado = estado && CLIENTE_ESTADOS.includes(estado) ? estado : undefined
    const facturaEstado = estado && FACTURA_ESTADOS.includes(estado) ? estado : undefined

    return {
      clientesFilter: currentSection === 'Clientes' && clienteEstado ? { estado: clienteEstado } : null,
      facturasFilter: currentSection === 'Facturas' && facturaEstado ? { estadoPago: facturaEstado } : null,
    }
  }, [currentSection, filterEstado])

  const reloadSnapshot = (overrides = {}) => getFacturacionSnapshot('', {
    clientesPage: overrides.clientesPage || clientesPage,
    clientesLimit: overrides.clientesLimit || clientesLimit,
    clientesFilter: overrides.clientesFilter ?? snapshotFilters.clientesFilter,
    facturasPage: overrides.facturasPage || facturasPage,
    facturasLimit: overrides.facturasLimit || facturasLimit,
    facturasFilter: overrides.facturasFilter ?? snapshotFilters.facturasFilter,
  })

  // ── CAJAS ────────────────────────────────────────────────────────────────────
  const [cajas, setCajas] = useState([])
  const [sesionActiva, setSesionActiva] = useState(null)
  const [sesionesRevision, setSesionesRevision] = useState([])
  const [cajasLoading, setCajasLoading] = useState(false)

  const INITIAL_CAJA_FORM = {
    codigo: '',
    descripcion: '',
    establecimiento: '001',
    puntoEmision: '001',
    secuencialActual: 0,
  }
  const [cajaForm, setCajaForm] = useState(INITIAL_CAJA_FORM)
  const [editingCajaId, setEditingCajaId] = useState(null)
  const [showCajaModal, setShowCajaModal] = useState(false)
  const [showSesionModal, setShowSesionModal] = useState(false)
  const [showRevisarModal, setShowRevisarModal] = useState(false)
  const [showCerrarModal, setShowCerrarModal] = useState(false)
  const [sesionForm, setSesionForm] = useState({ cajaId: '', montoApertura: '' })
  const [revisarForm, setRevisarForm] = useState({ sesionCajaId: '', montoCierreReal: '' })
  const [cierreForm, setCierreForm] = useState({
    sesionCajaId: '',
    totalVentasEfectivo: 0,
    distribucionCuentas: [{ cuentaId: '', monto: '' }],
  })

  useEffect(() => {
    let mounted = true

    getFacturacionSnapshot('', {
      clientesPage,
      clientesLimit,
      clientesFilter: snapshotFilters.clientesFilter,
      facturasPage,
      facturasLimit,
      facturasFilter: snapshotFilters.facturasFilter,
    })
      .then((snapshot) => {
        if (!mounted) return
        applySnapshot(snapshot)
      })
      .catch(() => {
        toast.error('No fue posible cargar la información de facturación.')
      })
      .finally(() => {
        if (mounted) setIsLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [clientesPage, clientesLimit, facturasPage, facturasLimit, snapshotFilters])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.document.documentElement.classList.toggle('dark', themeMode === 'dark')
    window.localStorage.setItem(THEME_KEY, themeMode)
  }, [themeMode])

  // Carga la sesión activa automáticamente al iniciar
  useEffect(() => {
    reloadSesionActiva()
  }, [])

  const availableClients = useMemo(() => clientes, [clientes])
  const availableProducts = useMemo(() => productos.filter((producto) => producto.stockActual > 0), [productos])
  const facturaTotals = useMemo(() => calculateFacturaTotals(detalleItems), [detalleItems])

  const kpis = useMemo(() => {
    const totalFacturado = facturas.reduce((accumulator, factura) => accumulator + Number(factura.total || 0), 0)
    const pagadasCount = facturas.filter((factura) => factura.estado === 'PAGADA').length
    const pendientesCount = facturas.filter((factura) => factura.estado === 'PAGO_PENDIENTE').length
    const clientesActivos = clientes.filter((cliente) => cliente.estado === 'ACTIVO').length

    if (currentSection === 'Clientes') {
      return [
        { title: 'Total clientes', value: clientes.length, sub: 'Registros en catálogo', tone: 'indigo' },
        { title: 'Clientes activos', value: clientesActivos, sub: 'Operaciones vigentes', tone: 'emerald' },
        { title: 'Clientes inactivos', value: clientes.length - clientesActivos, sub: 'Sin actividad', tone: 'slate' },
        { title: 'Tipos de cliente', value: TIPO_CLIENTE_OPTIONS.length, sub: 'Contado / Crédito', tone: 'blue' },
      ]
    }

    if (currentSection === 'Facturas') {
      return [
        { title: 'Total facturas', value: facturas.length, sub: 'Cabeceras emitidas', tone: 'indigo' },
        { title: 'Pagadas', value: pagadasCount, sub: 'Conciliadas', tone: 'emerald' },
        { title: 'Pendientes', value: pendientesCount, sub: 'Pendientes de cobro', tone: 'amber' },
        { title: 'Tipos de pago', value: TIPO_PAGO_OPTIONS.length, sub: 'Efectivo / Crédito', tone: 'blue' },
      ]
    }

    return [
      { title: 'Facturado total', value: formatMoney(totalFacturado), sub: 'Total consolidado', tone: 'indigo' },
      { title: 'IVA acumulado', value: formatMoney(facturas.reduce((acc, factura) => acc + Number(factura.total_iva || 0), 0)), sub: 'Impuesto generado', tone: 'emerald' },
      { title: 'Facturas pagadas', value: pagadasCount, sub: 'Flujo de caja', tone: 'amber' },
      { title: 'Clientes activos', value: clientesActivos, sub: 'Cartera vigente', tone: 'blue' },
    ]
  }, [clientes, currentSection, facturas])

  const filteredClients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return clientes.filter((cliente) => {
      const matchesQuery =
        !query ||
        cliente.nombre.toLowerCase().includes(query) ||
        cliente.cedula.toLowerCase().includes(query) ||
        cliente.email.toLowerCase().includes(query) ||
        cliente.id.toLowerCase().includes(query)
      const matchesEstado = filterEstado === 'Todos' || !CLIENTE_ESTADOS.includes(filterEstado) || cliente.estado === filterEstado
      return matchesQuery && matchesEstado
    })
  }, [clientes, filterEstado, searchQuery])

  const filteredInvoices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return facturas.filter((factura) => {
      const matchesQuery =
        !query ||
        String(factura.clienteNombre || '').toLowerCase().includes(query) ||
        factura.numero_factura.toLowerCase().includes(query) ||
        factura.id.toLowerCase().includes(query)
      const matchesEstado = filterEstado === 'Todos' || !FACTURA_ESTADOS.includes(filterEstado) || factura.estado === filterEstado
      return matchesQuery && matchesEstado
    })
  }, [facturas, filterEstado, searchQuery])

  const updateSearchQuery = (value) => {
    setSearchQuery(value)
    if (currentSection === 'Clientes') setClientesPage(1)
    if (currentSection === 'Facturas') setFacturasPage(1)
  }

  const updateFilterEstado = (value) => {
    setFilterEstado(value)
    if (currentSection === 'Clientes') setClientesPage(1)
    if (currentSection === 'Facturas') setFacturasPage(1)
  }

  const openClienteModal = () => {
    setEditingClienteId(null)
    resetClientForm()
    setModalMode('cliente')
    setIsModalOpen(true)
  }

  const openEditClienteModal = (cliente) => {
    setEditingClienteId(cliente.id)
    setClienteForm({
      cedula: cliente.cedula,
      nombre: cliente.nombre,
      fecha_nacimiento: cliente.fecha_nacimiento,
      tipo_cliente: cliente.tipo_cliente,
      direccion: cliente.direccion,
      telefono: cliente.telefono,
      email: cliente.email,
      estado: cliente.estado,
    })
    setModalMode('cliente')
    setIsModalOpen(true)
  }

  const openFacturaModal = () => {
    setModalMode('factura')
    setIsModalOpen(true)
  }

  const closeModal = () => setIsModalOpen(false)
  const toggleTheme = () => setThemeMode((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))
  const resetClientForm = () => setClienteForm(INITIAL_CLIENT_FORM)
  const resetInvoiceForm = () => setFacturaForm({
    ...INITIAL_FACTURA_FORM,
    fecha_emision: new Date().toISOString().split('T')[0],
  })
  const resetDetalleForm = () => setDetalleForm(INITIAL_DETALLE_FORM)
  const resetDetalleItems = () => setDetalleItems([])

  const handleClienteFieldChange = (field, value) => setClienteForm((currentForm) => ({ ...currentForm, [field]: value }))
  const handleInvoiceFieldChange = (field, value) => setFacturaForm((currentForm) => ({ ...currentForm, [field]: value }))
  const handleDetalleFieldChange = (field, value) => {
    if (field === 'producto_id') {
      const producto = productos.find((item) => item.codigo === value)
      if (producto) {
        setDetalleForm((currentForm) => ({
          ...currentForm,
          producto_id: producto.codigo,
          producto_nombre: producto.nombre,
          precio_unitario: producto.pvp,
          graba_iva: producto.grabaIva,
          porcentaje_iva_aplicado: producto.porcentajeIvaAplicado,
          stock_actual: producto.stockActual,
        }))
        return
      }
    }

    setDetalleForm((currentForm) => ({ ...currentForm, [field]: value }))
  }

  const addDetalleItem = () => {
    const validation = validateDetalleFacturaForm(detalleForm)
    if (!validation.valid) {
      toast.error(getFirstError(validation.errors))
      return false
    }

    setDetalleItems((currentItems) => {
      if (currentItems.some((item) => item.producto_id === validation.values.producto_id)) {
        toast.error('No puedes repetir el mismo producto en el detalle.')
        return currentItems
      }
      return [...currentItems, validation.values]
    })
    resetDetalleForm()
    return true
  }

  const removeDetalleItem = (productoId) => {
    setDetalleItems((currentItems) => currentItems.filter((item) => item.producto_id !== productoId))
  }

  const submitCliente = async () => {
    const validation = validateClienteForm(clienteForm, clientes)
    if (!validation.valid) {
      toast.error(getFirstError(validation.errors))
      return false
    }

    setBusyAction('cliente')
    try {
      if (editingClienteId) {
        await updateCliente(editingClienteId, validation.values)
      } else {
        await createCliente(validation.values)
        setClientesPage(1)
      }
      applySnapshot(await reloadSnapshot(editingClienteId ? {} : { clientesPage: 1 }))
      toast.success(`Cliente "${validation.values.nombre}" ${editingClienteId ? 'actualizado' : 'registrado'} correctamente.`)
      setEditingClienteId(null)
      resetClientForm()
      closeModal()
      return true
    } catch (error) {
      toast.error(error.message || 'No fue posible registrar el cliente.')
      return false
    } finally {
      setBusyAction(null)
    }
  }

  const submitFactura = async () => {
    if (!sesionActiva || sesionActiva.estado !== 'ABIERTA') {
      toast.error('Debes abrir un turno de caja antes de emitir una factura.')
      return false
    }

    const validation = validateFacturaForm(facturaForm, clientes, facturas, detalleItems)
    if (!validation.valid) {
      toast.error(getFirstError(validation.errors))
      return false
    }

    const totals = calculateFacturaTotals(detalleItems)

    setBusyAction('factura')
    try {
      await createFactura({
        ...validation.values,
        ...totals,
        sesionCajaId: sesionActiva.id,
        detalles: detalleItems,
      })
      setFacturasPage(1)
      applySnapshot(await reloadSnapshot({ facturasPage: 1 }))
      toast.success(`Factura emitida por ${formatMoney(totals.total)}.`)
      resetInvoiceForm()
      resetDetalleItems()
      closeModal()
      return true
    } catch (error) {
      toast.error(error.message || 'No fue posible emitir la factura.')
      return false
    } finally {
      setBusyAction(null)
    }
  }

  const handleSubmit = async () => (modalMode === 'cliente' ? submitCliente() : submitFactura())

  const handleDeleteCliente = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: '¿Eliminar Cliente?',
      message: 'Esta acción es irreversible. Se eliminará el registro del cliente permanentemente del catálogo.',
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false })) // Cierra el diálogo
        setBusyAction(`delete-cliente-${id}`)
        try {
          await deleteCliente(id)
          applySnapshot(await reloadSnapshot())
          toast.success('Cliente eliminado correctamente.')
        } catch (error) {
          toast.error(error.message || 'No fue posible eliminar el cliente.')
        } finally {
          setBusyAction(null)
        }
      },
    })
  }

  const handleDeleteFactura = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: '¿Eliminar Factura?',
      message: '¿Estás seguro de que deseas anular y borrar esta factura? Los montos acumulados se recalcularán.',
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false })) // Cierra el modal
        setBusyAction(`delete-factura-${id}`)
        try {
          await deleteFactura(id)
          applySnapshot(await reloadSnapshot())
          toast.success('Factura eliminada correctamente.')
        } catch (error) {
          toast.error(error.message || 'No fue posible eliminar la factura.')
        } finally {
          setBusyAction(null)
        }
      },
    })
  }

  const handleLogout = () => {
    setUserMenuOpen(false)
    toast.info('Has cerrado la sesión del administrador.')
  }

  const updateFacturasLimit = (limit) => {
    setFacturasLimit(limit)
    setFacturasPage(1)
  }

  const updateClientesLimit = (limit) => {
    setClientesLimit(limit)
    setClientesPage(1)
  }

  const handlePrintFactura = async (factura) => {
    setBusyAction(`print-factura-${factura.id}`)
    try {
      const message = await downloadFacturaPdf(factura.id, factura.numero_factura)
      toast.success(message)
    } catch (error) {
      toast.error(error.message || 'No fue posible imprimir la factura.')
    } finally {
      setBusyAction(null)
    }
  }

  const handleDownloadClientesPdf = async () => {
    setBusyAction('reporte-clientes-pdf')
    try {
      const message = await downloadReporteClientesPdf()
      toast.success(message)
    } catch (error) {
      toast.error(error.message || 'No fue posible generar el reporte de clientes.')
    } finally {
      setBusyAction(null)
    }
  }

  const handleDownloadFacturasPdf = async () => {
    setBusyAction('reporte-facturas-pdf')
    try {
      const message = await downloadReporteFacturasPdf()
      toast.success(message)
    } catch (error) {
      toast.error(error.message || 'No fue posible generar el reporte de facturas.')
    } finally {
      setBusyAction(null)
    }
  }

  // ── Carga inicial de cajas ────────────────────────────────────────────────────
  const reloadCajas = async () => {
    setCajasLoading(true)
    try {
      const listaCajas = await getCajas()
      setCajas(listaCajas)
    } catch (error) {
      toast.error('No fue posible cargar las cajas.')
    } finally {
      setCajasLoading(false)
    }
  }

  // ── Sesión activa ─────────────────────────────────────────────────────────────
 const reloadSesionActiva = async (usuarioId, sesionExplicita = null) => {
    try {
      if (sesionExplicita) {
        setSesionActiva(sesionExplicita)
        setSesionCargada(true)
        return sesionExplicita
      }
      const uid = usuarioId || storedUser?.id
      if (!uid) { setSesionActiva(null); setSesionCargada(true); return null }
      const sesion = await getSesionActiva(String(uid))
      setSesionActiva(sesion || null)
      return sesion || null
    } catch {
      setSesionActiva(null)
      return null
    } finally {
      setSesionCargada(true)
    }
  }

  const reloadSesionesRevision = async () => {
    try {
      const sesiones = await getSesionesRevision()
      setSesionesRevision(Array.isArray(sesiones) ? sesiones : [])
    } catch {
      setSesionesRevision([])
    }
  }
  // ── CRUD de cajas ─────────────────────────────────────────────────────────────
  const openCajaModal = () => {
    setEditingCajaId(null)
    setCajaForm(INITIAL_CAJA_FORM)
    setShowCajaModal(true)
  }

  const openEditCajaModal = (caja) => {
    setEditingCajaId(caja.id)
    setCajaForm({
      codigo: caja.codigo,
      descripcion: caja.descripcion,
      establecimiento: caja.establecimiento,
      puntoEmision: caja.puntoEmision,
      secuencialActual: caja.secuencialActual,
    })
    setShowCajaModal(true)
  }

  const closeCajaModal = () => setShowCajaModal(false)

  const handleCajaFieldChange = (field, value) =>
    setCajaForm((prev) => ({ ...prev, [field]: value }))

  const submitCaja = async () => {
    if (!cajaForm.codigo.trim() || !cajaForm.descripcion.trim()) {
      toast.error('El código y la descripción son obligatorios.')
      return false
    }
    setBusyAction('caja')
    try {
      if (editingCajaId) {
        await actualizarCaja(editingCajaId, {
          codigo: cajaForm.codigo,
          descripcion: cajaForm.descripcion,
          establecimiento: cajaForm.establecimiento,
          puntoEmision: cajaForm.puntoEmision,
          secuencialActual: Number(cajaForm.secuencialActual),
        })
        toast.success(`Caja "${cajaForm.codigo}" actualizada correctamente.`)
      } else {
        await crearCaja({
          codigo: cajaForm.codigo,
          descripcion: cajaForm.descripcion,
          establecimiento: cajaForm.establecimiento,
          puntoEmision: cajaForm.puntoEmision,
          secuencialActual: Number(cajaForm.secuencialActual) || 0,
        })
        toast.success(`Caja "${cajaForm.codigo}" creada correctamente.`)
      }
      await reloadCajas()
      closeCajaModal()
      return true
    } catch (error) {
      toast.error(error.message || 'No fue posible guardar la caja.')
      return false
    } finally {
      setBusyAction(null)
    }
  }

  const handleInactivarCaja = (id, codigo) => {
    setConfirmDialog({
      isOpen: true,
      title: '¿Inactivar caja?',
      message: `La caja "${codigo}" se inactivará. No podrá ser usada mientras esté inactiva.`,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
        setBusyAction(`inactivar-caja-${id}`)
        try {
          await inactivarCaja(id)
          await reloadCajas()
          toast.success('Caja inactivada correctamente.')
        } catch (error) {
          toast.error(error.message || 'No fue posible inactivar la caja.')
        } finally {
          setBusyAction(null)
        }
      },
    })
  }

  // ── Sesiones de caja ──────────────────────────────────────────────────────────
  const openSesionModal = () => {
    setSesionForm({ cajaId: '', montoApertura: '' })
    setShowSesionModal(true)
  }

  const closeSesionModal = () => setShowSesionModal(false)

  const handleAbrirSesion = async () => {
    if (!sesionForm.cajaId || sesionForm.montoApertura === '') {
      toast.error('Selecciona una caja e ingresa el monto de apertura.')
      return false
    }
    setBusyAction('abrir-sesion')
    try {
      const sesion = await abrirSesionCaja({
        cajaId: sesionForm.cajaId,
        montoApertura: Number(sesionForm.montoApertura),
      })
      setSesionActiva(sesion)
      toast.success(`Turno abierto en caja "${sesion.caja.codigo}".`)
      closeSesionModal()
      return true
    } catch (error) {
      toast.error(error.message || 'No fue posible abrir el turno.')
      return false
    } finally {
      setBusyAction(null)
    }
  }

  const openRevisarModal = () => {
    if (!sesionActiva) { toast.error('No tienes un turno abierto.'); return }
    setRevisarForm({ sesionCajaId: sesionActiva.id, montoCierreReal: '' })
    setShowRevisarModal(true)
  }

  const closeRevisarModal = () => setShowRevisarModal(false)

  const handleRevisarSesion = async () => {
    if (!revisarForm.montoCierreReal) {
      toast.error('Ingresa el monto de cierre real.')
      return false
    }
    setBusyAction('revisar-sesion')
    try {
      const sesion = await revisarSesionCaja({
        sesionCajaId: revisarForm.sesionCajaId,
        montoCierreReal: Number(revisarForm.montoCierreReal),
      })
      const sesionActualizada = {
        ...(sesionActiva || {}),
        ...sesion,
        id: sesion?.id || revisarForm.sesionCajaId,
        estado: sesion?.estado || 'EN_REVISION',
        caja: sesionActiva?.caja || sesion?.caja || null,
      }
      setSesionActiva(sesionActualizada)
      await reloadSesionActiva(storedUser?.id, sesionActualizada)
      await reloadSesionesRevision()
      toast.success('Turno enviado a revisión correctamente.')
      closeRevisarModal()
      return true
    } catch (error) {
      toast.error(error.message || 'No fue posible enviar a revisión.')
      return false
    } finally {
      setBusyAction(null)
    }
  }

  const openCerrarModal = async (sesionSeleccionada = null) => {
    const sesion = (sesionSeleccionada && typeof sesionSeleccionada === 'object' && 'id' in sesionSeleccionada)
      ? sesionSeleccionada
      : sesionActiva

    if (!sesion || sesion.estado !== 'EN_REVISION') {
      toast.error('Solo puedes cerrar un turno que ya haya pasado a revisión.')
      return
    }

    setSesionActiva(sesion)

    try {
      const preferencias = await getPreferencias()
      const cuentaDefault = preferencias?.cuentaBancariaDefaultId || ''
      const montoDefault = String(Number(sesion.totalVentasEfectivo || 0).toFixed(2))
      setCierreForm({
        sesionCajaId: sesion.id,
        totalVentasEfectivo: Number(sesion.totalVentasEfectivo || 0),
        distribucionCuentas: cuentaDefault
          ? [{ cuentaId: cuentaDefault, monto: montoDefault }]
          : [{ cuentaId: '', monto: montoDefault }],
      })
    } catch {
      setCierreForm({
        sesionCajaId: sesion.id,
        totalVentasEfectivo: Number(sesion.totalVentasEfectivo || 0),
        distribucionCuentas: [{ cuentaId: '', monto: String(Number(sesion.totalVentasEfectivo || 0).toFixed(2)) }],
      })
    } finally {
      setShowCerrarModal(true)
    }
  }

  const closeCerrarModal = () => setShowCerrarModal(false)

  const updateDistribucionCuenta = (index, field, value) => {
    setCierreForm((prev) => ({
      ...prev,
      distribucionCuentas: prev.distribucionCuentas.map((row, rowIndex) => (
        rowIndex === index ? { ...row, [field]: value } : row
      )),
    }))
  }

  const addDistribucionCuenta = () => {
    setCierreForm((prev) => ({
      ...prev,
      distribucionCuentas: [...prev.distribucionCuentas, { cuentaId: '', monto: '' }],
    }))
  }

  const removeDistribucionCuenta = (index) => {
    setCierreForm((prev) => ({
      ...prev,
      distribucionCuentas: prev.distribucionCuentas.filter((_, rowIndex) => rowIndex !== index),
    }))
  }

  const handleCerrarSesion = async () => {
    const distribucion = (cierreForm.distribucionCuentas || [])
      .filter((row) => row?.cuentaId && row?.monto !== '')
      .map((row) => ({ cuentaId: row.cuentaId, monto: Number(row.monto) }))

    if (!cierreForm.sesionCajaId) {
      toast.error('No se encontró la sesión de caja a cerrar.')
      return false
    }
    if (distribucion.length === 0) {
      toast.error('Agrega al menos una cuenta y un monto para depositar.')
      return false
    }

    const totalDepositar = distribucion.reduce((sum, item) => sum + Number(item.monto || 0), 0)
    const totalEsperado = Number(cierreForm.totalVentasEfectivo ?? sesionActiva?.totalVentasEfectivo ?? 0)

    if (Math.abs(totalDepositar - totalEsperado) > 0.0001) {
      toast.error(`El total a depositar debe ser exactamente ${formatMoney(totalEsperado)}.`)
      return false
    }

    setBusyAction('cerrar-sesion')
    try {
      const sesion = await cerrarSesionCaja({
        sesionCajaId: cierreForm.sesionCajaId,
        distribucionCuentas: distribucion,
      })
      setSesionActiva((prev) => (prev ? { ...prev, ...sesion, estado: 'CERRADA' } : sesion))
      setSesionesRevision((prev) => prev.filter((item) => item.id !== cierreForm.sesionCajaId))
      await reloadSesionActiva(storedUser?.id)
      await reloadSesionesRevision()
      await reloadCajas()
      toast.success('Turno cerrado correctamente y depósitos registrados.')
      closeCerrarModal()
      return true
    } catch (error) {
      toast.error(error.message || 'No fue posible cerrar el turno.')
      return false
    } finally {
      setBusyAction(null)
    }
  }

  return {
    currentSection,
    clientes,
    facturas,
    productos,
    auditoria,
    kpis,
    availableClients,
    availableProducts,
    clientesPageInfo,
    facturasPageInfo,
    filteredClients,
    filteredInvoices,
    clienteForm,
    facturaForm,
    detalleForm,
    detalleItems,
    facturaTotals,
    filterEstado,
    searchQuery,
    sidebarOpen,
    userMenuOpen,
    themeMode,
    isModalOpen,
    modalMode,
    isLoading,
    isSubmitting: busyAction !== null,
    showClienteModal: isModalOpen && modalMode === 'cliente',
    showFacturaModal: isModalOpen && modalMode === 'factura',
    facturaEstados: FACTURA_ESTADOS,
    tipoClienteOptions: TIPO_CLIENTE_OPTIONS,
    tipoPagoOptions: TIPO_PAGO_OPTIONS,
    setSidebarOpen,
    setUserMenuOpen,
    setSearchQuery: updateSearchQuery,
    setFilterEstado: updateFilterEstado,
    toggleTheme,
    openClienteModal,
    openEditClienteModal,
    openFacturaModal,
    closeModal,
    handleClienteFieldChange,
    handleInvoiceFieldChange,
    handleDetalleFieldChange,
    addDetalleItem,
    removeDetalleItem,
    handleSubmit,
    handleDeleteCliente,
    handleDeleteFactura,
    handlePrintFactura,
    handleDownloadClientesPdf,
    handleDownloadFacturasPdf,
    handleLogout,
    confirmDialog,
    closeConfirmDialog: () => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
    ,
    setClientesPage,
    setFacturasPage,
    clientesLimit,
    setClientesLimit: updateClientesLimit,
    facturasLimit,
    setFacturasLimit: updateFacturasLimit,
    pageSize: DEFAULT_PAGE_SIZE,
    editingClienteId,

    // Cajas
    cajas,
    cajasLoading,
    cajaForm,
    editingCajaId,
    showCajaModal,
    showSesionModal,
    showRevisarModal,
    showCerrarModal,
    sesionActiva,
    sesionesRevision,
    sesionForm,
    revisarForm,
    cierreForm,
    reloadCajas,
    reloadSesionActiva,
    reloadSesionesRevision,
    openCajaModal,
    openEditCajaModal,
    closeCajaModal,
    handleCajaFieldChange,
    submitCaja,
    handleInactivarCaja,
    openSesionModal,
    closeSesionModal,
    setSesionForm,
    handleAbrirSesion,
    openRevisarModal,
    closeRevisarModal,
    setRevisarForm,
    handleRevisarSesion,
    openCerrarModal,
    closeCerrarModal,
    setCierreForm,
    updateDistribucionCuenta,
    addDistribucionCuenta,
    removeDistribucionCuenta,
    handleCerrarSesion,
    isAdmin,
    isCajero,
    sesionCargada,
    userRoles,
    storedUser,
  }
}
