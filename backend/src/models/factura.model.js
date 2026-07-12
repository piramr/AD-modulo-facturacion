const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Cliente = require('./cliente.model');
const SesionCaja = require('./sesionCaja.model');

const Factura = sequelize.define('Factura', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  clienteId: { type: DataTypes.INTEGER, allowNull: false, references: { model: Cliente, key: 'id' }, field: 'cliente_id' },
  sesionCajaId: { type: DataTypes.INTEGER, allowNull: false, references: { model: SesionCaja, key: 'id' }, field: 'sesion_caja_id' },
  
  tipoPago: { 
    type: DataTypes.ENUM('EFECTIVO', 'CREDITO', 'TRANSFERENCIA'), 
    allowNull: false, 
    field: 'tipo_pago' 
  },
  
  numeroFactura: { type: DataTypes.STRING, unique: true, allowNull: false, field: 'numero_factura' },
  fechaEmision: { type: DataTypes.DATE, allowNull: false, field: 'fecha_emision' },
  
  estado: { type: DataTypes.ENUM('PAGADA', 'EMITIDA', 'ANULADA'), allowNull: false, defaultValue: 'PAGADA', field: 'estado' },
  saldoPendiente: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00, field: 'saldo_pendiente' },
  
  porcentajeIva: { type: DataTypes.DECIMAL(5, 2), allowNull: false, field: 'porcentaje_iva' },
  subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  ivaTotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false, field: 'iva_total' },
  total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  
  isPrinted: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_printed' }
}, {
  tableName: 'facturas',
  timestamps: true,
  underscored: true
});

module.exports = Factura;