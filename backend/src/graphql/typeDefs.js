const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type ClienteResumen {
    id: ID!
    nombre: String!
    cedula: String!
    tipoCliente: String!
  }

  type Cliente {
    id: ID!
    cedula: String!
    nombre: String!
    fechaNacimiento: String!
    tipoCliente: String!    # 'Contado' o 'Crédito' (HU1)
    direccion: String!
    telefono: String!
    email: String!
    estado: String!         # 'Activo' o 'Inactivo' (HU1)
    createdAt: String
    updatedAt: String
  }

  type DetalleFactura {
    id: ID!
    productoCodigo: String!
    productoNombre: String!
    cantidad: Int!
    precioUnitario: Float!
    grabaIva: Boolean!
    subtotalLinea: Float!
  }

  type Factura {
    id: ID!
    numeroFactura: String!
    clienteId: String!
    cliente: ClienteResumen
    tipoPago: String!
    fechaEmision: String!
    subtotal: Float!
    totalIva: Float!
    total: Float!
    estado: String!
    detalles: [DetalleFactura!]!
  }

  type PistaAuditoria {
    id: ID!
    usuarioId: String!
    fechaHora: String!
    accion: String!
    detalles: String
  }

  type ProductoCatalogo {
    codigo: String!
    nombre: String!
    descripcion: String
    pvp: Float!
    grabaIva: Boolean!
    porcentajeIvaAplicado: Int!
    stockActual: Int!
  }

  # === ENTRADAS / INPUTS ===

  input CrearClienteInput {
    cedula: String!
    nombre: String!
    fechaNacimiento: String!
    tipoCliente: String!   # 'Contado' o 'Crédito'
    direccion: String!
    telefono: String!
    email: String!
    estado: String         # Default 'Activo'
  }

  input ActualizarClienteInput {
    cedula: String
    nombre: String
    fechaNacimiento: String
    tipoCliente: String
    direccion: String
    telefono: String
    email: String
    estado: String
  }

  input DetalleInput {
    productoCodigo: String!
    cantidad: Int!
  }

  input CrearFacturaInput {
    clienteId: String!
    tipoPago: String!
    detalles: [DetalleInput!]!
  }

  # === CONSULTAS PRINCIPALES ===

  type Query {
    # Módulo de Facturas
    facturas(estado: String, clienteId: String, tipoPago: String): [Factura!]!
    factura(id: ID!): Factura
    catalogoProductos: [ProductoCatalogo!]!
    pistasAuditoria(accion: String): [PistaAuditoria!]!

    # Módulo de Clientes (HU1 & HU2)
    clientes(estado: String, cedula: String, nombre: String, tipoCliente: String): [Cliente!]!
    cliente(id: ID!): Cliente
  }

  # === MUTACIONES (ESCRITURA Y ACCIONES) ===

  type Mutation {
    # Operaciones de Facturas
    crearFactura(input: CrearFacturaInput!): Factura!
    actualizarEstadoFactura(id: ID!, estado: String!): Factura!

    # Operaciones de Clientes (HU1)
    crearCliente(input: CrearClienteInput!): Cliente!
    actualizarCliente(id: ID!, input: ActualizarClienteInput!): Cliente!
    inactivarCliente(id: ID!): Cliente!
  }
`;

module.exports = typeDefs;