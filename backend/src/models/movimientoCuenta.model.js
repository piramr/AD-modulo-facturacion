const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const MovimientoCuenta = sequelize.define('MovimientoCuenta', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  cuentaId: { type: DataTypes.UUID, allowNull: false, field: 'cuenta_id' },

  tipo: { type: DataTypes.ENUM('INGRESO', 'EGRESO'), allowNull: false },
  monto: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  descripcion: { type: DataTypes.STRING, allowNull: false },
  // Opcional: Para saber si vino de cierre de caja o de un pago de cxc
  referencia: { type: DataTypes.STRING } 
}, {
  tableName: 'movimientos_cuenta',
  timestamps: true,
  underscored: true
});

module.exports = MovimientoCuenta;