const PDFDocument = require('pdfkit');
const { Op } = require('sequelize');
const clienteService = require('./cliente.service');
const Factura = require('../models/factura.model');

function mapearCliente(cliente) {
  const data = cliente.toJSON ? cliente.toJSON() : cliente;

  return {
    id: data.id,
    cedula: data.cedula,
    nombre: data.nombre,
    fechaNacimiento: data.fecha_nacimiento,
    tipoCliente: data.tipo_cliente,
    direccion: data.direccion,
    telefono: data.telefono,
    email: data.email,
    estado: data.estado
  };
}

function construirFiltros(query = {}) {
  return {
    estado: query.estado,
    tipo_cliente: query.tipoCliente,
    search: query.search,
    nombre: query.nombre,
    cedula: query.cedula
  };
}

async function obtenerHistorialCompras(clienteIds = []) {
  if (clienteIds.length === 0) return {};

  const facturas = await Factura.findAll({
    where: { cliente_id: { [Op.in]: clienteIds } },
    attributes: ['cliente_id', 'total', 'fecha_emision']
  });

  return facturas.reduce((acc, factura) => {
    const data = factura.toJSON();
    const clienteId = data.cliente_id;

    if (!acc[clienteId]) {
      acc[clienteId] = {
        cantidadFacturas: 0,
        totalComprado: 0,
        ultimaCompra: null
      };
    }

    acc[clienteId].cantidadFacturas += 1;
    acc[clienteId].totalComprado = Number((acc[clienteId].totalComprado + Number(data.total)).toFixed(2));

    if (!acc[clienteId].ultimaCompra || new Date(data.fecha_emision) > new Date(acc[clienteId].ultimaCompra)) {
      acc[clienteId].ultimaCompra = data.fecha_emision;
    }

    return acc;
  }, {});
}

async function obtenerDatosReporteClientes(query = {}) {
  const inicio = Date.now();
  const filtros = construirFiltros(query);
  const total = await clienteService.contarClientesConFiltro(filtros);
  const limit = Math.min(parseInt(query.limit || total || 1000, 10), 1000);

  const resultado = await clienteService.listarClientes({
    ...filtros,
    limit,
    offset: 0
  });

  const items = (resultado.rows || []).map(mapearCliente);
  const historialPorCliente = await obtenerHistorialCompras(items.map((cliente) => cliente.id));

  return {
    totalCount: total,
    generatedAt: new Date().toISOString(),
    durationMs: Date.now() - inicio,
    items: items.map((cliente) => ({
      ...cliente,
      historialCompras: historialPorCliente[cliente.id] || {
        cantidadFacturas: 0,
        totalComprado: 0,
        ultimaCompra: null
      }
    }))
  };
}

function drawClienteTable(doc, clientes, startY) {
  const columns = {
    cedula: 35,
    nombre: 100,
    tipo: 210,
    telefono: 275,
    email: 340,
    compras: 455,
    total: 505
  };

  doc.font('Helvetica-Bold').fontSize(8).fillColor('#111827');
  doc.text('Cedula', columns.cedula, startY, { width: 65 });
  doc.text('Nombre', columns.nombre, startY, { width: 115 });
  doc.text('Tipo', columns.tipo, startY, { width: 60 });
  doc.text('Telefono', columns.telefono, startY, { width: 60 });
  doc.text('Email', columns.email, startY, { width: 105 });
  doc.text('Compras', columns.compras, startY, { width: 45, align: 'right' });
  doc.text('Total', columns.total, startY, { width: 55, align: 'right' });

  doc.moveTo(35, startY + 15).lineTo(560, startY + 15).strokeColor('#d1d5db').stroke();

  let y = startY + 25;
  doc.font('Helvetica').fontSize(7).fillColor('#1f2937');

  clientes.forEach((cliente) => {
    if (y > 760) {
      doc.addPage();
      y = 45;
    }

    doc.text(cliente.cedula, columns.cedula, y, { width: 65 });
    doc.text(cliente.nombre, columns.nombre, y, { width: 115 });
    doc.text(cliente.tipoCliente, columns.tipo, y, { width: 60 });
    doc.text(cliente.telefono, columns.telefono, y, { width: 60 });
    doc.text(cliente.email, columns.email, y, { width: 105 });
    doc.text(cliente.historialCompras.cantidadFacturas, columns.compras, y, { width: 45, align: 'right' });
    doc.text(`$${Number(cliente.historialCompras.totalComprado).toFixed(2)}`, columns.total, y, { width: 55, align: 'right' });
    y += 24;
  });
}

async function generarPdfClientes(query = {}) {
  const reporte = await obtenerDatosReporteClientes(query);
  const doc = new PDFDocument({ size: 'A4', margin: 35 });
  const chunks = [];

  doc.on('data', (chunk) => chunks.push(chunk));

  const done = new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  doc.font('Helvetica-Bold').fontSize(18).fillColor('#111827').text('Reporte de Clientes', 35, 45);
  doc.font('Helvetica').fontSize(9).fillColor('#4b5563');
  doc.text(`Generado: ${new Date(reporte.generatedAt).toLocaleString('es-EC')}`, 35, 72);
  doc.text(`Total clientes: ${reporte.totalCount}`, 35, 88);

  drawClienteTable(doc, reporte.items, 120);

  doc.end();
  const buffer = await done;

  return {
    ...reporte,
    buffer,
    filename: 'reporte-clientes.pdf'
  };
}

module.exports = {
  obtenerDatosReporteClientes,
  generarPdfClientes
};
