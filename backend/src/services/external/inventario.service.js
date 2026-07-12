const axios = require('axios');

const clienteInventario = axios.create({
  baseURL: process.env.INVENTARIO_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    'api-key': process.env.INVENTARIO_API_KEY
  }
});


async function obtenerProductoPorCodigo(codigo) {
  try {
    const respuesta = await clienteInventario.get(`/productos/${codigo}`);
    const producto = respuesta.data?.data;

    if (!producto) {
      const error = new Error(`Producto "${codigo}" no encontrado en Inventario`);
      error.codigo = 404;
      throw error;
    }

    return producto;

  } catch (error) {
    if (error.codigo) throw error;

    if (error.response?.status === 404) {
      const e = new Error(`Producto "${codigo}" no existe en Inventario`);
      e.codigo = 404;
      throw e;
    }

    if (error.response?.status === 401) {
      const e = new Error('Token inválido al consultar Inventario');
      e.codigo = 401;
      throw e;
    }

    const e = new Error(`No se pudo conectar con el módulo de Inventario: ${error.message}`);
    e.codigo = 503;
    throw e;
  }
}

async function registrarCardexVenta(facturaCompleta) {
  const body = {
    tipoMovimiento: 'VENTA',
    documentoReferencia: facturaCompleta.numeroFactura,
    fechaMovimiento: facturaCompleta.fechaEmision,
    detalles: facturaCompleta.detalles.map(item => ({
      codigoProducto: item.codigoProducto,
      cantidad: item.cantidad,
      precioVenta: Number(item.pvpUnitario + (item.pvpUnitario * facturaCompleta.porcentajeIva/100)).toFixed(2) // Precio con IVA incluido
    }))
  }

  try {
    const respuesta = await clienteInventario.post('/cardex/movimientos', body);
    return respuesta.data;

  } catch (error) {
    if (error.response?.status === 400) {
      const e = new Error(`Error en la solicitud de cardex de venta: ${error.response.data?.message || 'Solicitud inválida'}`);
      e.codigo = 400;
      throw e;
    }
    throw new Error(`No se pudo conectar con el módulo de Inventario: ${error.message}`);
  }
}

module.exports = { obtenerProductoPorCodigo, registrarCardexVenta };
