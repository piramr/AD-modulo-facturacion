const axios = require('axios');
const { obtenerEsquemasProtobuf } = require('../../grpc/auditoria.client.js');
const { getCurrentContext } = require('../../store/contextStore.js');

const URL_PROTOBUF = process.env.SEGURIDAD_URL;
const URL_GRAPHQL = process.env.SEGURIDAD_GRAPHQL_URL;
const API_KEY = process.env.SEGURIDAD_API_KEY;

async function enviarPorProtobuf(payload) {
  const esquemas = await obtenerEsquemasProtobuf();
  if (!esquemas) throw new Error('Esquemas Protobuf no disponibles');

  const payloadProto = {
    token: payload.token,
    id_funcion: payload.idFuncion,
    accion: payload.accion,
    descripcion: payload.descripcion,
    observacion: payload.observacion,
    ip_usuario: payload.ipUsuario
  };

  const errorValidacion = esquemas.AuditoriaRequest.verify(payloadProto);
  if (errorValidacion) throw new Error(`Validación de contrato fallida: ${errorValidacion}`);

  const mensajeBinario = esquemas.AuditoriaRequest.encode(payloadProto).finish();

  const respuesta = await axios.post(URL_PROTOBUF, mensajeBinario, {
    headers: {
      'Content-Type': 'application/x-protobuf',
      'x-api-key': API_KEY
    },
    responseType: 'arraybuffer'
  });

  const respuestaDecodificada = esquemas.AuditoriaResponse.decode(new Uint8Array(respuesta.data));
  return respuestaDecodificada;
}

async function enviarPorGraphQL(payload) {
  const queryMutation = `
    mutation {
      createAuditLog(
        token: "${payload.token}",
        idFuncion: ${payload.idFuncion},
        accion: "${payload.accion}",
        descripcion: "${payload.descripcion}",
        observacion: "${payload.observacion}",
        ipUsuario: "${payload.ipUsuario}"
      ) {
        success
        message
      }
    }
  `;

  const respuesta = await axios.post(URL_GRAPHQL, { query: queryMutation }, {
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY
    }
  });

  if (respuesta.data?.errors) {
    throw new Error(`GraphQL Errors: ${JSON.stringify(respuesta.data.errors)}`);
  }

  return respuesta.data?.data?.createAuditLog;
}


async function registrarEvento({ idFuncion, accion, descripcion, observacion }) {
  const contexto = getCurrentContext() || {};
  
  // Estructura de datos limpia y unificada
  const payloadUnificado = {
    token: String(contexto.token || ''),
    idFuncion: parseInt(idFuncion || 0, 10),
    accion: String(accion || ''),
    descripcion: String(descripcion || ''),
    observacion: String(observacion || ''),
    ipUsuario: String(contexto.ip || '127.0.0.1')
  };

  // INTENTO 1: Intentar registrar por Protocol Buffers (Más rápido, óptimo en red)
  try {
    const resProto = await enviarPorProtobuf(payloadUnificado);
    console.log(`[AUDIT PROTOBUF SUCCESS]: [${accion}] — Éxito: ${resProto.success} — ${resProto.message}`);
    console.log('DATA AUDIT:', payloadUnificado);
    return; // Si funciona, termina el proceso de forma exitosa
  } catch (errProto) {
    console.warn(`[AUDIT WARN]: Falló el envío principal por Protobuf (${errProto.message}). Iniciando contingencia por GraphQL...`);
  }

  // INTENTO 2: Fallback automático por GraphQL si el canal binario falló
  try {
    const resGraph = await enviarPorGraphQL(payloadUnificado);
    console.log(`[AUDIT GRAPHQL FALLBACK SUCCESS]: [${accion}] — Éxito: ${resGraph?.success} — ${resGraph?.message}`);
    console.log('DATA AUDIT:', payloadUnificado);
  } catch (errGraph) {
    console.error(`[AUDIT CRITICAL ERROR]: Ambos métodos de auditoría han fallado.`);
    console.error(`-> Error GraphQL: ${errGraph.message}`);
  }
}

module.exports = { registrarEvento };
