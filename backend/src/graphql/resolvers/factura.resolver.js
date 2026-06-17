const facturaService = require('../../services/factura.service');
const inventarioService = require('../../services/inventario.service');
const PistaAuditoria = require('../../models/pistaAuditoria.model');

function requiereAuth(context) {
  if (!context.usuario) {
    const e = new Error('No autorizado: se requiere JWT válido');
    e.extensions = { code: 'UNAUTHENTICATED' };
    throw e;
  }
}

function mapearFactura(f) {
  const data = f.toJSON ? f.toJSON() : f;
  return {
    id: data.id,
    numeroFactura: data.numero_factura,
    clienteId: data.cliente_id,
    cliente: data.cliente
      ? {
          id: data.cliente.id,
          nombre: data.cliente.nombre,
          cedula: data.cliente.cedula,
          tipoCliente: data.cliente.tipo_cliente
        }
      : null,
    tipoPago: data.tipo_pago,
    fechaEmision: data.fecha_emision,
    subtotal: Number(data.subtotal),
    totalIva: Number(data.total_iva),
    total: Number(data.total),
    estado: data.estado,
    detalles: (data.detalles || []).map((d) => ({
      id: d.id,
      productoCodigo: d.producto_id,   // "PRD-0003"
      productoNombre: d.producto_nombre,
      cantidad: d.cantidad,
      precioUnitario: Number(d.precio_unitario),
      grabaIva: d.graba_iva,
      subtotalLinea: Number(d.subtotal_linea)
    }))
  };
}

const resolvers = {
  Query: {
    facturas: async (_, args, ctx) => {
      requiereAuth(ctx);
      const lista = await facturaService.listarFacturas({
        estado: args.estado,
        cliente_id: args.clienteId,
        tipo_pago: args.tipoPago
      });
      return lista.map(mapearFactura);
    },

    factura: async (_, { id }, ctx) => {
      requiereAuth(ctx);
      const f = await facturaService.obtenerFacturaPorId(id);
      return mapearFactura(f);
    },
  },

  Mutation: {
    crearFactura: async (_, { input }, ctx) => {
      requiereAuth(ctx);
      const datos = {
        cliente_id: input.clienteId,
        tipo_pago: input.tipoPago,
        detalles: input.detalles.map((d) => ({
          producto_codigo: d.productoCodigo,
          cantidad: d.cantidad
        }))
      };
      const f = await facturaService.crearFactura(datos, ctx.usuario, ctx.token);
      return mapearFactura(f);
    },

    actualizarEstadoFactura: async (_, { id, estado }, ctx) => {
      requiereAuth(ctx);
      const f = await facturaService.actualizarEstadoFactura(id, estado, ctx.usuario);
      return mapearFactura(f);
    }
  }
};

module.exports = resolvers;
