const grpc = require('@grpc/grpc-js');
const { obtenerCliente } = require('../../grpc/auditoria.client.js');
const { getCurrentContext } = require('../../store/contextStore.js');

/**
 * Servicio encargado de formatear, autenticar y enviar la auditoría por gRPC de fondo
 * @param {Object} datos - Objeto de negocio con idFuncion, accion, descripcion y observacion
 */
function registrarEvento({ idFuncion, accion, descripcion, observacion }) {
  const clienteRpc = obtenerCliente();
  if (!clienteRpc) return;

  // Extraemos de manera global el token y la IP de la petición concurrente
  const contexto = getCurrentContext();

  // Inyección obligatoria de la API-Key por metadatos
  const meta = new grpc.Metadata();
  meta.add('x-api-key', process.env.SEGURIDAD_API_KEY || '');

  // Mapeamos los datos exactamente a los campos del AuditRequest de tu .proto
  const payload = {
    token: String(contexto.token || ''),
    idFuncion: parseInt(idFuncion || 0, 10), // int32
    accion: String(accion || ''),
    descripcion: String(descripcion || ''),
    observacion: String(observacion || ''),
    ipUsuario: String(contexto.ip || '127.0.0.1')
  };

  // Ejecutamos el método 'createAuditLog' usando la sintaxis segura de corchetes
  clienteRpc['createAuditLog'](
    payload,
    meta,
    (err, resp) => {
      if (err) {
        if (err.code === grpc.status.UNAUTHENTICATED) {
          console.error('[AUDIT SERVICE]: API-Key rechazada o inválida por el servidor gRPC.');
        } else {
          console.error('[AUDIT SERVICE]: Error de comunicación gRPC:', err.message);
        }
        return;
      }
      
      // Mapea la respuesta a 'success' y 'message' tal como lo especifica tu AuditResponse
      console.log(`[AUDIT SERVICE SUCCESS]: [Acción: ${accion}] — Éxito: ${resp?.success} — Mensaje: ${resp?.message}`);
    }
  );
}

module.exports = { registrarEvento };
