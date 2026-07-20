const { SaldoCuenta, MovimientoCuenta } = require('../models');
const sequelize = require('../config/db');
const {
  obtenerCuentasBancariasDesdeCXC,
  obtenerCuentaDesdeCXC,
  obtenerCuentasSaldosDesdeCXC
} = require('../services/external/cuentasxcobrar.service');

function normalizarCuentaCXC(cuenta, movimientos = []) {
  const cuentaId = cuenta.cuentaId || cuenta.id || cuenta.cuenta_id;
  const saldoActual = Number(cuenta.saldo_disponible ?? cuenta.saldoDisponible ?? cuenta.saldoActual ?? 0);
  const nombre = cuenta.nombre || cuenta.nombreCuenta || cuenta.entidadBancaria || cuenta.codigo || cuentaId;

  return {
    cuentaId,
    nombre,
    codigo: cuenta.codigo || null,
    entidadBancaria: cuenta.entidadBancaria || cuenta.nombre || null,
    titular: cuenta.titular || null,
    tipoCuenta: cuenta.tipoCuenta || null,
    nroCuenta: cuenta.nroCuenta || cuenta.numeroCuenta || null,
    ruc: cuenta.ruc || null,
    saldoActual,
    saldoDisponible: saldoActual,
    ultimaActualizacion: cuenta.ultimaActualizacion || cuenta.updatedAt || null,
    movimientos
  };
}

function normalizarMovimientoConCuenta(movimiento, detalleCuenta = null) {
  const data = typeof movimiento.toJSON === 'function' ? movimiento.toJSON() : movimiento;

  return {
    ...data,
    cuentaNombre: detalleCuenta?.nombreCuenta || detalleCuenta?.nombre || detalleCuenta?.codigo || null,
    entidadBancaria: detalleCuenta?.entidadBancaria || detalleCuenta?.nombre || null,
    titular: detalleCuenta?.titular || null,
    tipoCuenta: detalleCuenta?.tipoCuenta || null,
    nroCuenta: detalleCuenta?.nroCuenta || detalleCuenta?.numeroCuenta || null
  };
}


/**
 * Devuelve el saldo actual. Si la cuenta es nueva y no existe, devuelve 0.
 */
async function obtenerSaldoCuenta(cuentaId) {
  const movimientos = await MovimientoCuenta.findAll({
    where: { cuentaId },
    order: [['createdAt', 'DESC']]
  });

  const [cuentasCXC, cuentasBancariasCXC] = await Promise.all([
    obtenerCuentasSaldosDesdeCXC(),
    obtenerCuentasBancariasDesdeCXC()
  ]);
  const cuentaCXC = cuentasCXC.find((cuenta) => (
    cuenta.cuentaId === cuentaId ||
    cuenta.id === cuentaId ||
    cuenta.cuenta_id === cuentaId
  ));
  const detalleCuenta = cuentasBancariasCXC.find((cuenta) => (
    cuenta.id === cuentaId ||
    cuenta.cuentaId === cuentaId ||
    cuenta.cuenta_id === cuentaId
  ));

  if (cuentaCXC || detalleCuenta) {
    return normalizarCuentaCXC({ ...(detalleCuenta || {}), ...(cuentaCXC || {}) }, movimientos);
  }

  const cuentaLocal = await SaldoCuenta.findByPk(cuentaId);
  if (!cuentaLocal) {
    throw new Error('La cuenta no esta registrada para obtener su saldo.');
  }

  cuentaLocal.movimientos = movimientos;
  return cuentaLocal;
}

async function listarSaldosCuenta() {
  return await SaldoCuenta.findAll({
    order: [['ultimaActualizacion', 'DESC']],
    include: [{ model: MovimientoCuenta, as: 'movimientos' }]
  });
}

async function listarMovimientosCuenta(limit = 10) {
  const [movimientos, cuentasBancariasCXC] = await Promise.all([
    MovimientoCuenta.findAll({
    limit,
    order: [['fechaMovimiento', 'DESC']]
    }),
    obtenerCuentasBancariasDesdeCXC()
  ]);

  const cuentasBancariasPorId = cuentasBancariasCXC.reduce((acc, cuenta) => {
    const cuentaId = cuenta.id || cuenta.cuentaId || cuenta.cuenta_id;
    if (cuentaId) acc[cuentaId] = cuenta;
    return acc;
  }, {});

  return movimientos
    .filter((movimiento) => Boolean(cuentasBancariasPorId[movimiento.cuentaId]))
    .map((movimiento) => (
      normalizarMovimientoConCuenta(movimiento, cuentasBancariasPorId[movimiento.cuentaId])
    ));
}

