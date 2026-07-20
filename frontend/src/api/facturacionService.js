import { normalizeDocument, sanitizeText } from '../utils/validators'
import { API_BASE, API_GRAPHQL } from '../config/api'
import { getStoredToken } from './authService'

const TOKEN_STORAGE_KEY = 'facturacion-demo-token'

export async function getAuthToken() {
  const savedToken = getStoredToken() || window.localStorage.getItem(TOKEN_STORAGE_KEY)
  if (savedToken) return savedToken
  throw new Error('No hay una sesion activa. Inicia sesion nuevamente.')
}

async function fetchGraphQL(query, variables = {}, token = '') {
  const authToken = token || await getAuthToken()
  const response = await fetch(API_GRAPHQL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`,
    },
    body: JSON.stringify({ query, variables }),
  })

  const json = await response.json()

  if (json.errors) {
    throw new Error(json.errors[0].message || 'Error en la peticion GraphQL')
  }

  return json.data
}

async function downloadPdf(path, filename, token = '') {
  const authToken = token || await getAuthToken()
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      Authorization: authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`,
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'No fue posible descargar el PDF.')
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)

  return response.headers.get('X-Report-Message') || 'PDF generado correctamente.'
}

export async function getFacturacionSnapshot(token = '', options = {}) {
  const clientesPage = options.clientesPage || 1
  const clientesLimit = options.clientesLimit || 10
  const facturasPage = options.facturasPage || 1
  const facturasLimit = options.facturasLimit || 10
  const clientesFilter = options.clientesFilter || null
  const facturasFilter = options.facturasFilter || null
  const query = `
    query GetSnapshot($clientesPage: Int, $clientesLimit: Int, $clientesFilter: ClientesFilter, $facturasPage: Int, $facturasLimit: Int, $facturasFilter: FacturasFilter) {
      clientes(page: $clientesPage, limit: $clientesLimit, filter: $clientesFilter) {
        totalCount
        pageInfo {
          currentPage
          totalPages
          hasNextPage
          hasPreviousPage
        }
        items {
          id
          cedula
          nombre
          fechaNacimiento
          tipoCliente
          direccion
          telefono
          email
          estado
          createdAt
          updatedAt
        }
      }
      facturas(page: $facturasPage, limit: $facturasLimit, filter: $facturasFilter) {
        totalCount
        pageInfo {
          currentPage
          totalPages
          hasNextPage
          hasPreviousPage
        }
        items {
          id
          numeroFactura
          clienteId
          cliente {
            nombre
            cedula
          }
          tipoPago
          fechaEmision
          subtotal
          ivaTotal
          total
          estado
          detalles {
            id
            codigoProducto
            nombreProducto
            cantidad
            pvpUnitario
            grabaIva
            subtotal
          }
        }
      }
      productos {
        codigo
        nombre
        descripcion
        stockActual
        pvp
        grabaIva
        porcentajeIvaAplicado
      }
    }
  `
  const data = await fetchGraphQL(query, { clientesPage, clientesLimit, clientesFilter, facturasPage, facturasLimit, facturasFilter }, token)
  const facturas = data.facturas?.items || []

  return {
    clientesPageInfo: {
      totalCount: data.clientes?.totalCount || 0,
      ...(data.clientes?.pageInfo || {}),
    },
    facturasPageInfo: {
      totalCount: data.facturas?.totalCount || 0,
      ...(data.facturas?.pageInfo || {}),
    },
    clientes: (data.clientes?.items || []).map((cliente) => ({
      id: cliente.id,
      cedula: cliente.cedula,
      nombre: cliente.nombre,
      fecha_nacimiento: cliente.fechaNacimiento,
      tipo_cliente: cliente.tipoCliente,
      direccion: cliente.direccion,
      telefono: cliente.telefono,
      email: cliente.email,
      estado: cliente.estado,
      created_at: cliente.createdAt,
      updated_at: cliente.updatedAt,
    })),
    facturas: facturas.map((factura) => ({
      id: factura.id,
      numero_factura: factura.numeroFactura,
      cliente_id: factura.clienteId,
      clienteNombre: factura.cliente?.nombre || 'Sin cliente',
      clienteCedula: factura.cliente?.cedula || '',
      tipo_pago: factura.tipoPago,
      fecha_emision: factura.fechaEmision,
      subtotal: factura.subtotal,
      total_iva: factura.ivaTotal,
      total: factura.total,
      estado: factura.estado,
      detalles: factura.detalles,
    })),
    detalle_facturas: facturas.flatMap((factura) => (factura.detalles || []).map((detalle) => ({
      id: detalle.id,
      factura_id: factura.id,
      producto_id: detalle.codigoProducto,
      producto_nombre: detalle.nombreProducto,
      cantidad: detalle.cantidad,
      precio_unitario: detalle.pvpUnitario,
      graba_iva: detalle.grabaIva,
      subtotal_linea: detalle.subtotal,
    }))),
    productos: data.productos || [],
    auditoria: [],
  }
}

