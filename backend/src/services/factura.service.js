const { Op } = require('sequelize');
const { sequelize, Factura, DetalleFactura, Cliente, PreferenciaSistema } = require('../models');
const { validarDeudaCliente } = require('./external/cuentasxcobrar.service');
const { registrarCardexVenta } = require('./external/inventario.service');

const tiposPagoPermitidos = ['CONTADO', 'CREDITO'];

function construirWhere(filtros = {}) {
  const where = {};

  if (filtros.estadoPago) where.estadoPago = filtros.estadoPago;
  if (filtros.clienteId) where.clienteId = filtros.clienteId;
  if (filtros.tipoPago) where.tipoPago = filtros.tipoPago;
  if (typeof filtros.isPrinted === 'boolean') where.isPrinted = filtros.isPrinted;

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
 * Crear una nueva factura (Transacción completa)
 */
async function crearFactura(datos, usuario, token) {
  const { clienteId, sesionCajaId, tipoPago, detalles } = datos;

  if (!detalles || detalles.length === 0) {
    const error = new Error('La factura debe tener al menos un producto');
    error.codigo = 400;
    throw error;
  }

  const cliente = await Cliente.findByPk(clienteId);
  if (!cliente) {
    const error = new Error('El cliente seleccionado no existe.');
    error.codigo = 404;
    throw error;
  }

  if (tipoPago === 'CREDITO' && cliente.tipoCliente !== 'CREDITO') {
    const error = new Error(`Operación denegada: El cliente ${cliente.nombre} solo tiene autorización para compras al CONTADO.`);
    error.codigo = 403;
    throw error;
  }

  const aptoParaCredito = await validarDeudaCliente(clienteId);
  if (!aptoParaCredito) {
    const error = new Error(`Operación denegada: El cliente ${cliente.nombre} tiene deudas pendientes.`);
    error.codigo = 403;
    throw error;
  }

  // 1. Obtener configuraciones globales (IVA y Secuenciales)
  const preferencias = await PreferenciaSistema.findByPk(1);
  if (!preferencias) throw new Error('Configuración del sistema no encontrada');
  
  const porcentajeIvaAplicado = Number(preferencias.porcentajeIva);
  const factorIva = porcentajeIvaAplicado / 100;

  let subtotal = 0;
  let ivaTotal = 0;
  const detallesConDatos = [];

  // 2. Procesar cálculos por producto
  for (const item of detalles) {
    const producto = await inventarioService.obtenerProductoPorCodigo(item.productoId);

    if (producto.estado && producto.estado.toLowerCase() === 'inactivo') {
      const error = new Error(`El producto "${producto.nombre}" no está disponible`);
      error.codigo = 400;
      throw error;
    }

    if (producto.stock_actual < item.cantidad) {
      const error = new Error(`Stock insuficiente para "${producto.nombre}"`);
      error.codigo = 400;
      throw error;
    }

    const pvpUnitario = Number(producto.pvp);
    const subtotalLinea = Number((pvpUnitario * item.cantidad).toFixed(2));
    
    // Aplicamos el IVA global si el producto grava impuestos
    const ivaLinea = producto.graba_iva ? Number((subtotalLinea * factorIva).toFixed(2)) : 0.0;

    subtotal += subtotalLinea;
    ivaTotal += ivaLinea;

    detallesConDatos.push({
      productoId: producto.codigo,
      productoNombre: producto.nombre,
      cantidad: item.cantidad,
      pvpUnitario,
      grabaIva: producto.graba_iva,
      subtotal: subtotalLinea
    });
  }

  subtotal = Number(subtotal.toFixed(2));
  ivaTotal = Number(ivaTotal.toFixed(2));
  const total = Number((subtotal + ivaTotal).toFixed(2));

  // 3. Lógica Financiera y Cuentas por Cobrar
  const estadoPago = tipoPago === 'CREDITO' ? 'PENDIENTE_PAGO' : 'PAGADA';
  const saldoPendiente = tipoPago === 'CREDITO' ? total : 0.00;

  // 4. Guardar todo en una transacción atómica
  const resultado = await sequelize.transaction(async (t) => {
    
    // A. Bloquear y actualizar el secuencial legal
    const prefsTransaccion = await PreferenciaSistema.findByPk(1, { transaction: t, lock: true });
    prefsTransaccion.secuencialActual += 1;
    await prefsTransaccion.save({ transaction: t });

    const numeroFactura = `${prefsTransaccion.establecimiento}-${prefsTransaccion.facturero}-${String(prefsTransaccion.secuencialActual).padStart(9, '0')}`;

    // B. Crear Cabecera
    const nuevaFactura = await Factura.create({
      numeroFactura, 
      clienteId,
      sesionCajaId,     
      tipoPago,
      porcentajeIvaAplicado,
      subtotal,
      ivaTotal,      
      total,
      estadoPago,
      saldoPendiente,
      isPrinted: false
    }, { transaction: t });

    // C. Crear Detalles asociados
    const detallesCreados = await Promise.all(
      detallesConDatos.map((d) =>
        DetalleFactura.create({ ...d, facturaId: nuevaFactura.id }, { transaction: t })
      )
    );

    
    return { factura: nuevaFactura, detalles: detallesCreados };
  });
  
  // AUDITORIA: Registrar en PistaAuditoria la creación de la factura
  
  const facturaCompleta = {
    ...resultado.factura.toJSON(),
    detalles: resultado.detalles.map((d) => d.toJSON())
  };
  

  await registrarCardexVenta(facturaCompleta);

  // Si es a crédito, notificamos a CXC
  if (estadoPago === 'PENDIENTE_PAGO') {
    await cxcService.registrarCuentaPorCobrar(facturaCompleta, token);
  }

  return facturaCompleta;
}

async function listarFacturas(filtros = {}) {
  const where = construirWhere(filtros);
  const limit = filtros.limit ? parseInt(filtros.limit, 10) : 10;
  const offset = filtros.offset ? parseInt(filtros.offset, 10) : 0;

  let orderClause = [['fechaEmision', 'DESC']];

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
 * Bloquea la factura y la marca como impresa (Inmutable)
 */
async function bloquearEImprimirFactura(id, usuario) {
  const factura = await obtenerFacturaPorId(id);

  if (factura.isPrinted) {
    const error = new Error('La factura ya fue impresa previamente.');
    error.codigo = 409;
    throw error;
  }

  factura.isPrinted = true;
  await factura.save();

  // Registrar auditoría de impresión

  return factura;
}

/**
 * API Interna: Procesa un abono notificado por el Módulo CXC
 */
async function procesarAbono(id, montoPagado) {
  const factura = await Factura.findByPk(id);
  if (!factura) throw new Error('Factura no encontrada');

  if (factura.saldoPendiente <= 0) {
    throw new Error('Esta factura no tiene deudas pendientes');
  }

  const nuevoSaldo = Number((factura.saldoPendiente - montoPagado).toFixed(2));
  
  factura.saldoPendiente = nuevoSaldo < 0 ? 0 : nuevoSaldo;
  if (factura.saldoPendiente === 0) {
    factura.estadoPago = 'PAGADA';
  }

  await factura.save();
  return factura;
}

module.exports = {
  contarFacturasConFiltro,
  crearFactura,
  listarFacturas,
  obtenerFacturaPorId,
  bloquearEImprimirFactura,
  procesarAbono
};