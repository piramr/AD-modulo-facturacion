const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Cliente = sequelize.define('Cliente', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  cedula: { type: DataTypes.STRING, unique: true, allowNull: false },
  nombre: { type: DataTypes.STRING, allowNull: false },
  fechaNacimiento: { type: DataTypes.DATEONLY, allowNull: false, field: 'fecha_nacimiento' },
  
  tipoCliente: { 
    type: DataTypes.ENUM('CONTADO', 'CREDITO'), 
    allowNull: false, 
    field: 'tipo_cliente' 
  },

  direccion: { type: DataTypes.STRING, allowNull: false },
  telefono: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, validate: { isEmail: true } },
  estado: { type: DataTypes.ENUM('ACTIVO', 'INACTIVO'), defaultValue: 'ACTIVO' }
}, {
  tableName: 'clientes',
  timestamps: true,
  underscored: true
});

module.exports = Cliente;