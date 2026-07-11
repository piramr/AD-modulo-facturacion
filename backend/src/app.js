const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const authController = require('./controllers/authController');
const { ApolloServer } = require('apollo-server-express');

const schema = require('./graphql/schema');

const { obtenerUsuarioDesdeToken, verificarToken, verificarRol } = require('./middlewares/auth.middleware');
const { verificarApiKey } = require('./middlewares/apiKey.middleware');
const reporteFacturaService = require('./services/reporteFactura.service');
const reporteClienteService = require('./services/reporteCliente.service');

// Definir relación Factura ↔ Cliente (misma BD)
const Factura = require('./models/factura.model');
const Cliente = require('./models/cliente.model');
const { status } = require('@grpc/grpc-js');
Factura.belongsTo(Cliente, { foreignKey: 'cliente_id', as: 'cliente' });
Cliente.hasMany(Factura, { foreignKey: 'cliente_id', as: 'facturas' });

async function crearApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(morgan('dev'));

  // ── Health check ────────────────────────────────────────────────────────
  app.get('/health', (_, res) => {
    res.status(200).json({ status: 'ok', servicio: 'modulo-facturacion' });
  });

  // Obtener test token de 24h
  app.get('/auth/test-token', authController.getTestToken);
  app.use('/docs', express.static(path.join(__dirname, '../public/docs'), {
    extensions: ['html', 'htm']
  }));
  app.get('/docs/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/docs', 'index.html'), (err) => {
      if (err) {
        res.status(404).send("Portal de documentación no encontrado.");
      }
    });
  });

  // 3. Fallback por si entran a /docs sin la barra diagonal al final
  app.get('/docs', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/docs', 'index.html'));
  });

  // ── REST: webhook que Inventario llama con API-Key ───────────────────────
  app.post('/api/inventario/webhooks/producto-actualizado', verificarApiKey, (req, res) => {
    const { codigo, nombre, pvp, stock_actual } = req.body;
    console.log(`📦 Producto actualizado por Inventario: ${codigo} (${nombre}) pvp=${pvp} stock=${stock_actual}`);
    res.status(200).json({ recibido: true });
  });

  // ── REST: endpoint que CXC puede consultar con API-Key ──────────────────
  const facturaService = require('./services/factura.service');
  app.get('/api/cxc/facturas/:id', verificarApiKey, async (req, res) => {
    try {
      const f = await facturaService.obtenerFacturaPorId(req.params.id);
      const data = f.toJSON();
      res.status(200).json({
        id: data.id,
        numeroFactura: data.numero_factura,
        clienteId: data.cliente_id,
        tipoPago: data.tipo_pago,
        total: data.total,
        estado: data.estado,
        fechaEmision: data.fecha_emision
      });
    } catch (err) {
      res.status(err.codigo || 500).json({ error: err.message });
    }
  });

  // ── Apollo Server (GraphQL) ──────────────────────────────────────────────
  // 2. En la configuración de Apollo, fusiónalos así:
  app.get(
    '/api/reportes/facturas/:id/pdf',
    verificarToken,
    verificarRol(['admin', 'facturador']),
    async (req, res) => {
      try {
        const reporte = await reporteFacturaService.generarPdfFactura(req.params.id, req.usuario);

        if (reporte.durationMs > 30000) {
          return res.status(504).json({
            error: 'La generacion del PDF supero los 30 segundos',
            durationMs: reporte.durationMs
          });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${reporte.filename}"`);
        res.setHeader('Content-Length', reporte.buffer.length);
        res.setHeader('X-Generation-Time-Ms', String(reporte.durationMs));
        res.setHeader('X-Report-Message', reporte.message);
        return res.status(200).send(reporte.buffer);
      } catch (err) {
        return res.status(err.codigo || 500).json({ error: err.message });
      }
    }
  );

  app.get(
    '/api/reportes/facturas',
    verificarToken,
    verificarRol(['admin', 'facturador']),
    async (req, res) => {
      try {
        if (req.query.format === 'pdf') {
          const reporte = await reporteFacturaService.generarPdfReporteFacturas(req.query);

          if (reporte.durationMs > 30000) {
            return res.status(504).json({
              error: 'La generacion del reporte supero los 30 segundos',
              durationMs: reporte.durationMs
            });
          }

          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `inline; filename="${reporte.filename}"`);
          res.setHeader('Content-Length', reporte.buffer.length);
          res.setHeader('X-Generation-Time-Ms', String(reporte.durationMs));
          res.setHeader('X-Report-Message', reporte.message);
          return res.status(200).send(reporte.buffer);
        }

        const reporte = await reporteFacturaService.obtenerDatosReporteFacturas(req.query);

        if (reporte.durationMs > 30000) {
          return res.status(504).json({
            error: 'La generacion del reporte supero los 30 segundos',
            durationMs: reporte.durationMs
          });
        }

        return res.status(200).json({
          ...reporte,
          message: 'Reporte de facturas generado con exito'
        });
      } catch (err) {
        return res.status(err.codigo || 500).json({ error: err.message });
      }
    }
  );

  app.get(
    '/api/reportes/clientes',
    verificarToken,
    verificarRol(['admin', 'facturador']),
    async (req, res) => {
      try {
        if (req.query.format === 'pdf') {
          const reporte = await reporteClienteService.generarPdfClientes(req.query);

          if (reporte.durationMs > 30000) {
            return res.status(504).json({
              error: 'La generacion del reporte supero los 30 segundos',
              durationMs: reporte.durationMs
            });
          }

          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `inline; filename="${reporte.filename}"`);
          res.setHeader('Content-Length', reporte.buffer.length);
          res.setHeader('X-Generation-Time-Ms', String(reporte.durationMs));
          res.setHeader('X-Report-Message', 'Reporte de clientes generado con exito');
          return res.status(200).send(reporte.buffer);
        }

        const reporte = await reporteClienteService.obtenerDatosReporteClientes(req.query);

        if (reporte.durationMs > 30000) {
          return res.status(504).json({
            error: 'La generacion del reporte supero los 30 segundos',
            durationMs: reporte.durationMs
          });
        }

        return res.status(200).json({
          ...reporte,
          message: 'Reporte de clientes generado con exito'
        });
      } catch (err) {
        return res.status(err.codigo || 500).json({ error: err.message });
      }
    }
  );

const apolloServer = new ApolloServer({
  schema,
  introspection: true,
  playground: {
    settings: {
      'schema.polling.enable': true,
    },
  },
  context: ({ req }) => {
    const authHeader = req.headers.authorization;
    return {
      usuario: obtenerUsuarioDesdeToken(authHeader),
      token: authHeader
    };
  },
  formatError: (err) => {
      const codigoOriginal = err.originalError?.code || err.extensions?.code || 'INTERNAL_SERVER_ERROR';
      const statusOriginal = err.originalError?.status || err.extensions?.status || 500;

      return {
        message: err.message,
        code: codigoOriginal,
        status: statusOriginal,
      };
    }
});

  await apolloServer.start();
  apolloServer.applyMiddleware({ app, path: '/graphql' });

  // ── 404 y error global ──────────────────────────────────────────────────
  app.use((req, res) => {
    res.status(404).json({ error: `Ruta ${req.method} ${req.originalUrl} no encontrada` });
  });
  app.use((err, req, res, next) => {
    console.error('Error no controlado:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  });

  return app;
}

module.exports = crearApp;
