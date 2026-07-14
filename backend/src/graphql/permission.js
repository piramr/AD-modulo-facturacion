const { shield, rule, chain, or, deny } = require('graphql-shield');
const { validarTokenConSeguridad } = require('../services/external/seguridad.service');
const { contextStorage } = require('../store/contextStore');

// Roles autorizados a operar en tu módulo
const ROLES_PERMITIDOS_FACTURACION = [
  'FAC_FACTURADOR',
  'FAC_ADMIN',
  'CXC_ADMIN',
];

const isAuthenticated = rule({ cache: 'contextual' })(
  async (parent, args, context) => {
    if (!context.token) { 
      const error = new Error('No autorizado: No se proporcionó un token de autenticación.');
      error.code = 'UNAUTHORIZED';
      error.status = 401;
      throw error;
    }
    
    try {
      const usuarioValido = await validarTokenConSeguridad(context.token);

      if (!usuarioValido) {
        const error = new Error('El token proporcionado ha expirado o es inválido.');
        error.code = 'TOKEN_EXPIRED';
        error.status = 401;
        throw error;
      }

      // 1. Guardamos en el contexto local de GraphQL
      context.user = usuarioValido;

      // Lo inyectamos en el AsyncLocalStorage para que esté disponible en servicios/helpers
      const store = contextStorage.getStore();
      if (store) {
        store.user = usuarioValido; 
      }

      return true;
    } catch (err) {
      if (err.code) throw err;
    }
  }
);


const isInAllowedRoles = () => 
  rule({ cache: 'contextual' })(
    async (parent, args, context) => {
      if (!context.user) return false;

      const tieneRolValido = Array.isArray(context.user.roles) && 
        context.user.roles.some(rol => ROLES_PERMITIDOS_FACTURACION.includes(rol));
      return tieneRolValido;
    }
  );


const hasPermission = (requiredPermission) => 
  rule({ cache: 'contextual' })(
    async (parent, args, context) => {
      if (!context.user) return false;

      const tienePermisoValido = Array.isArray(context.user.permissions) && 
        context.user.permissions.includes(requiredPermission);

      return tieneRolValido && tienePermisoValido;
    }
  );


const permissions = shield({
  Query: {
    '*': chain(isAuthenticated, isInAllowedRoles()),
  },
  Mutation: {
    '*': deny,
    crearCaja: chain(isAuthenticated, isInAllowedRoles(), hasPermission('FAC_CAJA')),
    inactivarCaja: chain(isAuthenticated, isInAllowedRoles(), hasPermission('FAC_CAJA')),
    abrirSesionCaja: chain(isAuthenticated, isInAllowedRoles(), hasPermission('FAC_CAJA')),
    cerrarSesionCaja: chain(isAuthenticated, isInAllowedRoles(), hasPermission('FAC_CAJA')),
    
    crearFactura: chain(isAuthenticated, isInAllowedRoles(), hasPermission('FAC_FACTURAS')),
    imprimirFactura: chain(isAuthenticated, isInAllowedRoles(), hasPermission('FAC_FACTURAS')),
    registrarAbonoCXC: chain(isAuthenticated, isInAllowedRoles(), hasPermission('FAC_FACTURAS')),
    
    crearCliente: chain(isAuthenticated, isInAllowedRoles(), hasPermission('FAC_CLIENTES')),
    actualizarCliente: chain(isAuthenticated, isInAllowedRoles(), hasPermission('FAC_CLIENTES')),
    inactivarCliente: chain(isAuthenticated, isInAllowedRoles(), hasPermission('FAC_CLIENTES')),

    crearMovimiento: chain(isAuthenticated, isInAllowedRoles(), hasPermission('FAC_MOVIMIENTOS')),

    actualizarPreferencias: chain(isAuthenticated, isInAllowedRoles(), hasPermission('FAC_PREFERENCIAS')),
  }
}, {
  fallbackError: (err) => {
    if (err instanceof Error && (err.code === 'TOKEN_EXPIRED' || err.code === 'UNAUTHORIZED')) {
      return err;
    }
    const error = new Error('No autorizado: No tienes los privilegios necesarios para esta acción.');
    error.code = 'UNAUTHORIZED';
    error.status = 401;
    return error;
  },
  debug: true
});

module.exports = permissions;