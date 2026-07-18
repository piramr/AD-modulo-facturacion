// permission.js
const { validarTokenConSeguridad } = require('../services/external/seguridad.service');
const { contextStorage } = require('../store/contextStore');

const ROLES_PERMITIDOS_FACTURACION = [
  'FAC_CAJERO',
  'FAC_ADMINISTRADOR',
];

function crearError(message, code = 'UNAUTHORIZED', status = 401) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  return error;
}

function esApiKeyValida(context) {
  const API_KEY_ESPERADA = process.env.API_KEY_PARA_CXC;

  if (!context.apiKey || !API_KEY_ESPERADA) {
    return false;
  }

  return context.apiKey === API_KEY_ESPERADA;
}

async function autenticarUsuario(context) {
  if (context.user) {
    return context.user;
  }

  if (!context.token) {
    throw crearError('No autorizado: No se proporciono un token de autenticacion.');
  }

  try {
    const usuarioValido = await validarTokenConSeguridad(context.token);

    if (!usuarioValido) {
      throw crearError('El token proporcionado ha expirado o es invalido.', 'TOKEN_EXPIRED');
    }

    context.user = usuarioValido;

    const store = contextStorage.getStore();
    if (store) {
      store.user = usuarioValido;
    }

    return usuarioValido;
  } catch (err) {
    if (err.code) {
      throw err;
    }

    throw crearError('Error interno al validar credenciales', 'INTERNAL_AUTH_ERROR', 500);
  }
}

function validarRolFacturacion(usuario) {
  const tieneRolPermitido = Array.isArray(usuario.roles)
    && usuario.roles.some((rol) => ROLES_PERMITIDOS_FACTURACION.includes(rol));

  if (!tieneRolPermitido) {
    throw crearError('No autorizado: No tienes un rol permitido para facturacion.');
  }
}

async function requerirSesionFacturacion(context) {
  const usuario = await autenticarUsuario(context);
  validarRolFacturacion(usuario);
  return usuario;
}

function crearMiddleware(handler) {
  return async (resolve, parent, args, context, info) => {
    await handler(context);
    return resolve(parent, args, context, info);
  };
}

const requiereEstarLogeado = crearMiddleware(async (context) => {
  if (esApiKeyValida(context)) {
    return;
  }

  await requerirSesionFacturacion(context);
});

const requiereApiKey = crearMiddleware(async (context) => {
  if (!esApiKeyValida(context)) {
    throw crearError('No autorizado: API key invalida o ausente.');
  }
});

const requierePermiso = (permiso) => crearMiddleware(async (context) => {
  const usuario = await requerirSesionFacturacion(context);
  const tienePermiso = Array.isArray(usuario.permissions)
    && usuario.permissions.includes(permiso);

  if (!tienePermiso) {
    throw crearError('No autorizado: No tienes los privilegios necesarios para esta accion.');
  }
});

const denegar = crearMiddleware(async () => {
  throw crearError('No autorizado: No tienes los privilegios necesarios para esta accion.');
});

const permissions = {
  Query: {
    obtenerPreferencias: requiereEstarLogeado,
    reporteClientes: requiereEstarLogeado,
    reporteFacturas: requiereEstarLogeado,
    obtenerCajas: requiereEstarLogeado,
    obtenerCaja: requiereEstarLogeado,
    obtenerSesionActiva: requiereEstarLogeado,
    saldoCuenta: requiereEstarLogeado,
    obtenerSaldosCuentas: requiereEstarLogeado,
    movimientosCuenta: requiereEstarLogeado,
    facturas: requiereEstarLogeado,
    factura: requiereEstarLogeado,
    productos: requiereEstarLogeado,
    facturasPendientesPorCliente: requiereEstarLogeado,
    clientes: requiereEstarLogeado,
    cliente: requiereEstarLogeado,
  },
  Mutation: {
    // Mantenimiento de cajas
    crearCaja: requierePermiso('FAC_CAJAS_CREAR'),
    actualizarCaja: requierePermiso('FAC_CAJAS_EDITAR'),
    inactivarCaja: requierePermiso('FAC_CAJAS_INACTIVAR'),

    // Operacion de cajas
    abrirSesionCaja: requierePermiso('FAC_CAJAS_SESION_ABRIR'),
    revisarSesionCaja: requierePermiso('FAC_CAJAS_SESION_REVISAR'),
    cerrarSesionCaja: requierePermiso('FAC_CAJAS_SESION_CERRAR'),

    // Facturacion
    crearFactura: requierePermiso('FAC_FACTURAS_CREAR'),
    imprimirFactura: requierePermiso('FAC_FACTURAS_IMPRIMIR'),

    // Integracion CXC
    registrarAbonoCXC: requiereApiKey,

    // Clientes
    crearCliente: requierePermiso('FAC_CLIENTES_CREAR'),
    actualizarCliente: requierePermiso('FAC_CLIENTES_EDITAR'),
    inactivarCliente: requierePermiso('FAC_CLIENTES_INACTIVAR'),

    // Saldos de cuenta y movimientos bancarios
    crearSaldoCuenta: requierePermiso('FAC_SALDO_CUENTA_CREAR'),
    actualizarSaldoCuenta: requierePermiso('FAC_SALDO_CUENTA_EDITAR'),
    inactivarSaldoCuenta: requierePermiso('FAC_SALDO_CUENTA_INACTIVAR'),
    crearMovimiento: requierePermiso('FAC_MOVIMIENTOS_CREAR'),

    // Configuracion
    actualizarPreferencias: requierePermiso('FAC_PREFERENCIAS_EDITAR'),
  },
};

module.exports = permissions;
