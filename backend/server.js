require('dotenv').config();
const crearApp = require('./src/app');
const { sequelize } = require('./src/models');
const ejecutarSeeders = require('./src/config/seeders');

const PORT = process.env.PORT || 3001;

async function iniciar() {
  await sequelize.authenticate();
  console.log('✅ Conexión a la base de datos establecida');

  await sequelize.sync({ force: false, alter: true });
  console.log('✅ Tablas de Facturación sincronizadas');

  await ejecutarSeeders();
  console.log('✅ Seeders aplicados');

  const app = await crearApp();

  app.listen(PORT, () => {
    console.log(`   GraphQL Playground: http://localhost:${PORT}/graphql`);
    console.log(`   Documentación: http://localhost:${PORT}/docs`);
  });
}

iniciar().catch((err) => {
  console.error('Error al iniciar:', err);
  process.exit(1);
});
