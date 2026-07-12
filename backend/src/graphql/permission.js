const { shield, rule, allow } = require('graphql-shield');

const isAuthenticated = rule({ cache: 'contextual' })(
  async (parent, args, context, info) => {
    return context.token !== null && context.token !== undefined && context.token !== '';
  }
);

// DEFINIR TODOS LOS PERMISOS DE GRAPHQL AQUÍ
// Use alllow para permitir el acceso sin autenticación
const permissions = shield({
  Query: {
    '*': isAuthenticated,
  },
  Mutation: {
    '*': isAuthenticated,
  }

}, {
  fallbackError: () => {
    const error = new Error('No autorizado: Proporcione un token válido.');
    error.code = 'UNAUTHORIZED';
    error.status = 401;
    return error;
  },
  debug: true
});

module.exports = permissions;