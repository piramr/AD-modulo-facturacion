const { Caja, SesionCaja, Factura, SaldoCuenta, MovimientoCuenta } = require('../models');
const { Op } = require('sequelize');
const { registrarEvento } = require('./external/auditoria.service');
const { getCurrentUserId, getCurrentUsername } = require('../middlewares/auth.middleware');
const sequelize = require('../config/db');

const idFuncionCajaAuditoria = 22;

async function obtenerCajas() {
  return await Caja.findAll({
    order: [['codigo', 'ASC']]
  });
}

async function obtenerCaja(id) {
  const caja = await Caja.findByPk(id);
  if (!caja) throw new Error('Caja no encontrada.');
  return caja;
}

async function crearCaja(input) {
  // Validar código único
  const existeCodigo = await Caja.findOne({ where: { codigo: input.codigo } });
  if (existeCodigo) throw new Error(`Ya existe una caja con el código ${input.codigo}`);

  // Validar que la combinación Establecimiento + Punto de Emisión no se repita
  const existePuntoEmision = await Caja.findOne({
    where: {
      establecimiento: input.establecimiento,
      puntoEmision: input.puntoEmision
    }
  });

  if (existePuntoEmision) {
    throw new Error(`El punto de emisión ${input.establecimiento}-${input.puntoEmision} ya está asignado a otra caja. Cada caja debe tener uno único.`);
  }

  registrarEvento({
    idFuncion: idFuncionCajaAuditoria,
    accion: 'CREAR_CAJA',
    descripcion: `Creación de caja ${input.codigo} por ${getCurrentUsername()}`,
    observacion: `Nueva caja creada con los siguientes datos: ${JSON.stringify(input)}`
  });

  return await Caja.create(input);
}

async function actualizarCaja(id, input) {
  const caja = await Caja.findByPk(id);
  if (!caja) throw new Error('Caja no encontrada.');

  // Si intentan cambiar el código, validar unicidad
  if (input.codigo && input.codigo !== caja.codigo) {
    const existeCodigo = await Caja.findOne({ where: { codigo: input.codigo } });
    if (existeCodigo) throw new Error(`El código ${input.codigo} ya está en uso.`);
  }

  // Si cambian establecimiento o punto de emisión, validar combinación
  const nuevoEstablecimiento = input.establecimiento || caja.establecimiento;
  const nuevoPuntoEmision = input.puntoEmision || caja.puntoEmision;

  if (nuevoEstablecimiento !== caja.establecimiento || nuevoPuntoEmision !== caja.puntoEmision) {
    const existePuntoEmision = await Caja.findOne({
      where: {
        establecimiento: nuevoEstablecimiento,
        puntoEmision: nuevoPuntoEmision,
        id: { [Op.ne]: id } // Excluir a sí misma
      }
    });

    if (existePuntoEmision) {
      throw new Error(`El punto de emisión ${nuevoEstablecimiento}-${nuevoPuntoEmision} ya está en uso por otra caja.`);
    }
  }

  registrarEvento({
    idFuncion: idFuncionCajaAuditoria,
    accion: 'ACTUALIZAR_CAJA',
    descripcion: `Actualización de caja ${caja.codigo} por ${getCurrentUsername()}`,
    observacion: `Datos actualizados: ${JSON.stringify(input)}`
  });

  return await caja.update(input);
}

async function inactivarCaja(id) {
  const caja = await Caja.findByPk(id);
  if (!caja) throw new Error('Caja no encontrada.');

  // Regla de negocio: No inactivar si un cajero la está usando
  const sesionAbierta = await SesionCaja.findOne({
    where: { cajaId: id, estado: 'ABIERTA' }
  });

  if (sesionAbierta) {
    throw new Error('No puedes inactivar esta caja porque tiene un turno de cajero abierto en este momento.');
  }

  registrarEvento({
    idFuncion: idFuncionCajaAuditoria,
    accion: 'INACTIVAR_CAJA',
    descripcion: `Inactivación de caja ${caja.codigo} por ${getCurrentUsername()}`,
    observacion: `La caja ha sido inactivada.`
  });

  return await caja.update({ estado: 'INACTIVO' });
}


// ==========================================
// 2. FUNCIONES DE OPERACIÓN (SESIONES CAJERO Y ADMIN)
// ==========================================

