const { SaldoCuenta, MovimientoCuenta } = require('../models');
const { sequelize } = require('../config/db');

/**
 * Devuelve el saldo actual. Si la cuenta es nueva y no existe, devuelve 0.
 */
async function obtenerSaldoCuenta(cuentaId) {
  const cuenta = await SaldoCuenta.findByPk(cuentaId);
  if (!cuenta) {
    throw new Error('La cuenta no esta registrada para obtener su saldo.');
  }

  const movimientos = await MovimientoCuenta.findAll({
    where: { cuentaId },
    order: [['createdAt', 'DESC']]
  });

  cuenta.movimientos = movimientos;
  return cuenta;
}

/**
 * Registra un movimiento y actualiza el saldo en un solo bloque seguro.
 */
async function registrarMovimiento(input) {
  const { cuentaId, tipo, monto, descripcion, referencia } = input;

  if (monto <= 0) throw new Error('El monto debe ser mayor a cero.');

  return await sequelize.transaction(async (t) => {
    // 1. Buscamos el saldo bloqueando la fila para que nadie más la toque al mismo tiempo (lock: true)
    let saldoRecord = await SaldoCuenta.findByPk(cuentaId, { transaction: t, lock: true });

    // Si es la primera vez que esta cuenta recibe dinero, la creamos en 0
    if (!saldoRecord) {
      saldoRecord = await SaldoCuenta.create({ cuentaId, saldoActual: 0.00 }, { transaction: t });
    }

    // 2. Calculamos la matemática
    let nuevoSaldo = Number(saldoRecord.saldoActual);
    if (tipo === 'INGRESO') {
      nuevoSaldo += Number(monto);
    } else if (tipo === 'EGRESO') {
      if (nuevoSaldo < Number(monto)) {
        throw new Error('Fondos insuficientes para realizar este egreso.');
      }
      nuevoSaldo -= Number(monto);
    }

    // 3. Guardamos la tabla de Detalle (Historial)
    await MovimientoCuenta.create({
      cuentaId,
      tipo,
      monto,
      descripcion,
      referencia
    }, { transaction: t });

    // 4. Actualizamos la tabla Maestra (Saldo)
    saldoRecord.saldoActual = nuevoSaldo;
    saldoRecord.ultimaActualizacion = new Date();
    await saldoRecord.save({ transaction: t });

    return saldoRecord;
  });
}

module.exports = {
  obtenerSaldoCuenta,
  registrarMovimiento
};