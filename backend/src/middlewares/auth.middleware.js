const jwt = require('jsonwebtoken');

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
    if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        error: 'Prohibido',
        mensaje: 'No tiene permisos suficientes para esta accion'
      });
    }
    next();
  };
}


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

module.exports = { verificarToken, verificarRol, obtenerUsuarioDesdeToken, decodificarToken, extractPayloadFromToken };
