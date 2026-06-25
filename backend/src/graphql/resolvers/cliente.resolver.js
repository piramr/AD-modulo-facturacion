const clienteService = require('../../services/cliente.service');

// Función espejo para mantener el control de seguridad por token
function requiereAuth(context) {
  if (!context.usuario) {
    const e = new Error('No autorizado: se requiere JWT válido');
    e.extensions = { code: 'UNAUTHENTICATED' };
    throw e;
  }
}

const resolvers = {
  Query: {
    clientes: async (_, args, ctx) => {
      requiereAuth(ctx);

      const MAX_LIMIT = 1_000;
      const { filter = {} } = args;

      const totalRegistros = await clienteService.contarClientesConFiltro(filter);

      const limiteSolicitado = args.limit || totalRegistros;
      if (limiteSolicitado > MAX_LIMIT && totalRegistros > MAX_LIMIT) {
        const error = new Error(`El volumen de datos solicitado (${totalRegistros} clientes encontrados) es demasiado grande. Use paginación con un 'limit' menor o igual a ${MAX_LIMIT}.`);
        error.code = 'REQUEST_ENTITY_TOO_LARGE';
        error.status = 413;
        throw error;
      }

      const limitePorPagina = args.limit ? Math.max(1, parseInt(args.limit, 10)) : 10;

      const totalPaginas = Math.ceil(totalRegistros / limitePorPagina) || 1;

      let paginaActual = args.page ? parseInt(args.page, 10) : 1;
      if (paginaActual > totalPaginas) {
        paginaActual = totalPaginas; // Última página real disponible
      }
      if (paginaActual < 1) {
        paginaActual = 1;
      }

      // Calcular el offset real
      const offset = (paginaActual - 1) * limitePorPagina;

      const resultado = await clienteService.listarClientes({
        ...filter,
        limit: limitePorPagina,
        offset: offset,
        orderBy: args.orderBy
      });

      return {
        totalCount: totalRegistros,
        pageInfo: {
          hasNextPage: paginaActual < totalPaginas,
          hasPreviousPage: paginaActual > 1,
          currentPage: paginaActual,
          totalPages: totalPaginas
        },
        items: resultado?.rows || []
      };
    },
    cliente: async (_, {id}, ctx) => {
      requiereAuth(ctx);
      const resultado = await clienteService.obtenerClientePorId(id);
      return resultado;
    }
  },

  Mutation: {
    // HU1 - CA4: Registrar un nuevo cliente
    crearCliente: async (_, { input }, ctx) => {
      requiereAuth(ctx);
      
      // Se pasa ctx.usuario por si tu servicio registra pistas de auditoría
      const nuevoCliente = await clienteService.crearCliente(input, ctx.usuario);
      return nuevoCliente;
    },

    // Actualizar datos del cliente
    actualizarCliente: async (_, { id, input }, ctx) => {
      requiereAuth(ctx);

      const clienteActualizado = await clienteService.actualizarCliente(id, input, ctx.usuario);
      return clienteActualizado;
    },

    // HU1 - CA3: Inactivar cliente (en lugar de borrado físico)
    inactivarCliente: async (_, { id }, ctx) => {
      requiereAuth(ctx);
      // Tu servicio debería hacer un update de { estado: 'Inactivo' }
      const clienteInactivado = await clienteService.actualizarEstadoCliente(id, 'Inactivo', ctx.usuario);
      return clienteInactivado;
    }
  }
};

module.exports = resolvers;