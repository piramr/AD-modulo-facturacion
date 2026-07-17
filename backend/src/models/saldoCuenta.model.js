const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SaldoCuenta = sequelize.define('SaldoCuenta', {
  // El UUID de la cuenta de CXC es nuestra llave principal aquí
  cuentaId: { type: DataTypes.UUID, primaryKey: true, field: 'cuenta_id' },
  saldoActual: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0.00 },
  ultimaActualizacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  estado: { type: DataTypes.ENUM('ACTIVO', 'INACTIVO'), allowNull: false, defaultValue: 'ACTIVO' }
}, {
  tableName: 'saldos_cuenta',
  timestamps: false
});

module.exports = SaldoCuenta;
