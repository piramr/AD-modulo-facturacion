const { PreferenciaSistema, SaldoCuenta, MovimientoCuenta } = require('../models');

async function ejecutarSeeders() {
  try {
    // 1. Definimos los UUIDs de las pocas cuentas que vamos a inicializar (Vienen de CXC)
    const cuentaGuayaquilId = 'df9bd17a-4c31-4e36-9485-a87968b5c9c4'; 
    const cuentaProdubancoId = '66fc1303-18c3-48e6-9b69-fba06ad8f903';

    // 2. Preferencias del Sistema (Ahora con la cuenta por defecto)
    await PreferenciaSistema.findOrCreate({
      where: { id: 1 },
      defaults: {
        nombreEmpresa: 'Módulo Facturación',
        rucEmpresa: '1790000000001',
        porcentajeIva: 15.00,
        cuentaBancariaDefaultId: cuentaGuayaquilId,
      }
    });

    // 3. Saldos Iniciales (La Libreta Maestra)
    await SaldoCuenta.findOrCreate({
      where: { cuentaId: cuentaGuayaquilId },
      defaults: { saldoActual: 1000.00, ultimaActualizacion: new Date() }
    });

    await SaldoCuenta.findOrCreate({
      where: { cuentaId: cuentaProdubancoId },
      defaults: { saldoActual: 2500.00, ultimaActualizacion: new Date() }
    });

    // 4. Movimientos Iniciales (El Detalle/Auditoría)
    // Usamos 'referencia' en el where para que no inserte el movimiento dos veces si reinicias el server
    await MovimientoCuenta.findOrCreate({
      where: { referencia: 'INIT-GYE-001' },
      defaults: {
        fecha: new Date(),
        cuentaId: cuentaGuayaquilId,
        tipo: 'INGRESO',
        monto: 1000.00,
        descripcion: 'Apertura de saldo inicial',
      }
    });

    await MovimientoCuenta.findOrCreate({
      where: { referencia: 'INIT-PRO-001' },
      defaults: {
        fecha: new Date(),
        cuentaId: cuentaProdubancoId,
        tipo: 'INGRESO',
        monto: 2500.00,
        descripcion: 'Apertura de saldo inicial',
      }
    });

    console.log('✅ Seeders de Preferencias, Saldos y Movimientos ejecutados con éxito.');
  } catch (error) {
    console.error('❌ Error al ejecutar los Seeders:', error.message);
  }
}

module.exports = ejecutarSeeders;