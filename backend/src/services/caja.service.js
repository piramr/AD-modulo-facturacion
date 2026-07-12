const { Caja, SesionCaja, Factura } = require('../models');
const { Op } = require('sequelize');
const { registrarEvento } = require('./external/auditoria.service');


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

  return await caja.update({ estado: 'INACTIVO' });
}


// ==========================================
// 2. FUNCIONES DE OPERACIÓN (SESIONES CAJERO)
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

async function abrirSesionCaja(input) {
  const { cajaId, usuarioId, montoApertura } = input;

  if (montoApertura < 0) {
    throw new Error('El monto de apertura no puede ser negativo. Debe ser mayor o igual a cero.');
  }

  const caja = await Caja.findByPk(cajaId);
  if (!caja) throw new Error('La caja seleccionada no existe.');
  if (caja.estado !== 'ACTIVO') throw new Error('La caja seleccionada está inactiva.');

  // Validar que la caja no esté ocupada
  const cajaOcupada = await SesionCaja.findOne({
    where: { cajaId, estado: 'ABIERTA' }
  });
  if (cajaOcupada) {
    throw new Error('Esta caja ya está siendo operada por otro usuario.');
  }

  // Validar que el usuario no tenga otra caja abierta
  const usuarioOcupado = await SesionCaja.findOne({
    where: { usuarioId, estado: 'ABIERTA' }
  });
  if (usuarioOcupado) {
    throw new Error('Ya tienes un turno abierto en otra caja. Ciérralo primero.');
  }

  const nuevaSesion = await SesionCaja.create({
    cajaId,
    usuarioId,
    montoApertura,
    fechaApertura: new Date(),
    cantidadFacturas: 0,
    totalVentasEfectivo: 0,
    montoCierreEsperado: montoApertura,
    estado: 'ABIERTA'
  });

  registrarEvento({
    idFuncion: 101, // ID de la función de apertura de caja
    accion: 'APERTURA_CAJA',
    descripcion: `Apertura de caja ${caja.codigo} por usuario ${usuarioId}`,
    observacion: `Monto de apertura: ${montoApertura}`
  });

  return await SesionCaja.findByPk(nuevaSesion.id, {
    include: [{ model: Caja, as: 'caja' }]
  });
}

async function cerrarSesionCaja(input) {
  const { sesionCajaId, montoCierreReal } = input;

  const sesion = await SesionCaja.findByPk(sesionCajaId, {
    include: [{ model: Caja, as: 'caja' }]
  });

  if (!sesion) throw new Error('La sesión de caja no existe.');
  if (sesion.estado === 'CERRADA') throw new Error('Esta sesión de caja ya fue cerrada.');

  // 1. Contabilizar ventas
  const facturas = await Factura.findAll({
    where: { 
      sesionCajaId: sesion.id,
      estado: { [Op.ne]: 'ANULADA' } 
    }
  });

  // 2. Cálculos de Arqueo (Solo se suma el EFECTIVO, el crédito no entra al cajón)
  const cantidadFacturas = facturas.length;
  
  const totalVentasEfectivo = facturas
    .filter(f => f.tipoPago === 'EFECTIVO')
    .reduce((sum, f) => sum + Number(f.total), 0);

  const totalVentasCredito = facturas
    .filter(f => f.tipoPago === 'CREDITO')
    .reduce((sum, f) => sum + Number(f.total), 0);

  const montoCierreEsperado = Number((Number(sesion.montoApertura) + totalVentasEfectivo).toFixed(2));
  
  // Positivo = Sobra dinero / Negativo = Falta dinero
  const diferencia = Number((montoCierreReal - montoCierreEsperado).toFixed(2));

  // 3. Cerrar turno y guardar contabilidad
  await sesion.update({
    fechaCierre: new Date(),
    cantidadFacturas,
    totalVentasEfectivo,
    totalVentasCredito,
    montoCierreEsperado,
    montoCierreReal,
    diferencia,
    estado: 'CERRADA'
  });


  registrarEvento({
    idFuncion: 102, // ID de la función de cierre de caja
    accion: 'CIERRE_CAJA',
    descripcion: `Cierre de caja ${sesion.caja.codigo}`,
    observacion: `Monto de cierre real: ${montoCierreReal}, Diferencia: ${diferencia}`
  });

  return sesion;
}

module.exports = {
  obtenerCajas,
  obtenerCaja,
  crearCaja,
  actualizarCaja,
  inactivarCaja,
  obtenerSesionActiva,
  abrirSesionCaja,
  cerrarSesionCaja
};