import { normalizeDocument, sanitizeText } from '../utils/validators'
import { API_BASE, API_GRAPHQL } from '../config/api'

const TOKEN_STORAGE_KEY = 'facturacion-demo-token'

export async function getAuthToken() {
  const savedToken = window.localStorage.getItem(TOKEN_STORAGE_KEY)
  if (savedToken) return savedToken

  const response = await fetch(`${API_BASE}/auth/test-token`)
  if (!response.ok) throw new Error('No fue posible obtener el token de prueba.')

  const data = await response.json()
  window.localStorage.setItem(TOKEN_STORAGE_KEY, data.token)
  return data.token
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
          totalIva
          total
          estado
          detalles {
            id
            productoCodigo
            productoNombre
            cantidad
            precioUnitario
            grabaIva
            subtotalLinea
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
      auditoriaReciente(limit: 5) {
        id
        usuarioId
        fechaHora
        accion
        detalles
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
      total_iva: factura.totalIva,
      total: factura.total,
      estado: factura.estado,
      detalles: factura.detalles,
    })),
    detalle_facturas: facturas.flatMap((factura) => (factura.detalles || []).map((detalle) => ({
      id: detalle.id,
      factura_id: factura.id,
      producto_id: detalle.productoCodigo,
      producto_nombre: detalle.productoNombre,
      cantidad: detalle.cantidad,
      precio_unitario: detalle.precioUnitario,
      graba_iva: detalle.grabaIva,
      subtotal_linea: detalle.subtotalLinea,
    }))),
    productos: data.productos || [],
    auditoria: data.auditoriaReciente || [],
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
      estado: sanitizeText(input.estado || 'Activo'),
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
      estado: sanitizeText(input.estado || 'Activo'),
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
      tipoPago: sanitizeText(input.tipo_pago || input.tipoPago),
      detalles: (input.detalles || []).map((detalle) => ({
        productoCodigo: sanitizeText(detalle.producto_id || detalle.productoCodigo),
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

export async function deleteFactura(facturaId, token = '') {
  const mutation = `
    mutation AnularFactura($id: ID!, $estado: String!) {
      actualizarEstadoFactura(id: $id, estado: $estado) {
        id
        estado
      }
    }
  `

  await fetchGraphQL(mutation, { id: facturaId, estado: 'Anulada' }, token)
  return getFacturacionSnapshot(token)
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
