const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Caja = sequelize.define('Caja', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  codigo: { type: DataTypes.STRING, unique: true, allowNull: false }, // Ej: CAJ-001
  descripcion: { type: DataTypes.STRING, allowNull: false },
  estado: { type: DataTypes.ENUM('ACTIVO', 'INACTIVO'), defaultValue: 'ACTIVO' },
  
  // --- Control de Secuenciales ---
  establecimiento: { type: DataTypes.STRING(3), allowNull: false, field: 'establecimiento' }, 
  puntoEmision: { type: DataTypes.STRING(3), allowNull: false, field: 'punto_emision' },       
  secuencialActual: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'secuencial_actual' }
}, {
  tableName: 'cajas',
  timestamps: true,
  underscored: true
});

module.exports = Caja;