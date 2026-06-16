// src/apollo/clienteQueries.js
import { gql } from '@apollo/client';

export const CREAR_CLIENTE = gql`
  mutation CrearCliente($input: CrearClienteInput!) {
    crearCliente(input: $input) {
      cliente {
        id
        cedula
        nombre
        fechaNacimiento
        tipoCliente
        direccion
        telefono
        email
        estado
      }
      mensaje
    }
  }
`;

export const ACTUALIZAR_CLIENTE = gql`
  mutation ActualizarCliente($id: ID!, $input: ActualizarClienteInput!) {
    actualizarCliente(id: $id, input: $input) {
      cliente {
        id
        cedula
        nombre
        fechaNacimiento
        tipoCliente
        direccion
        telefono
        email
        estado
      }
      mensaje
    }
  }
`;

export const LISTAR_CLIENTES = gql`
  query Clientes($estado: String) {
    clientes(estado: $estado) {
      id
      cedula
      nombre
      fechaNacimiento
      tipoCliente
      direccion
      telefono
      email
      estado
    }
  }
`;