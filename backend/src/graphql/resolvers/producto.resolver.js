const inventarioService = require('../../services/inventario.service');

function mapearProducto(producto) {
  return {
    codigo: producto.codigo,
    nombre: producto.nombre,
    descripcion: producto.descripcion,
    stockActual: producto.stock_actual,
    pvp: producto.pvp,
    grabaIva: producto.graba_iva,
    porcentajeIvaAplicado: producto.porcentaje_iva_aplicado
  };
}

const resolvers = {
  Query: {
    productos: async (_, __, ctx) => {
      const productos = await inventarioService.obtenerCatalogo(ctx.token);
      return productos.map(mapearProducto);
    }
  }
};

module.exports = resolvers;
