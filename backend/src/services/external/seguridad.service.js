const axios = require('axios');

/**
 * Valida un token contra el módulo de seguridad externo y devuelve el perfil estructurado.
 * @param {string} token JWT a validar
 * @returns {Promise<Object>} Estructura exacta con datos de usuario, roles, permisos y exp
 */
async function validarTokenConSeguridad(token) {
  try {
    // IMPORTANTE: Asegúrate de que la URL termine en /graphql/ con el slash al final
    const response = await axios({
      method: 'POST',
      url: `${process.env.SEGURIDAD_GRAPHQL_URL}/`,
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        query: `
          query validarToken {
            me {
              id
              userName
              email
              cedula
              estado
              roles {
                idRol
                nombreRol
                estadoRol
                funciones {
                  idFuncion
                  nombreFuncion
                  estadoFuncion
                }
              }
            }
          }
        `,
        operationName: "validarToken"
      }
    });

    const usuarioSeguridad = response?.data?.data?.me;

    // Si el token expiró, es inválido o el usuario está inactivo
    if (!usuarioSeguridad || usuarioSeguridad.estado !== true) {
      return null; 
    }

    const rolesNombres = [];
    const permisosNombres = [];

    // Procesamos y aplanamos los roles y funciones (permisos) activos
    if (Array.isArray(usuarioSeguridad.roles)) {
      usuarioSeguridad.roles.forEach(rol => {
        if (rol.estadoRol === true) {
          rolesNombres.push(rol.nombreRol);

          if (Array.isArray(rol.funciones)) {
            rol.funciones.forEach(func => {
              if (func.estadoFuncion === true) {
                permisosNombres.push(func.nombreFuncion);
              }
            });
          }
        }
      });
    }

    // Extracción directa del 'exp' desde el payload del JWT
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payloadDecodificado = JSON.parse(Buffer.from(base64, 'base64').toString());
    const expTimestamp = payloadDecodificado.exp;

    // RETORNA EXACTAMENTE TU ESTRUCTURA SOLICITADA
    return {
      "user_id": usuarioSeguridad.id,
      "user_name": usuarioSeguridad.userName,
      "email": usuarioSeguridad.email,
      "roles": rolesNombres,
      "permissions": permisosNombres,
      "exp": expTimestamp
    };

  } catch (error) {
    console.error('Error al validar el token con módulo de seguridad:', error);
    const err = new Error('Servicio de seguridad no disponible');
    err.code = 'SECURITY_SERVICE_UNAVAILABLE';
    throw err;
  }
}

module.exports = {
  validarTokenConSeguridad
};
