const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Caja = require('./caja.model');

const SesionCaja = sequelize.define('SesionCaja', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  cajaId: { type: DataTypes.UUID, allowNull: false, references: { model: Caja, key: 'id' }, field: 'caja_id' },
  
  usuarioId: { type: DataTypes.INTEGER, allowNull: false, field: 'usuario_id' }, 
  
  // -- Apertura --
  fechaApertura: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'fecha_apertura' },
  montoApertura: { type: DataTypes.DECIMAL(10, 2), allowNull: false, field: 'monto_apertura' }, // Base inicial en monedas/billetes
  
  // -- Transacciones del Turno --
  cantidadFacturas: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false, field: 'cantidad_facturas' },
  totalVentasEfectivo: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00, field: 'total_ventas_efectivo' },
  totalVentasCredito: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00, field: 'total_ventas_credito' },

  // -- Cierre --
  fechaCierre: { type: DataTypes.DATE, allowNull: true, field: 'fecha_cierre' },
  montoCierreEsperado: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00, allowNull: false, field: 'monto_cierre_esperado' }, // Apertura + Ventas Efectivo
  montoCierreReal: { type: DataTypes.DECIMAL(10, 2), allowNull: true, field: 'monto_cierre_real' }, // Lo que declara el cajero
  faltante: { type: DataTypes.DECIMAL(10, 2), allowNull: true, defaultValue: 0.00, field: 'faltante' }, // Diferencia negativa
  sobrante: { type: DataTypes.DECIMAL(10, 2), allowNull: true, defaultValue: 0.00, field: 'sobrante' }, // Diferencia positiva
  
  estado: { type: DataTypes.ENUM('ABIERTA', 'EN_REVISION' ,'CERRADA'), defaultValue: 'ABIERTA' }
}, {
  tableName: 'sesiones_caja',
  timestamps: true,
  underscored: true
});

module.exports = SesionCaja;