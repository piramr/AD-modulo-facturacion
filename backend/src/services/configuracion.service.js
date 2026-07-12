const { PreferenciaSistema } = require('../models');

/**
 * Obtiene la configuración global de la empresa.
 */
async function obtenerPreferencias() {
  // Siempre consultamos el ID 1 (creado por el seeder)
  const preferencias = await PreferenciaSistema.findByPk(1);
  
  if (!preferencias) {
    throw new Error('Configuración del sistema no encontrada. Por favor, asegúrese de haber ejecutado los seeders.');
  }
  
  return preferencias;
}

/**
 * Actualiza los datos de la empresa y el IVA.
 */
async function actualizarPreferencias(input) {
  const preferencias = await PreferenciaSistema.findByPk(1);
  
  if (!preferencias) {
    throw new Error('Configuración del sistema no encontrada.');
  }

  // Validación de negocio: El IVA no puede ser negativo
  if (input.porcentajeIva !== undefined && input.porcentajeIva < 0) {
    throw new Error('El porcentaje de IVA no puede ser un valor negativo.');
  }

  // Actualizamos solo los campos que el frontend haya enviado
  return await preferencias.update(input);
}

module.exports = {
  obtenerPreferencias,
  actualizarPreferencias
};