const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Factura = require('./factura.model');

const DetalleFactura = sequelize.define('DetalleFactura', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  facturaId: { type: DataTypes.INTEGER, allowNull: false, references: { model: Factura, key: 'id' }, field: 'factura_id' },
  codigoProducto: { type: DataTypes.STRING, allowNull: false, field: 'codigo_producto' }, // Viene de API de Inventario
  nombreProducto: { type: DataTypes.STRING, allowNull: false, field: 'nombre_producto' }, // Viene de API de Inventario
  cantidad: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  pvpUnitario: { type: DataTypes.DECIMAL(10, 2), allowNull: false, field: 'pvp_unitario' },
  grabaIva: { type: DataTypes.BOOLEAN, allowNull: false, field: 'graba_iva' },
  subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false }
}, {
  tableName: 'detalles_factura',
  timestamps: false,
  underscored: true
});

module.exports = DetalleFactura;