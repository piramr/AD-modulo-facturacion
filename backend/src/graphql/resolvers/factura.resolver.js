const facturaService = require('../../services/factura.service');
const { obtenerProductos } = require('../../services/external/inventario.service');

function mapearProductoInventario(producto) {
  const grabaIva = producto.grabaIva ?? producto.graba_iva ?? false;

  return {
    codigo: producto.codigo,
    nombre: producto.nombre,
    descripcion: producto.descripcion || null,
    pvp: Number(producto.pvp || 0),
    grabaIva: Boolean(grabaIva),
    estado: producto.estado || null,
    stockActual: Number(producto.stockActual ?? producto.stock_actual ?? 0),
    porcentajeIvaAplicado: producto.porcentajeIvaAplicado ?? producto.porcentaje_iva_aplicado ?? null
  };
}

const resolvers = {
  Query: {
    facturas: async (_, args) => {
      const MAX_LIMIT = 1_000;
      const filter = args.filter || {};

      // 1. Conteo dinámico previo (Saber cuántos hay en tiempo real)
      const totalRegistros = await facturaService.contarFacturasConFiltro(filter);

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
        ...filter,
        limit: limitePorPagina,
        offset: offset,
        orderBy: args.orderBy
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
        items: resultado?.rows || []
      };
    },

    factura: async (_, { id }) => {
      try {
        return await facturaService.obtenerFacturaPorId(id);
      } catch (err) {
        if (err.codigo === 404 || err.message.includes('no encontrada')) {
          err.code = 'NOT_FOUND';
          err.status = 404;
        }
        throw err;
      }
    },

    facturasPendientesPorCliente: async (_, { clienteId }) => {
      return await facturaService.obtenerFacturasPendientesPorCliente(clienteId);
    },

    productos: async () => {
      const productos = await obtenerProductos();
      return productos.map(mapearProductoInventario);
    },
  },

Mutation: {
    crearFactura: async (_, { input }) => {
      const factura = await facturaService.crearFactura(input);
      return factura;
    },

    imprimirFactura: async (_, { id }) => {
      return await facturaService.bloquearEImprimirFactura(id);
    },

    registrarAbonoCXC: async (_, { id, montoPagado }) => {
      return await facturaService.procesarAbono(id, montoPagado);
    },
  }
};

module.exports = resolvers;