export async function createCliente(input, token = '') {
  const mutation = `
    mutation RegistrarCliente($input: CrearClienteInput!) {
      crearCliente(input: $input) {
        id
      }
    }
  `

  await fetchGraphQL(mutation, {
    input: {
      cedula: normalizeDocument(input.cedula),
      nombre: sanitizeText(input.nombre),
      fechaNacimiento: sanitizeText(input.fecha_nacimiento || input.fechaNacimiento),
      tipoCliente: sanitizeText(input.tipo_cliente || input.tipoCliente),
      direccion: sanitizeText(input.direccion),
      telefono: sanitizeText(input.telefono),
      email: sanitizeText(input.email),
      estado: sanitizeText(input.estado || 'ACTIVO'),
    },
  }, token)

  return getFacturacionSnapshot(token)
}

export async function updateCliente(clienteId, input, token = '') {
  const mutation = `
    mutation ActualizarCliente($id: ID!, $input: ActualizarClienteInput!) {
      actualizarCliente(id: $id, input: $input) {
        id
      }
    }
  `

  await fetchGraphQL(mutation, {
    id: clienteId,
    input: {
      cedula: normalizeDocument(input.cedula),
      nombre: sanitizeText(input.nombre),
      fechaNacimiento: sanitizeText(input.fecha_nacimiento || input.fechaNacimiento),
      tipoCliente: sanitizeText(input.tipo_cliente || input.tipoCliente),
      direccion: sanitizeText(input.direccion),
      telefono: sanitizeText(input.telefono),
      email: sanitizeText(input.email),
      estado: sanitizeText(input.estado || 'ACTIVO'),
    },
  }, token)

  return getFacturacionSnapshot(token)
}

export async function createFactura(input, token = '') {
  const mutation = `
    mutation RegistrarFactura($input: CrearFacturaInput!) {
      crearFactura(input: $input) {
        id
      }
    }
  `

  await fetchGraphQL(mutation, {
    input: {
      clienteId: input.cliente_id || input.clienteId,
      sesionCajaId: input.sesion_caja_id || input.sesionCajaId,
      tipoPago: sanitizeText(input.tipo_pago || input.tipoPago),
      detalles: (input.detalles || []).map((detalle) => ({
        codigoProducto: sanitizeText(detalle.producto_id || detalle.codigoProducto),
        cantidad: Number(detalle.cantidad),
      })),
    },
  }, token)

  return getFacturacionSnapshot(token)
}

export async function deleteCliente(clienteId, token = '') {
  const mutation = `
    mutation DeshabilitarCliente($id: ID!) {
      inactivarCliente(id: $id) {
        id
        estado
      }
    }
  `

  await fetchGraphQL(mutation, { id: clienteId }, token)
  return getFacturacionSnapshot(token)
}

export async function deleteFactura() {
  throw new Error('El backend aun no expone una operacion para anular facturas.')
}

export async function getReporteClientes(options = {}, token = '') {
  const page = options.page || 1
  const limit = options.limit || 10
  const query = `
    query ReporteClientes($page: Int, $limit: Int) {
      reporteClientes(page: $page, limit: $limit) {
        totalCount
        pageInfo {
          currentPage
          totalPages
          hasNextPage
          hasPreviousPage
        }
        generatedAt
        durationMs
        message
        items {
          id
          cedula
          nombre
          telefono
          email
          estado
          historialCompras {
            cantidadFacturas
            totalComprado
            ultimaCompra
          }
        }
      }
    }
  `

  return (await fetchGraphQL(query, { page, limit }, token)).reporteClientes
}

