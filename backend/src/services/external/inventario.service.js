const axios = require('axios');
const { getCurrentToken } = require('../../utils/auth.utils');

const clienteInventario = axios.create({
  baseURL: process.env.INVENTARIO_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
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
  try {
    const body = buildBodyForCardexVenta(facturaCompleta);
    const respuesta = await clienteInventario.post('/cardex/movimientos', body, {
      headers: {
        'x-api-key': process.env.INVENTARIO_API_KEY
      }
    });
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

function buildBodyForCardexVenta(facturaCompleta) {
  const body = {
    tipoMovimiento: 'VENTA',
    documentoReferencia: facturaCompleta.factura.numeroFactura,
    fechaMovimiento: facturaCompleta.factura.fechaEmision,
    detalles: facturaCompleta.detalles.map(item => {
      const pvpUnitario = Number(item.pvpUnitario) || 0;
      const porcentajeIva = Number(facturaCompleta.factura.porcentajeIva) || 0;
      const grabaIva = item.grabaIva || item.graba_iva || false;
      const valorIva = grabaIva ? (pvpUnitario * porcentajeIva / 100) : 0;
      const precioVentaConIva = Number((pvpUnitario + valorIva).toFixed(2));

      return {
        codigoProducto: item.codigoProducto,
        cantidad: Number(item.cantidad) || 0,
        constoUnitario: pvpUnitario, // Precio sin IVA
        precioVenta: precioVentaConIva, // PVP con IVA incluido y redondeado a 2 decimales
        descripcion: `Venta de producto en factura "${facturaCompleta.factura.numeroFactura}"`
      };
    })
  };

  return body;
}

module.exports = { obtenerProductoPorCodigo, registrarCardexVenta };
