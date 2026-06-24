const { Op } = require('sequelize');
const { sequelize } = require('../config/db');
const Factura = require('../models/factura.model');
const DetalleFactura = require('../models/detalleFactura.model');
const Cliente = require('../models/cliente.model');
const PistaAuditoria = require('../models/pistaAuditoria.model');

const inventarioService = require('./inventario.service');
const cxcService = require('./cxc.service');
const auditoriaService = require('./auditoria.service');
const auditoriaGrpc = require('../grpc/auditoria.client');


function construirWhere(filtros = {}) {
  const where = {};

  if (filtros.estado) where.estado = filtros.estado;
  if (filtros.clienteId) where.clienteId = filtros.clienteId;
  if (filtros.tipoPago) where.tipoPago = filtros.tipoPago;

  // Búsqueda por número de factura
  if (filtros.search) {
    where.numeroFactura = { [Op.like]: `%${filtros.search}%` };
  }

  return where;
}

async function contarFacturasConFiltro(filtros = {}) {
  const where = construirWhere(filtros);
  return Factura.count({ where });
}

/**
 * Genera número de factura formato XXX-XXX-XXXXXXXXX
 * Ej: 001-001-000000001
 */
async function generarNumeroFactura() {
  const ultima = await Factura.findOne({ order: [['fechaEmision', 'DESC']] }); // <-- CamelCase
  let secuencia = 1;
  if (ultima) {
    const partes = ultima.numeroFactura.split('-');
    secuencia = parseInt(partes[2], 10) + 1;
  }
  return `001-001-${String(secuencia).padStart(9, '0')}`;
}

/**
 * Crear una nueva factura
 */
async function crearFactura(datos, usuario, token) {
  const { clienteId, tipoPago, detalles } = datos;

  if (!detalles || detalles.length === 0) {
    const error = new Error('La factura debe tener al menos un producto');
    error.codigo = 400;
    throw error;
  }

  let subtotal = 0;
  let totalIva = 0;
  const detallesConDatos = [];

  for (const item of detalles) {
    const producto = await inventarioService.obtenerProductoPorCodigo(
      item.productoCodigo,
      token
    );

    // Validar que el producto esté disponible
    if (producto.estado && producto.estado.toLowerCase() === 'inactivo') {
      const error = new Error(`El producto "${producto.nombre}" no está disponible`);
      error.codigo = 400;
      throw error;
    }

    // Validar stock
    if (producto.stock_actual < item.cantidad) {
      const error = new Error(
        `Stock insuficiente para "${producto.nombre}" (disponible: ${producto.stock_actual}, solicitado: ${item.cantidad})`
      );
      error.codigo = 400;
      throw error;
    }

    // Procesar cálculos desde el objeto del producto
    const precioUnitario = Number(producto.pvp);
    const subtotalLinea = Number((precioUnitario * item.cantidad).toFixed(2));

    // Si graba_iva es true aplicas 15, si no, 0 (así manejas dinámicamente el IVA)
    const porcentajeIva = producto.graba_iva ? 0.15 : 0.0;
    const ivaLinea = Number((subtotalLinea * porcentajeIva).toFixed(2));

    subtotal += subtotalLinea;
    totalIva += ivaLinea;

    detallesConDatos.push({
      productoCodigo: producto.codigo,
      productoNombre: producto.nombre,
      cantidad: item.cantidad,
      precioUnitario,
      grabaIva: producto.graba_iva,
      subtotalLinea
    });
  }

  subtotal = Number(subtotal.toFixed(2));
  totalIva = Number(totalIva.toFixed(2));
  const total = Number((subtotal + totalIva).toFixed(2));
  const numeroFactura = await generarNumeroFactura();

  // Guardar todo en una transacción (factura + detalles + auditoría local)
  const resultado = await sequelize.transaction(async (t) => {
    // 1. Crear Cabecera
    const nuevaFactura = await Factura.create({
      numeroFactura, 
      clienteId,     
      tipoPago,      
      subtotal,
      totalIva,      
      total,
      estado: 'Emitida'
    }, { transaction: t });

    // 2. Crear Detalles asociados
    const detallesCreados = await Promise.all(
      detallesConDatos.map((d) =>
        DetalleFactura.create({ ...d, facturaId: nuevaFactura.id }, { transaction: t })
      )
    )

    // 3. Registrar en Pista de Auditoría Local
    await PistaAuditoria.create({
      usuario_id: usuario.id, 
      accion: 'FACTURA_CREADA',
      detalles: {
        numeroFactura,
        clienteId,
        tipoPago,
        subtotal,
        totalIva,
        total,
        productos: detallesConDatos
      }
    }, { transaction: t });

    return { factura: nuevaFactura, detalles: detallesCreados };
  });

  const facturaCompleta = {
    ...resultado.factura.toJSON(),
    detalles: resultado.detalles.map((d) => d.toJSON())
  };

  // --- Operaciones asíncronas externas (Best Effort) ---
  
  // Descontar stock del Inventario
  for (const item of detalles) {
    await inventarioService.descontarStock(item.productoCodigo, item.cantidad, token);
  }

  // Enviar a Cuentas por Cobrar
  await cxcService.registrarCuentaPorCobrar(facturaCompleta, token);

  // Auditoría gRPC Externa
  auditoriaGrpc.registrarEvento({
    accion: 'FACTURA_CREADA',
    usuarioId: usuario.id,
    entidadId: facturaCompleta.id,
    detalle: `Factura ${numeroFactura} - Total: ${total}`
  });

  return facturaCompleta;
}

