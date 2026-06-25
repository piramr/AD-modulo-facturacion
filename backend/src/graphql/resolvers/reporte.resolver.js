const reporteClienteService = require('../../services/reporteCliente.service');
const reporteFacturaService = require('../../services/reporteFactura.service');

function requiereAuth(context) {
  if (!context.usuario) {
    const error = new Error('No autorizado: se requiere JWT valido');
    error.extensions = { code: 'UNAUTHENTICATED' };
    throw error;
  }
}

const resolvers = {
  Query: {
    reporteClientes: async (_, args, ctx) => {
      requiereAuth(ctx);
      const filter = args.filter || {};
      const reporte = await reporteClienteService.obtenerDatosReporteClientes({
        estado: filter.estado,
        cedula: filter.cedula,
        nombre: filter.nombre,
        tipoCliente: filter.tipoCliente,
        search: filter.search,
        page: args.page,
        limit: args.limit
      });

      return {
        ...reporte,
        message: 'Reporte de clientes generado con exito'
      };
    },

    reporteFacturas: async (_, args, ctx) => {
      requiereAuth(ctx);
      const filter = args.filter || {};
      const reporte = await reporteFacturaService.obtenerDatosReporteFacturas({
        estado: filter.estado,
        clienteId: filter.clienteId,
        tipoPago: filter.tipoPago,
        search: filter.search,
        page: args.page,
        limit: args.limit
      });

      return {
        ...reporte,
        message: 'Reporte de facturas generado con exito'
      };
    }
  }
};

module.exports = resolvers;
