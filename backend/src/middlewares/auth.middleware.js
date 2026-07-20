const jwt = require('jsonwebtoken');
const { getCurrentContext } = require('../store/contextStore');
const { validarTokenConSeguridad } = require('../services/external/seguridad.service');

function decodificarToken(authHeader) {
  if (!authHeader) throw new Error('No se proporciono un token de autenticacion');

  const partes = authHeader.split(' ');
  if (partes.length !== 2 || partes[0] !== 'Bearer') {
    throw new Error('Formato de token invalido. Use: Bearer <token>');
  }

  return jwt.verify(partes[1], process.env.JWT_SECRET, {
    algorithms: [process.env.JWT_ALGORITHM || 'HS256']
  });
}

function verificarToken(req, res, next) {
  try {
    req.usuario = decodificarToken(req.headers.authorization);
    next();
  } catch (error) {
    const mensaje =
      error.name === 'TokenExpiredError'
        ? 'La sesion ha expirado, inicie sesion nuevamente'
        : error.message;
    return res.status(401).json({ error: 'No autorizado', mensaje });
  }
}

function obtenerUsuarioDesdeToken(authHeader) {
  try {
    return decodificarToken(authHeader);
  } catch {
    return null;
  }
}

function verificarRol(rolesPermitidos = []) {
  return (req, res, next) => {
    const rolesUsuario = Array.isArray(req.usuario?.roles)
      ? req.usuario.roles
      : [req.usuario?.rol].filter(Boolean);

    const tieneRolPermitido = rolesUsuario.some((rol) => rolesPermitidos.includes(rol));

    if (!req.usuario || !tieneRolPermitido) {
      return res.status(403).json({
        error: 'Prohibido',
        mensaje: 'No tiene permisos suficientes para esta accion'
      });
    }
    next();
  };
}

async function verificarTokenConSeguridad(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: 'No autorizado',
      mensaje: 'No se proporciono un token de autenticacion'
    });
  }

  const partes = authHeader.split(' ');
  if (partes.length !== 2 || partes[0] !== 'Bearer') {
    return res.status(401).json({
      error: 'No autorizado',
      mensaje: 'Formato de token invalido. Use: Bearer <token>'
    });
  }

  try {
    const usuario = await validarTokenConSeguridad(partes[1]);
    if (!usuario) {
      return res.status(401).json({
        error: 'No autorizado',
        mensaje: 'El token proporcionado ha expirado o es invalido.'
      });
    }

    req.usuario = usuario;

    const context = getCurrentContext();
    if (context) {
      context.user = usuario;
    }

    return next();
  } catch (error) {
    const status = error.code === 'SECURITY_SERVICE_UNAVAILABLE' ? 503 : 401;
    return res.status(status).json({
      error: 'No autorizado',
      mensaje: error.message || 'No fue posible validar el token con Seguridad.'
    });
  }
}

/* EJEMPLO DE PAYLOAD DECODIFICADO DEL TOKEN
{
  "user_id": 14,
  "user_name": "alexander",
  "email": "admin.facturacion@gmail.com",
  "roles": [],
  "permissions": [],
  "exp": 1783885096
}
*/
function extractPayloadFromToken(token) {
  if (!token) return null;
  try {
    const partes = token.split('.');
    if (partes.length !== 3) return null;
    
    // Decodificamos el payload que está en formato Base64Url
    const payloadBase64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonString = Buffer.from(payloadBase64, 'base64').toString('utf-8');
    
    return JSON.parse(jsonString); // Devuelve: { user_id: 14, user_name: "alexander", ... }
  } catch (error) {
    console.error('Error al decodificar el token de forma nativa:', error.message);
    return null;
  }
}

function getCurrentUserId() {
  const context = getCurrentContext();
  if (!context || !context.token) {
    return null;
  }

  const payload = extractPayloadFromToken(context.token);
  return payload ? payload.user_id : null;
}

function getCurrentUsername() {
  const context = getCurrentContext();
  if (!context || !context.token) {
    return null;
  }
  const payload = extractPayloadFromToken(context.token);
  return payload ? payload.user_name : null;
}

module.exports = { verificarToken, verificarTokenConSeguridad, verificarRol, obtenerUsuarioDesdeToken, decodificarToken, extractPayloadFromToken, getCurrentUsername, getCurrentUserId };