export async function getReporteFacturas(options = {}, token = '') {
  const page = options.page || 1
  const limit = options.limit || 10
  const query = `
    query ReporteFacturas($page: Int, $limit: Int) {
      reporteFacturas(page: $page, limit: $limit) {
        totalCount
        pageInfo {
          currentPage
          totalPages
          hasNextPage
          hasPreviousPage
        }
        generatedAt
        durationMs
        message
        items {
          id
          numeroFactura
          clienteNombre
          fechaEmision
          total
          estado
          articulos {
            productoCodigo
            productoNombre
            cantidad
            precioUnitario
            subtotalLinea
          }
        }
      }
    }
  `

  return (await fetchGraphQL(query, { page, limit }, token)).reporteFacturas
}

export const downloadFacturaPdf = (facturaId, numeroFactura, token = '') =>
  downloadPdf(`/api/reportes/facturas/${facturaId}/pdf`, `factura-${numeroFactura || facturaId}.pdf`, token)

export const downloadReporteClientesPdf = (token = '') =>
  downloadPdf('/api/reportes/clientes?format=pdf', 'reporte-clientes.pdf', token)

export const downloadReporteFacturasPdf = (token = '') =>
  downloadPdf('/api/reportes/facturas?format=pdf', 'reporte-facturas.pdf', token)

export async function getSaldosCuentas(token = '') {
  const query = `
    query ObtenerSaldosCuentas {
      obtenerSaldosCuentas {
        cuentaId
        nombre
        codigo
        entidadBancaria
        titular
        tipoCuenta
        nroCuenta
        ruc
        saldoActual
        saldoDisponible
        ultimaActualizacion
        movimientos {
          id
          cuentaId
          tipo
          monto
          descripcion
          referencia
          fechaMovimiento
        }
      }
    }
  `
  return (await fetchGraphQL(query, {}, token)).obtenerSaldosCuentas
}

// ── CAJAS - MATEO ─────────────────────────────────────────────────────────────────────

export async function getCajas(token = '') {
  const query = `
    query {
      obtenerCajas {
        id
        codigo
        descripcion
        estado
        establecimiento
        puntoEmision
        secuencialActual
      }
    }
  `
  return (await fetchGraphQL(query, {}, token)).obtenerCajas
}

export async function getSesionActiva(usuarioId, token = '') {
  const query = `
    query ObtenerSesionActiva($usuarioId: String!) {
      obtenerSesionActiva(usuarioId: $usuarioId) {
        id
        cajaId
        caja { id codigo descripcion establecimiento puntoEmision }
        usuarioId
        fechaApertura
        montoApertura
        cantidadFacturas
        totalVentasEfectivo
        totalVentasCredito
        fechaCierre
        montoCierreEsperado
        montoCierreReal
        faltante
        sobrante
        estado
      }
    }
  `
  return (await fetchGraphQL(query, { usuarioId }, token)).obtenerSesionActiva
}

export async function getSesionesRevision(token = '') {
  const query = `
    query ObtenerSesionesRevision {
      obtenerSesionesRevision {
        id
        cajaId
        caja { id codigo descripcion establecimiento puntoEmision }
        usuarioId
        fechaApertura
        montoApertura
        cantidadFacturas
        totalVentasEfectivo
        totalVentasCredito
        fechaCierre
        montoCierreEsperado
        montoCierreReal
        faltante
        sobrante
        estado
      }
    }
  `
  return (await fetchGraphQL(query, {}, token)).obtenerSesionesRevision
}

export async function crearCaja(input, token = '') {
  const mutation = `
    mutation CrearCaja($input: CrearCajaInput!) {
      crearCaja(input: $input) { id codigo descripcion estado establecimiento puntoEmision secuencialActual }
    }
  `
  return (await fetchGraphQL(mutation, { input }, token)).crearCaja
}

