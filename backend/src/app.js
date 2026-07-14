const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { ApolloServer } = require('apollo-server-express');

const { contextStorage, getCurrentContext } = require('./store/contextStore');
const schema = require('./graphql/schema');

const reportesRoutes = require('./routes/reportes.routes');
const utilRoutes = require('./routes/util.routes');

async function crearApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(morgan('dev'));

  app.use((req, res, next) => {
    const authHeader = req.headers.authorization;
    const tokenLimpio = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    const ipUsuario = req.headers['x-forwarded-for']?.split(',')[0] || req.ip || req.socket.remoteAddress || '127.0.0.1';

    const storeData = {
      token: tokenLimpio,
      ip: ipUsuario,
      user: null
    };

    contextStorage.run(storeData, next);
  });

  app.use(utilRoutes);
  app.use('/api/reportes', reportesRoutes);

  const apolloServer = new ApolloServer({
    schema,
    introspection: true,
    playground: {
      settings: {
        'schema.polling.enable': true,
      },
    },
    context: () => {
      return getCurrentContext() || {};
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
