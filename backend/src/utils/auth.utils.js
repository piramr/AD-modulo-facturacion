const { getCurrentContext } = require('../store/contextStore');

/**
 * 
 * @returns {string|null} El token del contexto actual de la petición
 */
function getCurrentToken() {
  const context = getCurrentContext();
  return context && context.token ? context.token : null;
}

/**
 * Obtiene el objeto de usuario completo e hidratado desde el contexto asíncrono.
 * @returns {Object|null} El perfil del usuario (id, user_name, roles, permissions, etc.) o null si no se ha autenticado.
 */
function getCurrentUser() {
  const context = getCurrentContext();
  // Retorna el usuario estructurado que inyectó GraphQL Shield tras el login exitoso
  return context && context.user ? context.user : null;
}

/**
 * Obtiene de manera directa el ID del usuario actual.
 * @returns {number|null} El user_id (ej: 16) o null.
 */
function getCurrentUserId() {
  const user = getCurrentUser();
  return user ? user.user_id : null;
}

/**
 * Obtiene de manera directa el username del usuario actual.
 * @returns {string|null} El user_name (ej: "HenryMoreta") o null.
 */
function getCurrentUsername() {
  const user = getCurrentUser();
  return user ? user.user_name : null;
}

module.exports = {
  getCurrentUser,
  getCurrentUserId,
  getCurrentUsername,
  getCurrentToken
};