const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Factura = require('./factura.model');

const DetalleFactura = sequelize.define('DetalleFactura', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  facturaId: {
    field: "factura_id",
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'facturas', key: 'id' },
    onDelete: 'CASCADE'
  },
  productoCodigo: {
    field: "producto_id",
    type: DataTypes.STRING(20),   // ej: "PRD-0003" — confirmado por Inventario
    allowNull: false,
    comment: 'Código del producto en Inventario (ej: PRD-0003)'
  },
  productoNombre: {
    field: "producto_nombre",
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Snapshot del nombre al momento de facturar'
  },
  cantidad: {
    field: "cantidad",
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1 }
  },
  precioUnitario: {
    field: "precio_unitario",
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: { min: 0 }
  },
  grabaIva: {
    field: "graba_iva",
    type: DataTypes.BOOLEAN,
    allowNull: false
  },
  subtotalLinea: {
    field: "subtotal_linea",
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: { min: 0 }
  }
}, {
  tableName: 'detalle_facturas',
  timestamps: false
});

Factura.hasMany(DetalleFactura, { foreignKey: 'factura_id', as: 'detalles', onDelete: 'CASCADE' });
DetalleFactura.belongsTo(Factura, { foreignKey: 'factura_id', as: 'factura' });

module.exports = DetalleFactura;
