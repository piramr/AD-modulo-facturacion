const axios = require('axios');
const { getCurrentToken } = require('../../utils/auth.utils');

const clienteInventario = axios.create({
  baseURL: process.env.INVENTARIO_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.INVENTARIO_API_KEY
  }
});


async function obtenerProductos() {
  try {
    const respuesta = await clienteInventario.get(`/productos/catalogo`);
    
    const productos = respuesta.data?.data;

    if (!productos || !Array.isArray(productos)) {
      const error = new Error(`No se pudo obtener el catálogo de productos de Inventario`);
      error.codigo = 404;
      throw error;
    }

    return productos; // Retorna el array completo de productos

  } catch (error) {
    if (error.codigo) throw error;

    if (error.response?.status === 404) {
      const e = new Error(`El catálogo de productos no existe en Inventario`);
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

async function registrarKardexVenta(facturaCompleta) {
  try {
    const body = buildBodyForKardexVenta(facturaCompleta);
    const respuesta = await clienteInventario.post('/kardex/movimientos', body);
    return respuesta.data;

  } catch (error) {
    if (error.response?.status === 400) {
      const e = new Error(`Error en la solicitud de kardex de venta: ${error.response.data?.message || 'Solicitud inválida'}`);
      e.codigo = 400;
      throw e;
    }
    throw new Error(`No se pudo conectar con el módulo de Inventario: ${error.message}`);
  }
}

function buildBodyForKardexVenta(facturaCompleta) {
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

module.exports = { obtenerProductos, registrarKardexVenta };