export async function actualizarCaja(id, input, token = '') {
  const mutation = `
    mutation ActualizarCaja($id: ID!, $input: ActualizarCajaInput!) {
      actualizarCaja(id: $id, input: $input) { id codigo descripcion estado establecimiento puntoEmision secuencialActual }
    }
  `
  return (await fetchGraphQL(mutation, { id, input }, token)).actualizarCaja
}

export async function inactivarCaja(id, token = '') {
  const mutation = `
    mutation InactivarCaja($id: ID!) {
      inactivarCaja(id: $id) { id estado }
    }
  `
  return (await fetchGraphQL(mutation, { id }, token)).inactivarCaja
}

export async function abrirSesionCaja(input, token = '') {
  const mutation = `
    mutation AbrirSesion($input: AbrirSesionCajaInput!) {
      abrirSesionCaja(input: $input) {
        id
        cajaId
        caja { id codigo descripcion establecimiento puntoEmision }
        usuarioId
        fechaApertura
        montoApertura
        cantidadFacturas
        totalVentasEfectivo
        totalVentasCredito
        fechaCierre
        montoCierreEsperado
        montoCierreReal
        faltante
        sobrante
        estado
      }
    }
  `
  return (await fetchGraphQL(mutation, { input }, token)).abrirSesionCaja
}

export async function revisarSesionCaja(input, token = '') {
  const mutation = `
    mutation RevisarSesion($input: RevisarSesionCajaInput!) {
      revisarSesionCaja(input: $input) {
        id estado montoCierreReal montoCierreEsperado faltante sobrante
        cantidadFacturas totalVentasEfectivo totalVentasCredito
      }
    }
  `
  return (await fetchGraphQL(mutation, { input }, token)).revisarSesionCaja
}

export async function cerrarSesionCaja(input, token = '') {
  const mutation = `
    mutation CerrarSesion($input: CerrarSesionCajaInput!) {
      cerrarSesionCaja(input: $input) {
        id estado fechaCierre
      }
    }
  `
  return (await fetchGraphQL(mutation, { input }, token)).cerrarSesionCaja
}

export async function getPreferencias(token = '') {
  const query = `
    query ObtenerPreferencias {
      obtenerPreferencias {
        id
        nombreEmpresa
        rucEmpresa
        porcentajeIva
        cuentaBancariaDefaultId
      }
    }
  `
  return (await fetchGraphQL(query, {}, token)).obtenerPreferencias
}

export async function updatePreferencias(input, token = '') {
  const mutation = `
    mutation ActualizarPreferencias($input: ActualizarPreferenciasInput!) {
      actualizarPreferencias(input: $input) {
        id
        nombreEmpresa
        rucEmpresa
        porcentajeIva
        cuentaBancariaDefaultId
      }
    }
  `
  return (await fetchGraphQL(mutation, { input }, token)).actualizarPreferencias
}

export async function getMovimientosCuenta(limit = 10, token = '') {
  const query = `
    query MovimientosCuenta($limit: Int) {
      movimientosCuenta(limit: $limit) {
        id
        cuentaId
        cuentaNombre
        entidadBancaria
        titular
        tipoCuenta
        nroCuenta
        tipo
        monto
        descripcion
        referencia
        fechaMovimiento
      }
    }
  `
  return (await fetchGraphQL(query, { limit }, token)).movimientosCuenta
}

export async function getSaldoCuenta(cuentaId, token = '') {
  const query = `
    query SaldoCuenta($cuentaId: ID!) {
      saldoCuenta(cuentaId: $cuentaId) {
        cuentaId
        nombre
        codigo
        entidadBancaria
        titular
        tipoCuenta
        nroCuenta
        ruc
        saldoActual
        saldoDisponible
        ultimaActualizacion
        movimientos {
          id
          cuentaId
          tipo
          monto
          descripcion
          referencia
          fechaMovimiento
        }
      }
    }
  `
  return (await fetchGraphQL(query, { cuentaId }, token)).saldoCuenta
}

export async function createSaldoCuenta(input, token = '') {
  const mutation = `
    mutation CrearSaldoCuenta($input: CrearSaldoCuentaInput!) {
      crearSaldoCuenta(input: $input) {
        cuentaId
        saldoActual
        ultimaActualizacion
      }
    }
  `
  return (await fetchGraphQL(mutation, { input }, token)).crearSaldoCuenta
}
