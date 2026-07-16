// permission.js
const { shield, rule, chain, or, deny } = require('graphql-shield');
const { validarTokenConSeguridad } = require('../services/external/seguridad.service');
const { contextStorage } = require('../store/contextStore');

const ROLES_PERMITIDOS_FACTURACION = [
  'FAC_CAJERO',
  'FAC_ADMINISTRADOR',
];

const isApiKey = rule({ cache: 'contextual' })((parent, args, context) => {
  const API_KEY_ESPERADA = process.env.API_KEY_PARA_CXC;
  
  if (!context.apiKey || !API_KEY_ESPERADA) {
    return false;
  }
  
  return context.apiKey === API_KEY_ESPERADA;
});

const isAuthenticated = rule({ cache: 'contextual' })(
  async (parent, args, context) => {
    if (!context.token) { 
      const error = new Error('No autorizado: No se proporcionó un token de autenticación.');
      error.code = 'UNAUTHORIZED';
      error.status = 401;
      return error;
    }
    
    try {
      const usuarioValido = await validarTokenConSeguridad(context.token);
      if (!usuarioValido) {
        const error = new Error('El token proporcionado ha expirado o es inválido.');
        error.code = 'TOKEN_EXPIRED';
        error.status = 401;
        return error; 
      }

      context.user = usuarioValido;
      const store = contextStorage.getStore();
      if (store) store.user = usuarioValido; 

      return true;
    } catch (err) {
      if (err.code) return err; 
      
      // Fallback genérico por si falla el servicio de seguridad
      const error = new Error('Error interno al validar credenciales');
      error.code = 'INTERNAL_AUTH_ERROR';
      error.status = 500;
      return error;
    }
  }
);

const isInAllowedRoles = () => 
  rule({ cache: 'contextual' })(
    async (parent, args, context) => {
      if (!context.user) return false;
      return Array.isArray(context.user.roles) && 
        context.user.roles.some(rol => ROLES_PERMITIDOS_FACTURACION.includes(rol));
    }
  );

const hasPermission = (requiredPermission) => 
  rule({ cache: 'contextual' })(
    async (parent, args, context) => {
      if (!context.user) return false;
      return Array.isArray(context.user.permissions) && 
        context.user.permissions.includes(requiredPermission);
    }
  );

// --- HELPERS ---
const requierePermiso = (permiso) => chain(isAuthenticated, isInAllowedRoles(), hasPermission(permiso));

const requiereEstarLogeado = or(
  isApiKey, 
  chain(isAuthenticated, isInAllowedRoles())
);

// --- ASIGNACIÓN DE SHIELD ---
const permissions = shield({
  Query: {
    '*': requiereEstarLogeado, 
  },
  Mutation: {
    '*': deny,
    
    // --- MANTENIMIENTO DE CAJAS (Admin) ---
    crearCaja: requierePermiso('FAC_CAJAS_CREAR'),
    actualizarCaja: requierePermiso('FAC_CAJAS_EDITAR'),
    inactivarCaja: requierePermiso('FAC_CAJAS_INACTIVAR'),
    
    // --- OPERACIÓN DE CAJAS (Flujo separado) ---
    abrirSesionCaja: requierePermiso('FAC_CAJAS_SESION_ABRIR'),      // Cajero
    revisarSesionCaja: requierePermiso('FAC_CAJAS_SESION_REVISAR'),  // Cajero (manda a revisión)
    cerrarSesionCaja: requierePermiso('FAC_CAJAS_SESION_CERRAR'),    // Admin (aprueba el cierre)
    
    // --- FACTURACIÓN (Cajero) ---
    crearFactura: requierePermiso('FAC_FACTURAS_CREAR'),
    imprimirFactura: requierePermiso('FAC_FACTURAS_IMPRIMIR'),
    
    // --- INTEGRACIÓN CXC (Exclusivo API Key) ---
    registrarAbonoCXC: isApiKey, 
    
    // --- CLIENTES (Cajero) ---
    crearCliente: requierePermiso('FAC_CLIENTES_CREAR'),
    actualizarCliente: requierePermiso('FAC_CLIENTES_EDITAR'),
    inactivarCliente: requierePermiso('FAC_CLIENTES_INACTIVAR'),

    // --- SALDOS DE CUENTA Y MOVIMIENTOS BANCARIOS (Admin) ---
    crearSaldoCuenta: requierePermiso('FAC_SALDO_CUENTA_CREAR'),
    actualizarSaldoCuenta: requierePermiso('FAC_SALDO_CUENTA_EDITAR'),
    inactivarSaldoCuenta: requierePermiso('FAC_SALDO_CUENTA_INACTIVAR'),
    crearMovimiento: requierePermiso('FAC_MOVIMIENTOS_CREAR'),

    // --- CONFIGURACIÓN (Admin) ---
    actualizarPreferencias: requierePermiso('FAC_PREFERENCIAS_EDITAR'),
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