const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Factura = sequelize.define('Factura', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  numeroFactura: {
    field: "numero_factura",
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    comment: 'Formato: XXX-XXX-XXXXXXXXX (ej: 001-001-000000001)'
  },
  clienteId: {
    field: "cliente_id",
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'clientes', // nombre de la tabla (string, no el modelo)
      key: 'id'
    }
  },
  tipoPago: {
    field: "tipo_pago",
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: [['Efectivo', 'Crédito']]
    }
  },
  fechaEmision: {
    field: "fecha_emision",
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  subtotal: {
    field: "subtotal",
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    validate: { min: 0 }
  },
  totalIva: {
    field: "total_iva",
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    validate: { min: 0 }
  },
  total: {
    field: "total",
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    validate: { min: 0 }
  },
  estado: {
    field: "estado",
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'Emitida'
  }
}, {
  tableName: 'facturas',
  timestamps: false // el SQL original no tiene created_at/updated_at en facturas
});

module.exports = Factura;
