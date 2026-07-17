const { Op } = require('sequelize');
const { sequelize, Caja, SesionCaja, Factura, DetalleFactura, Cliente, PreferenciaSistema } = require('../models');
const { validarDeudaCliente } = require('./external/cuentasxcobrar.service');
const { registrarKardexVenta, obtenerProductos } = require('./external/inventario.service');
const { registrarEvento } = require('./external/auditoria.service');
const { getCurrentUserId } = require('../utils/auth.utils');


const { getCurrentContext } = require('../store/contextStore');
const tiposPagoPermitidos = ['EFECTIVO', 'CREDITO'];

const idFuncionFacturaAuditoria = 21; // ID de la función de auditoría para facturas

function construirWhere(filtros = {}) {
  const where = {};

  if (filtros.estadoPago) where.estado = filtros.estadoPago;
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
async function crearFactura(datos) {
  const { clienteId, sesionCajaId, tipoPago, detalles } = datos;

  if (!tiposPagoPermitidos.includes(tipoPago)) {
    const error = new Error(`Tipo de pago no permitido. Use: ${tiposPagoPermitidos.join(', ')}.`);
    error.codigo = 400;
    throw error;
  }

  if (!detalles || detalles.length === 0) {
    const error = new Error('La factura debe tener al menos un producto');
    error.codigo = 400;
    throw error;
  }

  const context = getCurrentContext();
  const sesion = await SesionCaja.findByPk(sesionCajaId);
  if (!sesion) {
    const error = new Error('La sesión de caja especificada no existe.');
    error.codigo = 404;
    throw error;
  }
  
  if (sesion.estado !== 'ABIERTA') {
    const error = new Error('Operación denegada: La sesión de caja ya está cerrada.');
    error.codigo = 403;
    throw error;
  }
  
  if (sesion.usuarioId !== getCurrentUserId()) {  
    const error = new Error('Operación denegada: No puedes facturar en una caja asignada a otro cajero.');
    error.codigo = 403;
    throw error;
  }

  const cliente = await Cliente.findByPk(clienteId);
  if (!cliente) {
    const error = new Error('El cliente seleccionado no existe.');
    error.codigo = 404;
    throw error;
  }

  if (tipoPago === 'CREDITO') {
    if (cliente.tipoCliente !== 'CREDITO') {
      const error = new Error(`Operación denegada: El cliente ${cliente.nombre} solo tiene autorización para compras al CONTADO.`);
      error.codigo = 403;
      throw error;
    }
  
    const aptoParaCredito = await validarDeudaCliente(clienteId);
    if (!aptoParaCredito) {
      const error = new Error(`Operación denegada: El cliente ${cliente.nombre} alcanzó el límite de crédito.`);
      error.codigo = 403;
      throw error;
    }
  }

  // 1. Obtener configuraciones globales (IVA y Secuenciales)
  const preferencias = await PreferenciaSistema.findByPk(1);
  if (!preferencias) throw new Error('Configuración del sistema no encontrada');
  
  const porcentajeIva = Number(preferencias.porcentajeIva);
  const factorIva = porcentajeIva / 100;

  // =========================================================================
  // CAMBIO CLAVE: Obtener todo el catálogo de productos de una sola llamada HTTP
  // =========================================================================
  const catalogoProductos = await obtenerProductos();
  
  // Indexamos el catálogo en un Map para búsquedas ultrarrápidas por código
  const mapaProductos = new Map(catalogoProductos.map(p => [p.codigo, p]));
  // =========================================================================

  let subtotal = 0;
  let ivaTotal = 0;
  const detallesConDatos = [];

  // 2. Procesar cálculos por producto utilizando el catálogo local cargado en memoria
  for (const item of detalles) {
    // Buscamos el producto en nuestro Map de memoria en vez de consultar a la API por cada uno
    const producto = mapaProductos.get(item.codigoProducto);

    if (!producto) {
      const error = new Error(`El producto con código "${item.codigoProducto}" no existe en el Inventario.`);
      error.codigo = 404;
      throw error;
    }

    if (producto.estado && producto.estado.toLowerCase() === 'inactivo') {
      const error = new Error(`El producto "${producto.nombre}" no está disponible`);
      error.codigo = 400;
      throw error;
    }

    if (producto.stock_actual < item.cantidad) {
      const error = new Error(`Stock insuficiente para "${producto.nombre}". Stock disponible: ${producto.stock_actual}`);
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
      codigoProducto: producto.codigo,
      nombreProducto: producto.nombre,
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
  const estadoPago = tipoPago === 'CREDITO' ? 'PAGO_PENDIENTE' : 'PAGADA';
  const saldoPendiente = tipoPago === 'CREDITO' ? total : 0.00;

  // 4. Guardar todo en una transacción atómica
  const resultado = await sequelize.transaction(async (t) => {
    
    // A. Bloquear y actualizar el secuencial directamente en la CAJA
    const cajaTransaccion = await Caja.findByPk(sesion.cajaId, { transaction: t, lock: true });
    
    if (!cajaTransaccion) {
      throw new Error('La caja asociada a esta sesión no fue encontrada.');
    }

    cajaTransaccion.secuencialActual += 1;
    await cajaTransaccion.save({ transaction: t });

    // B. Armar el número de factura con los datos de la Caja
    const numeroFactura = `${cajaTransaccion.establecimiento}-${cajaTransaccion.puntoEmision}-${String(cajaTransaccion.secuencialActual).padStart(9, '0')}`;
    const fechaEmision = new Date().toISOString();
    
    // C. Crear Cabecera
    const nuevaFactura = await Factura.create({
      numeroFactura,
      fechaEmision,
      clienteId,
      sesionCajaId,     
      tipoPago,
      porcentajeIva,
      subtotal,
      ivaTotal,      
      total,
      estado: estadoPago,
      saldoPendiente,
      isPrinted: false
    }, { transaction: t });

    // D. Crear Detalles asociados
    const detallesCreados = await Promise.all(
      detallesConDatos.map((d) =>
        DetalleFactura.create({ ...d, facturaId: nuevaFactura.id }, { transaction: t })
      )
    );
    
    const data = { factura: nuevaFactura, detalles: detallesCreados };
    
    await registrarKardexVenta(data);

    return data;
  });
  
  registrarEvento({
    idFuncion: idFuncionFacturaAuditoria,
    accion: 'CREAR_FACTURA',
    descripcion: `Creación de factura ${resultado.factura.numeroFactura} para cliente ${cliente.nombre}`,
    observacion: `Detalles de la factura: ${JSON.stringify(detallesConDatos)}`
  });
  
  const facturaCompleta = {
    ...resultado.factura.toJSON(),
    detalles: resultado.detalles.map((d) => d.toJSON())
  };
  
  return facturaCompleta;
}

async function listarFacturas(filtros = {}) {
  const where = construirWhere(filtros);
  const limit = filtros.limit ? parseInt(filtros.limit, 10) : 10;
  const offset = filtros.offset ? parseInt(filtros.offset, 10) : 0;

  let orderClause = [['fechaEmision', 'DESC']];

  if (filtros.orderBy && filtros.orderBy.length > 0) {
    orderClause = filtros.orderBy.map(item => {
      const columnaBD = item.campo === 'estadoPago' ? 'estado' : (item.campo || 'fechaEmision'); 
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
async function bloquearEImprimirFactura(id) {
  const factura = await obtenerFacturaPorId(id);

  if (factura.isPrinted) {
    const error = new Error('La factura ya fue impresa previamente.');
    error.codigo = 409;
    throw error;
  }

  factura.isPrinted = true;
  const resultado = await factura.save();

  if (!resultado) {
    const error = new Error('Error al intentar bloquear e imprimir la factura.');
    error.codigo = 500;
    throw error;
  }

  const context = getCurrentContext();
  const usuario = context ? context.username : 'Desconocido';

  registrarEvento({
    idFuncion: idFuncionFacturaAuditoria,
    accion: 'BLOQUEAR_IMPRIMIR_FACTURA',
    descripcion: `Factura ${factura.numeroFactura} bloqueada e impresa por usuario ${usuario}`,
    observacion: `Factura ID: ${factura.id}, Cliente: ${factura.clienteId}`
  });

  return factura;
}

/**
 * API Interna: Procesa un abono notificado por el Módulo CXC
 */
async function procesarAbono(id, montoPagado) {
  if (montoPagado <= 0) {
    const error = new Error('El monto pagado debe ser mayor a cero.');
    error.codigo = 400;
    throw error;
  }

  const factura = await Factura.findByPk(id);
  if (!factura) {
    const error = new Error('Factura no encontrada');
    error.codigo = 404;
    throw error;
  }

  if (factura.saldoPendiente <= 0) {
    const error = new Error('Esta factura no tiene deudas pendientes');
    error.codigo = 409;
    throw error;
  }

  const nuevoSaldo = Number((factura.saldoPendiente - montoPagado).toFixed(2));
  
  factura.saldoPendiente = nuevoSaldo < 0 ? 0 : nuevoSaldo;
  if (factura.saldoPendiente === 0) {
    factura.estado = 'PAGADA';
  }

  await factura.save();
  return factura;
}

async function obtenerFacturasPendientesPorCliente(clienteId) {
  return Factura.findAll({
    where: {
      clienteId,
      estado: 'PAGO_PENDIENTE'
    },
    order: [['fechaEmision', 'DESC']],
    include: [
      { model: DetalleFactura, as: 'detalles' },
      { model: Cliente, as: 'cliente', attributes: ['id', 'nombre', 'cedula', 'tipoCliente'] }
    ]
  });
}

module.exports = {
  contarFacturasConFiltro,
  crearFactura,
  listarFacturas,
  obtenerFacturaPorId,
  bloquearEImprimirFactura,
  procesarAbono,
  obtenerFacturasPendientesPorCliente
};
