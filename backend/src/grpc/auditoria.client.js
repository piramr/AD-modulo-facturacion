const path = require('path');
const protobuf = require('protobufjs');

const PROTO_PATH = path.join(__dirname, 'auditoria.proto');
let tiposCompilados = null;

/**
 * Carga el archivo .proto y expone los tipos de mensajes preparados para serializar
 */
async function obtenerEsquemasProtobuf() {
  if (tiposCompilados) return tiposCompilados;
  
  try {
    // Cargamos el contrato directamente en memoria
    const root = await protobuf.load(PROTO_PATH);
    
    tiposCompilados = {
      AuditoriaRequest: root.lookupType("AuditoriaRequest"),
      AuditoriaResponse: root.lookupType("AuditoriaResponse")
    };
    
    return tiposCompilados;
  } catch (err) {
    console.error('No se pudo inicializar los esquemas Protobuf de auditoria:', err.message);
    return null;
  }
}

module.exports = { obtenerEsquemasProtobuf };
