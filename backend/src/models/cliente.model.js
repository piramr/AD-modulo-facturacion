const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Cliente = sequelize.define('Cliente', {
  id: {
    field: "id",
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  cedula: {
    field: "cedula",
    type: DataTypes.STRING(15),
    allowNull: false,
    unique: true
  },
  nombre: {
    field: "nombre",
    type: DataTypes.STRING(255),
    allowNull: false
  },
  fechaNacimiento: {
    field: "fecha_nacimiento",
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  tipoCliente: {
    field: "tipo_cliente",
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: [['Contado', 'Crédito']]
    }
  },
  direccion: {
    field: "direccion",
    type: DataTypes.TEXT,
    allowNull: false
  },
  telefono: {
    field: "telefono",
    type: DataTypes.STRING(20),
    allowNull: false
  },
  email: {
    field: "email",
    type: DataTypes.STRING(255),
    allowNull: false
  },
  estado: {
    field: "estado",
    type: DataTypes.STRING(15),
    allowNull: false,
    defaultValue: 'Activo',
    validate: {
      isIn: [['Activo', 'Inactivo']]
    }
  }
}, {
  tableName: 'clientes',
  timestamps: true,
  underscored: true,
});

module.exports = Cliente;