async function obtenerSesionActiva(usuarioId) {
  return await SesionCaja.findOne({
    where: { 
      usuarioId, 
      estado: 'ABIERTA' 
    },
    include: [{ model: Caja, as: 'caja' }]
  });
}

async function obtenerSesionesRevision() {
  return await SesionCaja.findAll({
    where: { estado: 'EN_REVISION' },
    include: [{ model: Caja, as: 'caja' }],
    order: [['fechaApertura', 'DESC']]
  });
}

async function abrirSesionCaja(input) {
  const { cajaId, montoApertura } = input;

  if (montoApertura < 0) {
    throw new Error('El monto de apertura no puede ser negativo. Debe ser mayor o igual a cero.');
  }

  const caja = await Caja.findByPk(cajaId);
  if (!caja) throw new Error('La caja seleccionada no existe.');
  if (caja.estado !== 'ACTIVO') throw new Error('La caja seleccionada está inactiva.');

  const cajaOcupada = await SesionCaja.findOne({
    where: { cajaId, estado: 'ABIERTA' }
  });
  if (cajaOcupada) {
    throw new Error('Esta caja ya está siendo operada por otro usuario.');
  }

  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error('No se pudo determinar el usuario actual. Asegúrese de estar autenticado.');
  }

  const usuarioOcupado = await SesionCaja.findOne({
    where: { usuarioId: userId, estado: 'ABIERTA' }
  });
  if (usuarioOcupado) {
    throw new Error('Ya tienes un turno abierto en otra caja. Ciérralo primero.');
  }

  const nuevaSesion = await SesionCaja.create({
    cajaId,
    usuarioId: userId,
    montoApertura,
    fechaApertura: new Date(),
    cantidadFacturas: 0,
    totalVentasEfectivo: 0,
    montoCierreEsperado: montoApertura,
    estado: 'ABIERTA'
  });

  registrarEvento({
    idFuncion: idFuncionCajaAuditoria,
    accion: 'APERTURA_CAJA',
    descripcion: `Apertura de caja ${caja.codigo} por ${getCurrentUsername()}`,
    observacion: `Monto de apertura: ${montoApertura}`
  });

  return await SesionCaja.findByPk(nuevaSesion.id, {
    include: [{ model: Caja, as: 'caja' }]
  });
}

// ------------------------------------------------------------------
// NUEVO FLUJO: CAJERO ENVÍA A REVISIÓN
// ------------------------------------------------------------------
async function revisarSesionCaja(input) {
  const { sesionCajaId, montoCierreReal } = input;

  const sesion = await SesionCaja.findByPk(sesionCajaId, {
    include: [{ model: Caja, as: 'caja' }]
  });

  if (!sesion) throw new Error('La sesión de caja no existe.');
  
  if (sesion.usuarioId !== getCurrentUserId()) {
    throw new Error('Operación denegada: No puedes enviar a revisión una sesión de caja que no te pertenece.');
  }

  if (sesion.estado !== 'ABIERTA') {
    throw new Error(`No puedes enviar a revisión esta sesión porque su estado actual es ${sesion.estado}.`);
  }

  // 1. Contabilizar ventas
  const facturas = await Factura.findAll({
    where: {
      sesionCajaId: sesion.id,
      estado: {
        [Op.in]: ['PAGADA', 'PAGO_PENDIENTE']
      }
    }
  });

  // 2. Cálculos de Arqueo
  const cantidadFacturas = facturas.length;
  
  const totalVentasEfectivo = facturas
    .filter(f => f.tipoPago === 'EFECTIVO')
    .reduce((sum, f) => sum + Number(f.total), 0);

  const totalVentasCredito = facturas
    .filter(f => f.tipoPago === 'CREDITO')
    .reduce((sum, f) => sum + Number(f.total), 0);

  const montoCierreEsperado = Number((Number(sesion.montoApertura) + totalVentasEfectivo).toFixed(2));
  
  // 3. Cálculo de Faltante y Sobrante
  const diferencia = Number((montoCierreReal - montoCierreEsperado).toFixed(2));
  let sobrante = 0.00;
  let faltante = 0.00;

  if (diferencia > 0) {
    sobrante = diferencia;
  } else if (diferencia < 0) {
    faltante = Math.abs(diferencia); // Guardamos el valor absoluto del faltante
  }

  // 4. Actualizar estado a EN_REVISION (El cajero ya no puede modificarla)
  await sesion.update({
    cantidadFacturas,
    totalVentasEfectivo,
    totalVentasCredito,
    montoCierreEsperado,
    montoCierreReal,
    faltante,
    sobrante,
    estado: 'EN_REVISION'
  });

  registrarEvento({
    idFuncion: idFuncionCajaAuditoria,
    accion: 'REVISION_CAJA',
    descripcion: `Caja ${sesion.caja.codigo} enviada a revisión por el cajero ${getCurrentUsername()}`,
    observacion: `Esperado: ${montoCierreEsperado} | Real: ${montoCierreReal} | Sobrante: ${sobrante} | Faltante: ${faltante}`
  });

  return sesion;
}

