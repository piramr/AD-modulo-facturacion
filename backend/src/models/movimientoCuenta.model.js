const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const MovimientoCuenta = sequelize.define('MovimientoCuenta', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  cuentaId: { type: DataTypes.UUID, allowNull: false, field: 'cuenta_id' },

  tipo: { type: DataTypes.ENUM('INGRESO', 'EGRESO'), allowNull: false },
  monto: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  fechaMovimiento: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, allowNull: false },
  referencia: { type: DataTypes.STRING },
  descripcion: { type: DataTypes.STRING, allowNull: false }
}, {
  tableName: 'movimientos_cuenta',
  timestamps: true,
  underscored: true
});

module.exports = MovimientoCuenta;