async function listarFacturas(filtros = {}) {
  const where = construirWhere(filtros);
  const limit = filtros.limit ? parseInt(filtros.limit, 10) : 10;
  const offset = filtros.offset ? parseInt(filtros.offset, 10) : 0;

  let orderClause = [[Factura.rawAttributes.fechaEmision.field, 'DESC']];

  if (filtros.orderBy && filtros.orderBy.length > 0) {
    orderClause = filtros.orderBy.map(item => {
      const columnaBD = item.campo || 'fechaEmision'; 
      return [columnaBD, item.direccion];
    });
  }

  return Factura.findAndCountAll({
    where,
    limit,
    offset,
    order: orderClause,
    include: [
      { model: DetalleFactura, as: 'detalles' },
      { model: Cliente, as: 'cliente', attributes: ['id', 'nombre', 'cedula', 'tipoCliente'] }
    ]
  });
}

/**
 * Obtiene una factura individual con sus relaciones cargadas
 */
async function obtenerFacturaPorId(id) {
  const factura = await Factura.findByPk(id, {
    include: [
      { model: DetalleFactura, as: 'detalles' },
      { model: Cliente, as: 'cliente', attributes: ['id', 'nombre', 'cedula', 'tipoCliente'] }
    ]
  });

  if (!factura) {
    const error = new Error('Factura no encontrada');
    error.codigo = 404;
    throw error;
  }

  return factura;
}

/**
 * Verifica si la factura ya cuenta con un registro de impresión en auditoría
 */
async function facturaFueImpresa(id) {
  const registro = await PistaAuditoria.findOne({
    where: {
      accion: 'FACTURA_IMPRESA',
      detalles: {
        [Op.contains]: { facturaId: id }
      }
    }
  });

  return Boolean(registro);
}

/**
 * Actualiza el estado de la factura validando reglas de negocio e impresión previa
 */
async function actualizarEstadoFactura(id, nuevoEstado, usuario) {
  const factura = await obtenerFacturaPorId(id);
  const estadoAnterior = factura.estado;

  if (await facturaFueImpresa(id)) {
    const error = new Error('La factura ya fue impresa y no puede modificarse');
    error.codigo = 409;
    throw error;
  }

  if (estadoAnterior === 'Anulada') {
    const error = new Error('No se puede modificar una factura anulada');
    error.codigo = 400;
    throw error;
  }

  factura.estado = nuevoEstado;
  await factura.save();

  // Auditorías obligatorias del cambio de estado
  await auditoriaService.registrarAuditoria({
    usuarioId: usuario.id,
    accion: nuevoEstado === 'Anulada' ? 'FACTURA_ANULADA' : 'FACTURA_ACTUALIZADA',
    detalles: {
      facturaId: factura.id,         
      numeroFactura: factura.numeroFactura, 
      estadoAnterior,               
      estadoNuevo: nuevoEstado       
    }
  });

  auditoriaGrpc.registrarEvento({
    accion: nuevoEstado === 'Anulada' ? 'FACTURA_ANULADA' : 'FACTURA_ACTUALIZADA',
    usuarioId: usuario.id,
    entidadId: factura.id,
    detalle: `${factura.numeroFactura}: ${estadoAnterior} → ${nuevoEstado}`
  });

  return factura;
}

module.exports = {
  contarFacturasConFiltro,
  crearFactura,
  listarFacturas,
  obtenerFacturaPorId,
  actualizarEstadoFactura
};
