const PistaAuditoria = require('../../models/pistaAuditoria.model');

function requiereAuth(context) {
  if (!context.usuario) {
    const error = new Error('No autorizado: se requiere JWT valido');
    error.extensions = { code: 'UNAUTHENTICATED' };
    throw error;
  }
}

const jsonScalar = {
  __serialize(value) {
    return value;
  },
  __parseValue(value) {
    return value;
  },
  __parseLiteral(ast) {
    return ast.value;
  }
};

const resolvers = {
  JSON: jsonScalar,
  Query: {
    auditoriaReciente: async (_, { limit = 5 }, ctx) => {
      requiereAuth(ctx);

      const eventos = await PistaAuditoria.findAll({
        limit: Math.min(Math.max(Number(limit) || 5, 1), 20),
        order: [['fecha_hora', 'DESC']]
      });

      return eventos.map((evento) => {
        const data = evento.toJSON();
        return {
          id: data.id,
          usuarioId: data.usuario_id,
          fechaHora: data.fecha_hora,
          accion: data.accion,
          detalles: data.detalles
        };
      });
    }
  }
};

module.exports = resolvers;
