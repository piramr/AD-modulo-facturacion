const clienteService = require('../../services/cliente.service');

// Función espejo para mantener el control de seguridad por token
function requiereAuth(context) {
  if (!context.usuario) {
    const e = new Error('No autorizado: se requiere JWT válido');
    e.extensions = { code: 'UNAUTHENTICATED' };
    throw e;
  }
}

// Mapeador para transformar la estructura de la BD (snake_case) al formato GraphQL (camelCase)
function mapearCliente(c) {
  if (!c) return null;
  
  const data = c.toJSON ? c.toJSON() : c;
  
  return {
    id: data.id,
    cedula: data.cedula,
    nombre: data.nombre,
    fechaNacimiento: data.fecha_nacimiento,
    tipoCliente: data.tipo_cliente,
    direccion: data.direccion,
    telefono: data.telefono,
    email: data.email,
    estado: data.estado,
    createdAt: data.created_at || data.createdAt,
    updatedAt: data.updated_at || data.updatedAt
  };
}

const resolvers = {
  Query: {
    clientes: async (_, args, ctx) => {
      requiereAuth(ctx);
      
      const MAX_LIMIT = 1_000;
      const { filter = {} } = args;

      const totalRegistros = await clienteService.contarClientesConFiltro({
        estado: filter.estado,
        cedula: filter.cedula,
        nombre: filter.nombre,
        tipo_cliente: filter.tipoCliente,
        search: filter.search // búsqueda dinámica
      });

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
        estado: filter.estado,
        cedula: filter.cedula,
        nombre: filter.nombre,
        tipo_cliente: filter.tipoCliente,
        search: filter.search,
        limit: limitePorPagina,
        offset: offset
      });

      return {
        totalCount: totalRegistros,
        pageInfo: {
          hasNextPage: paginaActual < totalPaginas,
          hasPreviousPage: paginaActual > 1,
          currentPage: paginaActual,
          totalPages: totalPaginas
        },
        items: (resultado?.rows || []).map(mapearCliente)
      };
    }
  },

  Mutation: {
    // HU1 - CA4: Registrar un nuevo cliente
    crearCliente: async (_, { input }, ctx) => {
      requiereAuth(ctx);
      const datos = {
        cedula: input.cedula,
        nombre: input.nombre,
        fecha_nacimiento: input.fechaNacimiento,
        tipo_cliente: input.tipoCliente,
        direccion: input.direccion,
        telefono: input.telefono,
        email: input.email,
        estado: input.estado || 'Activo'
      };
      
      // Se pasa ctx.usuario por si tu servicio registra pistas de auditoría
      const nuevoCliente = await clienteService.crearCliente(datos, ctx.usuario);
      return mapearCliente(nuevoCliente);
    },

    // Actualizar datos del cliente
    actualizarCliente: async (_, { id, input }, ctx) => {
      requiereAuth(ctx);
      const datos = {
        cedula: input.cedula,
        nombre: input.nombre,
        fecha_nacimiento: input.fechaNacimiento,
        tipo_cliente: input.tipoCliente,
        direccion: input.direccion,
        telefono: input.telefono,
        email: input.email,
        estado: input.estado
      };

      const clienteActualizado = await clienteService.actualizarCliente(id, datos, ctx.usuario);
      return mapearCliente(clienteActualizado);
    },

    // HU1 - CA3: Inactivar cliente (en lugar de borrado físico)
    inactivarCliente: async (_, { id }, ctx) => {
      requiereAuth(ctx);
      // Tu servicio debería hacer un update de { estado: 'Inactivo' }
      const clienteInactivado = await clienteService.actualizarEstadoCliente(id, 'Inactivo', ctx.usuario);
      return mapearCliente(clienteInactivado);
    }
  }
};

module.exports = resolvers;