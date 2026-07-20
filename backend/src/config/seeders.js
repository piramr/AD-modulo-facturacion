const { PreferenciaSistema, SaldoCuenta, MovimientoCuenta } = require('../models');

async function ejecutarSeeders() {
  try {
    // 1. Definimos los UUIDs de las pocas cuentas que vamos a inicializar (Vienen de CXC)
    const cuentaBancaria1ID = 'a4d97f3e-04ba-4f9f-97eb-8f046b22360b'; 
    const cuentaBancaria2ID = '6f8ab23b-53ff-4888-88fe-0932815e0237';

    // 2. Preferencias del Sistema (Ahora con la cuenta por defecto)
    await PreferenciaSistema.findOrCreate({
      where: { id: 1 },
      defaults: {
        nombreEmpresa: 'Módulo Facturación',
        rucEmpresa: '1790000000001',
        porcentajeIva: 15.00,
        cuentaBancariaDefaultId: cuentaBancaria1ID, // Asignamos la cuenta bancaria por defecto
      }
    });

    // 3. Saldos Iniciales (La Libreta Maestra)
    await SaldoCuenta.findOrCreate({
      where: { cuentaId: cuentaBancaria1ID },
      defaults: { saldoActual: 1000.00, ultimaActualizacion: new Date() }
    });

    await SaldoCuenta.findOrCreate({
      where: { cuentaId: cuentaBancaria2ID },
      defaults: { saldoActual: 2500.00, ultimaActualizacion: new Date() }
    });

    // 4. Movimientos Iniciales (El Detalle/Auditoría)
    // Usamos 'referencia' en el where para que no inserte el movimiento dos veces si reinicias el server
    await MovimientoCuenta.findOrCreate({
      where: { referencia: 'INIT-GYE-001' },
      defaults: {
        fechaMovimiento: new Date(),
        cuentaId: cuentaBancaria1ID,
        tipo: 'INGRESO',
        monto: 1000.00,
        descripcion: 'Apertura de saldo inicial',
      }
    });

    await MovimientoCuenta.findOrCreate({
      where: { referencia: 'INIT-PRO-001' },
      defaults: {
        fechaMovimiento: new Date(),
        cuentaId: cuentaBancaria2ID,
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