const facturaService = require('../../services/factura.service');
const inventarioService = require('../../services/inventario.service');
const PistaAuditoria = require('../../models/pistaAuditoria.model');

function requiereAuth(context) {
  if (!context.usuario) {
    const e = new Error('No autorizado: se requiere JWT válido');
    e.extensions = { code: 'UNAUTHENTICATED' };
    throw e;
  }
}

function mapearFactura(f) {
  const data = f.toJSON ? f.toJSON() : f;
  return {
    id: data.id,
    numeroFactura: data.numero_factura,
    clienteId: data.cliente_id,
    cliente: data.cliente
      ? {
          id: data.cliente.id,
          nombre: data.cliente.nombre,
          cedula: data.cliente.cedula,
          tipoCliente: data.cliente.tipo_cliente
        }
      : null,
    tipoPago: data.tipo_pago,
    fechaEmision: data.fecha_emision,
    subtotal: Number(data.subtotal),
    totalIva: Number(data.total_iva),
    total: Number(data.total),
    estado: data.estado,
    detalles: (data.detalles || []).map((d) => ({
      id: d.id,
      productoCodigo: d.producto_id,   // "PRD-0003"
      productoNombre: d.producto_nombre,
      cantidad: d.cantidad,
      precioUnitario: Number(d.precio_unitario),
      grabaIva: d.graba_iva,
      subtotalLinea: Number(d.subtotal_linea)
    }))
  };
}

const resolvers = {
  Query: {
    facturas: async (_, args, ctx) => {
      requiereAuth(ctx);
      
      const MAX_LIMIT = 1_000;
      const { facturasFilter = {} } = args;

      // 1. Conteo dinámico previo (Saber cuántos hay en tiempo real)
      const totalRegistros = await facturaService.contarFacturasConFiltro({
        estado: facturasFilter.estado,
        cliente_id: facturasFilter.clienteId,
        tipo_pago: facturasFilter.tipoPago,
        search: facturasFilter.search
      });

      // 2. Control dinámico de volumen (Tu regla 413)
      const limiteSolicitado = args.limit || totalRegistros;
      if (limiteSolicitado > MAX_LIMIT && totalRegistros > MAX_LIMIT) {
        const error = new Error(`El volumen de datos solicitado (${totalRegistros} facturas encontradas) es demasiado grande. Use paginación con un 'limit' menor o igual a ${MAX_LIMIT}.`);
        error.code = 'REQUEST_ENTITY_TOO_LARGE';
        error.status = 413;
        throw error;
      }

      const limitePorPagina = args.limit ? Math.max(1, parseInt(args.limit, 10)) : 10;

      // Calcular cuántas páginas reales existirían con este límite
      const totalPaginas = Math.ceil(totalRegistros / limitePorPagina) || 1;

      let paginaActual = args.page ? parseInt(args.page, 10) : 1;
      if (paginaActual > totalPaginas) {
        paginaActual = totalPaginas;
      }
      if (paginaActual < 1) {
        paginaActual = 1;
      }

      // 4. Calcular el offset real y seguro
      const offset = (paginaActual - 1) * limitePorPagina;

      // 5. Extraer los datos exactos sin riesgo de arrays vacíos indeseados
      const resultado = await facturaService.listarFacturas({
        estado: facturasFilter.estado,
        cliente_id: facturasFilter.clienteId,
        tipo_pago: facturasFilter.tipoPago,
        search: facturasFilter.search,
        limit: limitePorPagina,
        offset: offset
      });

      // 6. Retorno consistente. 'currentPage' reflejará la página real a la que fue enviado
      return {
        totalCount: totalRegistros,
        pageInfo: {
          hasNextPage: paginaActual < totalPaginas,
          hasPreviousPage: paginaActual > 1,
          currentPage: paginaActual, // Si fue recalculada, el frontend se entera aquí
          totalPages: totalPaginas
        },
        items: (resultado?.rows || []).map(mapearFactura)
      };
    },

    factura: async (_, { id }, ctx) => {
      requiereAuth(ctx);
      const f = await facturaService.obtenerFacturaPorId(id);
      return mapearFactura(f);
    },
  },

  Mutation: {
    crearFactura: async (_, { input }, ctx) => {
      requiereAuth(ctx);
      const datos = {
        cliente_id: input.clienteId,
        tipo_pago: input.tipoPago,
        detalles: input.detalles.map((d) => ({
          producto_codigo: d.productoCodigo,
          cantidad: d.cantidad
        }))
      };
      const f = await facturaService.crearFactura(datos, ctx.usuario, ctx.token);
      return mapearFactura(f);
    },

    actualizarEstadoFactura: async (_, { id, estado }, ctx) => {
      requiereAuth(ctx);
      const f = await facturaService.actualizarEstadoFactura(id, estado, ctx.usuario);
      return mapearFactura(f);
    }
  }
};

module.exports = resolvers;
