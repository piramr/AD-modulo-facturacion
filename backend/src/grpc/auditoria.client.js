const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const PROTO_PATH = path.join(__dirname, 'auditoria.proto');
let client = null;

function obtenerCliente() {
  if (client) return client;
  try {
    const pkgDef = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true, longs: String, enums: String, defaults: true, oneofs: true
    });
    
    const proto = grpc.loadPackageDefinition(pkgDef)['auditoria'];
    
    // Instanciamos el servicio 'AuditoriaService'
    client = new proto['AuditoriaService'](
      process.env.SEGURIDAD_URL,
      grpc.credentials.createInsecure()
    );
    return client;
  } catch (err) {
    console.error('No se pudo inicializar cliente gRPC de auditoria:', err.message);
    return null;
  }
}

module.exports = { obtenerCliente };
