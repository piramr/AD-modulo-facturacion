const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PreferenciaSistema = sequelize.define('PreferenciaSistema', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombreEmpresa: { type: DataTypes.STRING, allowNull: false, field: 'nombre_empresa' },
  rucEmpresa: { type: DataTypes.STRING, allowNull: false, field: 'ruc_empresa' },
  porcentajeIva: { type: DataTypes.DECIMAL(5, 2), allowNull: false, field: 'porcentaje_iva' }, 
  cuentaBancariaDefaultId: { type: DataTypes.STRING, allowNull: true, field: 'cuenta_bancaria_default_id' }
  
}, {
  tableName: 'preferencias_sistema',
  timestamps: true,
  underscored: true
});

module.exports = PreferenciaSistema;