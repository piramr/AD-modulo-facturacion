const { PreferenciaSistema } = require('../models');
const { registrarEvento } = require('./external/auditoria.service');

const idFuncionConfiguracionAuditoria = 23; // ID de la función de auditoría para configuración

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

  const resultado = await preferencias.update(input);

  if (!resultado) {
    registrarEvento({
      idFuncion: idFuncionConfiguracionAuditoria,
      accion: 'ACTUALIZAR_PREFERENCIAS',
      descripcion: `Error al intentar actualizar las preferencias del sistema`,
      observacion: `Intento de actualización con los siguientes datos: ${JSON.stringify(input)}`
    });
    throw new Error('Error al intentar actualizar las preferencias del sistema.');
  }
  
  registrarEvento({
    idFuncion: idFuncionConfiguracionAuditoria,
    accion: 'ACTUALIZAR_PREFERENCIAS',
    descripcion: `Se actualizaron las preferencias del sistema`,
    observacion: `Campos actualizados: ${JSON.stringify(input)}`
  });
}

module.exports = {
  obtenerPreferencias,
  actualizarPreferencias
};