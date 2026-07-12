const axios = require('axios');

const clienteCXC = axios.create({
  baseURL: process.env.CUENTASXCOBRAR_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    'api-key': process.env.CUENTASXCOBRAR_API_KEY
  }
});

async function registrarCuentaPorCobrar(factura) {
  try {
    const body = {
      factura_id: factura.id,
      numero_factura: factura.numeroFactura,
      cliente_id: factura.clienteId,
      tipo_pago: factura.tipoPago,
      total: factura.total,
      fecha_emision: factura.fechaEmision
    };

    const respuesta = await clienteCXC.post('/cuentas-por-cobrar', body);
    if (respuesta.status === 201) {
      console.log(`Cuenta por cobrar registrada en CXC para factura ${factura.numeroFactura}`);
    }

  } catch (error) {
    console.error('No se pudo registrar cuenta por cobrar en CXC:', error.message);
  }
}

async function validarDeudaCliente(clienteId) {
  try {
    const respuesta = await clienteCXC.get(`/cxc/validador-deuda/${clienteId}`);
    return respuesta.estadoCliente === 'APTO_PARA_CREDITO';

  } catch (error) {
    console.error('No se pudo verificar la deuda del cliente en Cuentas por Cobrar:', error.message);
    throw error;
  }
}

module.exports = { registrarCuentaPorCobrar, validarDeudaCliente };
