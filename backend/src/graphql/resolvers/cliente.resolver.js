const clienteService = require('../../services/cliente.service');
const { getCurrentContext } = require('../../store/contextStore');

const resolvers = {
  Query: {
    clientes: async (_, args) => {
      const MAX_LIMIT = 1_000;
      const filter = args.filter || {};

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
    cliente: async (_, {id}) => {
      const resultado = await clienteService.obtenerClientePorId(id);
      return resultado;
    }
  },

  Mutation: {
    crearCliente: async (_, { input }) => {
      const nuevoCliente = await clienteService.crearCliente(input);
      return nuevoCliente;
    },

    actualizarCliente: async (_, { id, input }) => {
      const clienteActualizado = await clienteService.actualizarCliente(id, input);
      return clienteActualizado;
    },

    inactivarCliente: async (_, { id }) => {
      const clienteInactivado = await clienteService.actualizarEstadoCliente(id, 'INACTIVO');
      return clienteInactivado;
    }
  }
};

module.exports = resolvers;