/**
 * Lista todas las cuentas bancarias registradas con sus movimientos.
 */
async function obtenerSaldosCuentas() {
  const [cuentasSaldosCXC, cuentasBancariasCXC, movimientos] = await Promise.all([
    obtenerCuentasSaldosDesdeCXC(),
    obtenerCuentasBancariasDesdeCXC(),
    MovimientoCuenta.findAll({
      order: [['fechaMovimiento', 'DESC']]
    })
  ]);

  const cuentasBancariasPorId = cuentasBancariasCXC.reduce((acc, cuenta) => {
    const cuentaId = cuenta.id || cuenta.cuentaId || cuenta.cuenta_id;
    if (cuentaId) acc[cuentaId] = cuenta;
    return acc;
  }, {});

  const movimientosPorCuenta = movimientos.reduce((acc, movimiento) => {
    const cuentaId = movimiento.cuentaId;
    if (!acc[cuentaId]) acc[cuentaId] = [];
    acc[cuentaId].push(movimiento);
    return acc;
  }, {});

  return cuentasSaldosCXC
    .map((cuenta) => {
      const cuentaId = cuenta.cuentaId || cuenta.id || cuenta.cuenta_id;
      const detalleCuenta = cuentasBancariasPorId[cuentaId] || {};
      return normalizarCuentaCXC(
        { ...detalleCuenta, ...cuenta },
        movimientosPorCuenta[cuentaId] || []
      );
    })
    .sort((a, b) => Number(b.saldoActual || 0) - Number(a.saldoActual || 0));
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

/**
 * Crea el registro inicial en la tabla de saldos_cuenta
 */
async function crearSaldoCuenta(input) {
  const { cuentaId, saldoActual = 0.00 } = input;

  const cuentaExistente = await SaldoCuenta.findByPk(cuentaId);
  if (cuentaExistente) {
    throw new Error('Esta cuenta bancaria ya ha sido inicializada en el módulo de facturación.');
  }

  if (obtenerCuentaDesdeCXC(cuentaId) === null) {
    throw new Error('La cuenta bancaria no existe en el sistema de cuentas por cobrar.');
  }

  if (saldoActual < 0) {
    throw new Error('El saldo inicial no puede ser negativo.');
  }

  return await SaldoCuenta.create({
    cuentaId,
    saldoActual,
    ultimaActualizacion: new Date()
  });
}

/**
 * Permite a un administrador corregir manualmente el saldo (Ajuste de inventario/dinero)
 */
async function actualizarSaldoCuenta(id, input) {
  const cuenta = await SaldoCuenta.findByPk(id);
  if (!cuenta) {
    throw new Error('La cuenta bancaria no existe en los registros de facturación.');
  }

  // Si se necesita registrar el ajuste como movimiento, deberías hacerlo aquí.
  // Por ahora, solo actualiza el valor matemático crudo.
  return await cuenta.update({
    saldoActual: input.saldoActual,
    ultimaActualizacion: new Date()
  });
}

/**
 * Pasa el estado de la cuenta a inactivo para que no reciba más movimientos
 * (Requiere que añadas el campo 'estado' a tu modelo SaldoCuenta)
 */
async function inactivarSaldoCuenta(id) {
  const cuenta = await SaldoCuenta.findByPk(id);
  if (!cuenta) {
    throw new Error('La cuenta bancaria no existe en los registros de facturación.');
  }

  return await cuenta.update({
    estado: 'INACTIVO',
    ultimaActualizacion: new Date()
  });
}


module.exports = {
  obtenerSaldoCuenta,
  obtenerSaldosCuentas,
  listarMovimientosCuenta,
  registrarMovimiento,
  crearSaldoCuenta,
  actualizarSaldoCuenta,
  inactivarSaldoCuenta
};
