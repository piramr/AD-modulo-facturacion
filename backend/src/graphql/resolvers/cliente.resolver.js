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
      
      const resultado = await clienteService.listarClientes({
        estado: args.estado,
        cedula: args.cedula,
        nombre: args.nombre,
        tipo_cliente: args.tipoCliente
      });

      const lista = Array.isArray(resultado) ? resultado : (resultado?.rows || []);

      return lista
        .map(mapearCliente)
        .filter(cliente => cliente !== null);
    },

    // Buscar un único cliente por ID
    cliente: async (_, { id }, ctx) => {
      requiereAuth(ctx);
      const c = await clienteService.obtenerClientePorId(id);
      return mapearCliente(c);
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