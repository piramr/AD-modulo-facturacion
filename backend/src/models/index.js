const sequelize = require('../config/db');

// Importaciones
const PreferenciaSistema = require('./preferenciaSistema.model');
const Caja = require('./caja.model');
const SesionCaja = require('./sesionCaja.model');
const Cliente = require('./cliente.model');
const Factura = require('./factura.model');
const DetalleFactura = require('./detalleFactura.model');

const SaldoCuenta = require('./saldoCuenta.model');
const MovimientoCuenta = require('./movimientoCuenta.model');

// Relaciones entre modelos
SaldoCuenta.hasMany(MovimientoCuenta, { foreignKey: 'cuentaId', as: 'movimientos', onDelete: 'RESTRICT' });
MovimientoCuenta.belongsTo(SaldoCuenta, { foreignKey: 'cuentaId', as: 'cuenta' });

// Control de Cajas
Caja.hasMany(SesionCaja, { foreignKey: 'cajaId', onDelete: 'RESTRICT' });
SesionCaja.belongsTo(Caja, { foreignKey: 'cajaId', as: 'caja' });

// Cabecera de Factura
Cliente.hasMany(Factura, { foreignKey: 'clienteId', onDelete: 'RESTRICT' });
Factura.belongsTo(Cliente, { foreignKey: 'clienteId', as: 'cliente' });

SesionCaja.hasMany(Factura, { foreignKey: 'sesionCajaId', onDelete: 'RESTRICT' });
Factura.belongsTo(SesionCaja, { foreignKey: 'sesionCajaId', as: 'sesionCaja' });

// Detalle de Factura
Factura.hasMany(DetalleFactura, { foreignKey: 'facturaId', as: 'detalles', onDelete: 'RESTRICT' });
DetalleFactura.belongsTo(Factura, { foreignKey: 'facturaId' });

// Exportación
module.exports = {
  sequelize,
  PreferenciaSistema,
  Caja,
  SesionCaja,
  Cliente,
  Factura,
  DetalleFactura,
  SaldoCuenta,
  MovimientoCuenta
};