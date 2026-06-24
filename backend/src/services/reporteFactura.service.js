const PDFDocument = require('pdfkit');
const facturaService = require('./factura.service');
const auditoriaService = require('./auditoria.service');

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatDate(value) {
  return new Date(value).toLocaleString('es-EC', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

function textOrDash(value) {
  return value || '-';
}

function mapearFacturaReporte(factura) {
  const data = factura.toJSON ? factura.toJSON() : factura;

  return {
    id: data.id,
    numeroFactura: data.numero_factura,
    clienteId: data.cliente_id,
    clienteNombre: data.cliente?.nombre || null,
    clienteCedula: data.cliente?.cedula || null,
    tipoPago: data.tipo_pago,
    fechaEmision: data.fecha_emision,
    subtotal: Number(data.subtotal),
    totalIva: Number(data.total_iva),
    total: Number(data.total),
    estado: data.estado,
    articulos: (data.detalles || []).map((detalle) => ({
      productoCodigo: detalle.producto_id,
      productoNombre: detalle.producto_nombre,
      cantidad: detalle.cantidad,
      precioUnitario: Number(detalle.precio_unitario),
      subtotalLinea: Number(detalle.subtotal_linea)
    }))
  };
}

function drawText(doc, text, x, y, options = {}) {
  doc.text(String(text ?? ''), x, y, options);
}

function drawInvoiceTable(doc, detalles, startY) {
  const columns = {
    codigo: 50,
    producto: 120,
    cantidad: 315,
    precio: 370,
    subtotal: 455
  };

  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor('#111827');

  drawText(doc, 'Codigo', columns.codigo, startY, { width: 65 });
  drawText(doc, 'Producto', columns.producto, startY, { width: 175 });
  drawText(doc, 'Cant.', columns.cantidad, startY, { width: 45, align: 'right' });
  drawText(doc, 'P. unit.', columns.precio, startY, { width: 65, align: 'right' });
  drawText(doc, 'Subtotal', columns.subtotal, startY, { width: 85, align: 'right' });

  doc
    .moveTo(50, startY + 16)
    .lineTo(545, startY + 16)
    .strokeColor('#d1d5db')
    .stroke();

  let y = startY + 26;

  doc.font('Helvetica').fontSize(9).fillColor('#1f2937');

  detalles.forEach((detalle) => {
    if (y > 720) {
      doc.addPage();
      y = 50;
    }

    drawText(doc, detalle.producto_id, columns.codigo, y, { width: 65 });
    drawText(doc, detalle.producto_nombre, columns.producto, y, { width: 175 });
    drawText(doc, detalle.cantidad, columns.cantidad, y, { width: 45, align: 'right' });
    drawText(doc, money(detalle.precio_unitario), columns.precio, y, { width: 65, align: 'right' });
    drawText(doc, money(detalle.subtotal_linea), columns.subtotal, y, { width: 85, align: 'right' });

    y += 24;
  });

  return y;
}

async function generarPdfFactura(facturaId, usuario = null) {
  const inicio = Date.now();
  const factura = await facturaService.obtenerFacturaPorId(facturaId);
  const data = factura.toJSON();

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const chunks = [];

  doc.on('data', (chunk) => chunks.push(chunk));

  const done = new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  doc
    .font('Helvetica-Bold')
    .fontSize(20)
    .fillColor('#111827')
    .text('Modulo de Facturacion', 50, 50);

  doc
    .fontSize(12)
    .fillColor('#374151')
    .text('Factura de venta', 50, 78);

  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor('#111827')
    .text(`Factura: ${data.numero_factura}`, 360, 50, { align: 'right' })
    .font('Helvetica')
    .fontSize(9)
    .fillColor('#4b5563')
    .text(`Estado: ${data.estado}`, 360, 68, { align: 'right' })
    .text(`Emision: ${formatDate(data.fecha_emision)}`, 320, 84, { align: 'right' });

  doc
    .moveTo(50, 115)
    .lineTo(545, 115)
    .strokeColor('#d1d5db')
    .stroke();

  doc.font('Helvetica-Bold').fontSize(11).fillColor('#111827').text('Cliente', 50, 138);
  doc.font('Helvetica').fontSize(10).fillColor('#374151');
  doc.text(`Nombre: ${textOrDash(data.cliente?.nombre)}`, 50, 158);
  doc.text(`Cedula: ${textOrDash(data.cliente?.cedula)}`, 50, 176);
  doc.text(`Tipo cliente: ${textOrDash(data.cliente?.tipo_cliente)}`, 50, 194);

  doc.font('Helvetica-Bold').fontSize(11).fillColor('#111827').text('Pago', 360, 138);
  doc.font('Helvetica').fontSize(10).fillColor('#374151');
  doc.text(`Tipo pago: ${data.tipo_pago}`, 360, 158);
  doc.text(`Documento bloqueado para edicion`, 360, 176, { width: 185 });

  doc.font('Helvetica-Bold').fontSize(12).fillColor('#111827').text('Detalle', 50, 235);
  const finalY = drawInvoiceTable(doc, data.detalles || [], 260);

  const totalsY = Math.max(finalY + 20, 370);
  doc
    .moveTo(350, totalsY)
    .lineTo(545, totalsY)
    .strokeColor('#d1d5db')
    .stroke();

  doc.font('Helvetica').fontSize(10).fillColor('#374151');
  doc.text('Subtotal', 370, totalsY + 14, { width: 80 });
  doc.text(money(data.subtotal), 455, totalsY + 14, { width: 90, align: 'right' });
  doc.text('IVA', 370, totalsY + 34, { width: 80 });
  doc.text(money(data.total_iva), 455, totalsY + 34, { width: 90, align: 'right' });
  doc.font('Helvetica-Bold').fontSize(12).fillColor('#111827');
  doc.text('Total', 370, totalsY + 58, { width: 80 });
  doc.text(money(data.total), 455, totalsY + 58, { width: 90, align: 'right' });

  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor('#6b7280')
    .text('Documento generado por el modulo de Facturacion.', 50, 790, {
      width: 495,
      align: 'center'
    });

  doc.end();

  const buffer = await done;

  if (usuario?.id) {
    await auditoriaService.registrarAuditoria({
      usuarioId: usuario.id,
      accion: 'FACTURA_IMPRESA',
      detalles: {
        factura_id: data.id,
        numero_factura: data.numero_factura,
        documento_bloqueado: true
      }
    });
  }

  return {
    buffer,
    durationMs: Date.now() - inicio,
    filename: `factura-${data.numero_factura}.pdf`,
    message: 'Factura impresa con exito'
  };
}

async function obtenerDatosReporteFacturas(query = {}) {
  const inicio = Date.now();
  const filtros = {
    estado: query.estado,
    cliente_id: query.clienteId,
    tipo_pago: query.tipoPago,
    search: query.search
  };
  const total = await facturaService.contarFacturasConFiltro(filtros);
  const limit = Math.min(parseInt(query.limit || total || 1000, 10), 1000);

  const resultado = await facturaService.listarFacturas({
    ...filtros,
    limit,
    offset: 0
  });

  return {
    totalCount: total,
    generatedAt: new Date().toISOString(),
    durationMs: Date.now() - inicio,
    items: (resultado.rows || []).map(mapearFacturaReporte)
  };
}

function drawReporteFacturasTable(doc, facturas, startY) {
  const columns = {
    numero: 35,
    cliente: 120,
    fecha: 245,
    articulos: 320,
    total: 500
  };

  doc.font('Helvetica-Bold').fontSize(8).fillColor('#111827');
  doc.text('Factura', columns.numero, startY, { width: 75 });
  doc.text('Cliente', columns.cliente, startY, { width: 115 });
  doc.text('Fecha', columns.fecha, startY, { width: 65 });
  doc.text('Articulos', columns.articulos, startY, { width: 170 });
  doc.text('Total', columns.total, startY, { width: 60, align: 'right' });
  doc.moveTo(35, startY + 15).lineTo(560, startY + 15).strokeColor('#d1d5db').stroke();

  let y = startY + 25;
  doc.font('Helvetica').fontSize(7).fillColor('#1f2937');

  facturas.forEach((factura) => {
    const articulos = factura.articulos
      .map((item) => `${item.productoNombre} x${item.cantidad}`)
      .join(', ');
    const rowHeight = Math.max(28, doc.heightOfString(articulos, { width: 170 }) + 8);

    if (y + rowHeight > 760) {
      doc.addPage();
      y = 45;
    }

    doc.text(factura.numeroFactura, columns.numero, y, { width: 75 });
    doc.text(textOrDash(factura.clienteNombre), columns.cliente, y, { width: 115 });
    doc.text(new Date(factura.fechaEmision).toLocaleDateString('es-EC'), columns.fecha, y, { width: 65 });
    doc.text(articulos || '-', columns.articulos, y, { width: 170 });
    doc.text(money(factura.total), columns.total, y, { width: 60, align: 'right' });

    y += rowHeight;
  });
}

async function generarPdfReporteFacturas(query = {}) {
  const reporte = await obtenerDatosReporteFacturas(query);
  const doc = new PDFDocument({ size: 'A4', margin: 35 });
  const chunks = [];

  doc.on('data', (chunk) => chunks.push(chunk));

  const done = new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  doc.font('Helvetica-Bold').fontSize(18).fillColor('#111827').text('Reporte de Facturas', 35, 45);
  doc.font('Helvetica').fontSize(9).fillColor('#4b5563');
  doc.text(`Generado: ${new Date(reporte.generatedAt).toLocaleString('es-EC')}`, 35, 72);
  doc.text(`Total facturas: ${reporte.totalCount}`, 35, 88);

  drawReporteFacturasTable(doc, reporte.items, 120);

  doc.end();
  const buffer = await done;

  return {
    ...reporte,
    buffer,
    filename: 'reporte-facturas.pdf',
    message: 'Reporte de facturas generado con exito'
  };
}

module.exports = {
  generarPdfFactura,
  obtenerDatosReporteFacturas,
  generarPdfReporteFacturas
};