async function cerrarSesionCaja(input) {
  const { sesionCajaId, distribucionCuentas = [] } = input; 

  const sesion = await SesionCaja.findByPk(sesionCajaId, {
    include: [{ model: Caja, as: 'caja' }]
  });

  if (!sesion) throw new Error('La sesión de caja no existe.');
  
  if (sesion.estado !== 'EN_REVISION') {
    throw new Error('Solo se pueden cerrar definitivamente las sesiones que se encuentran EN_REVISION.');
  }

  const totalADepositar = distribucionCuentas.reduce((sum, item) => sum + Number(item.monto), 0);
  const ventasGanancias = Number(sesion.totalVentasEfectivo);

  if (totalADepositar !== ventasGanancias) {
    throw new Error(`El total a depositar en las cuentas ($${totalADepositar.toFixed(2)}) debe ser exactamente igual al total de las ventas en efectivo del turno ($${ventasGanancias.toFixed(2)}).`);
  }

  // Iniciamos la transacción
  const t = await sequelize.transaction();

  try {
    // 1. Procesar los depósitos y actualizar saldos
    if (distribucionCuentas.length > 0) {
      for (const deposito of distribucionCuentas) {
        if (deposito.monto > 0) {
          
          // A) Verificar que la cuenta exista
          const cuentaBancaria = await SaldoCuenta.findByPk(deposito.cuentaId, { transaction: t });
          if (!cuentaBancaria) {
            throw new Error(`La cuenta bancaria con ID ${deposito.cuentaId} no existe.`);
          }

          // B) Crear el registro utilizando el modelo MovimientoCuenta
          await MovimientoCuenta.create({
            cuentaId: deposito.cuentaId,
            tipo: 'INGRESO',
            monto: deposito.monto,
            fechaMovimiento: new Date(),
            referencia: `CIERRE-CAJA-${sesion.caja.codigo}`,
            descripcion: `Depósito automático por ganancias del cierre de caja. Sesión ID: ${sesion.id}`
          }, { transaction: t }); 

          // C) Aumentar 'saldoActual' y actualizar la fecha
          await cuentaBancaria.increment('saldoActual', { 
            by: deposito.monto, 
            transaction: t 
          });
          
          await cuentaBancaria.update({ 
            ultimaActualizacion: new Date() 
          }, { 
            transaction: t 
          });
        }
      }
    }

    // 2. Cierre definitivo de la caja
    await sesion.update({
      fechaCierre: new Date(),
      estado: 'CERRADA'
    }, { transaction: t }); 

    // 3. Confirmar la transacción
    await t.commit();

    // 4. Registrar auditoría
    registrarEvento({
      idFuncion: idFuncionCajaAuditoria,
      accion: 'CIERRE_CAJA',
      descripcion: `Cierre definitivo de caja ${sesion.caja.codigo} aprobado por ${getCurrentUsername()}`,
      observacion: `Se depositó el total de ventas ($${ventasGanancias}) distribuido en ${distribucionCuentas.length} cuentas bancarias.`
    });

    return sesion;

  } catch (error) {
    await t.rollback();
    throw error; 
  }
}
module.exports = {
  obtenerCajas,
  obtenerCaja,
  crearCaja,
  actualizarCaja,
  inactivarCaja,
  obtenerSesionActiva,
  obtenerSesionesRevision,
  abrirSesionCaja,
  revisarSesionCaja,
  cerrarSesionCaja
};