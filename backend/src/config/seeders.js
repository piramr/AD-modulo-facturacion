const { PreferenciaSistema } = require('../models');

async function ejecutarSeeders() {
  try {

    // Preferencias del Sistema y Secuenciales
    await PreferenciaSistema.findOrCreate({
      where: { id: 1 },
      defaults: {
        nombreEmpresa: 'Módulo Facturación',
        rucEmpresa: '1790000000001',
        porcentajeIva: 15.00,
        cuentaBancariaDefaultId: null,
      }
    });
    
  } catch (error) {
    console.error('❌ Error al ejecutar los Seeders:', error.message);
  }
}

module.exports = ejecutarSeeders;