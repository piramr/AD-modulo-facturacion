const { Op } = require('sequelize');
const Cliente = require('../models/cliente.model');
const { registrarEvento } = require('./external/auditoria.service');

const idFuncionClienteAuditoria = 19; // ID de la función de auditoría para clientes

function construirWhere(filtros = {}) {
  const where = {};

  if (filtros.estado) where.estado = filtros.estado;
  if (filtros.tipoCliente) where.tipoCliente = filtros.tipoCliente; 

  if (filtros.cedula) where.cedula = { [Op.like]: `%${filtros.cedula}%` };
  if (filtros.nombre) where.nombre = { [Op.iLike]: `%${filtros.nombre}%` };

  // BÚSQUEDA MULTI-ATRIBUTO
  if (filtros.search) {
    const termino = `%${filtros.search}%`;
    where[Op.or] = [
      { nombre: { [Op.iLike]: termino } },
      { cedula: { [Op.like]: termino } },
      { telefono: { [Op.like]: termino} },
      { email: { [Op.iLike]: termino} }
    ];
  }

  return where;
}

async function contarClientesConFiltro(filtros = {}) {
  const where = construirWhere(filtros);
  return Cliente.count({ where });
}

// Listar clientes con filtros, paginación y ordenamiento
async function listarClientes(filtros = {}) {
  const where = construirWhere(filtros);
  const limit = filtros.limit ? parseInt(filtros.limit, 10) : 10;
  const offset = filtros.offset ? parseInt(filtros.offset, 10) : 0;
  
  // Ordenamiento por defecto
  let orderClause = [['createdAt', 'DESC']];

  if (filtros.orderBy && filtros.orderBy.length > 0) {
    orderClause = filtros.orderBy.map(item => {
      const columnaBD = item.campo || 'createdAt';
      return [columnaBD, item.direccion];
    });
  }

  return Cliente.findAndCountAll({
    where,
    limit,
    offset,
    order: orderClause
  });
}

// Obtener un cliente específico por su ID
async function obtenerClientePorId(id) {
  if (!id) {
    const error = new Error('El ID del cliente es requerido.');
    error.code = 'BAD_USER_INPUT';
    error.status = 400;
    throw error;
  }

  const cliente = await Cliente.findByPk(id);
  if (!cliente) {
    const error = new Error(`El cliente con ID ${id} no existe.`);
    error.code = 'NOT_FOUND';
    error.status = 404;
    throw error;
  }

  return cliente;
}

// Registrar un nuevo cliente validando lógica de negocio
async function crearCliente(datos) {
  // 1. Validar duplicidad de cédula (Control preventivo antes del golpe en BD)
  const existe = await Cliente.findOne({ where: { cedula: datos.cedula } });
  if (existe) {
    throw new Error(`Ya existe un cliente registrado con la cédula ${datos.cedula}.`);
  }

  const fechaNac = new Date(datos.fechaNacimiento);
  const hoy = new Date();
  if (fechaNac > hoy) {
    throw new Error('La fecha de nacimiento no puede ser mayor a la fecha actual.');
  }

  const nuevoCliente = await Cliente.create(datos);

  registrarEvento({
    idFuncion: idFuncionClienteAuditoria,
    accion: 'CREAR_CLIENTE',
    descripcion: `Creación de cliente ${nuevoCliente.nombre} con cédula ${nuevoCliente.cedula}`,
    observacion: `Datos del cliente: ${JSON.stringify(datos)}`
  });

  return nuevoCliente;
}

 
// Actualizar los datos de un cliente existente
async function actualizarCliente(id, datos) {
  const cliente = await obtenerClientePorId(id);

  // Validar fecha de nacimiento si se intenta modificar
  if (datos.fechaNacimiento) {
    const fechaNac = new Date(datos.fechaNacimiento);
    if (fechaNac > new Date()) {
      throw new Error('La fecha de nacimiento no puede ser mayor a la fecha actual.');
    }
  }

  await cliente.update(datos);

  registrarEvento({
    idFuncion: idFuncionClienteAuditoria,
    accion: 'ACTUALIZAR_CLIENTE',
    descripcion: `Actualización de cliente ${cliente.nombre} con cédula ${cliente.cedula}`,
    observacion: `Datos actualizados: ${JSON.stringify(datos)}`
  });

  return cliente;
}

// Cambiar el estado del cliente (Inactivar de forma lógica)
async function actualizarEstadoCliente(id, nuevoEstado) {
  if (!['ACTIVO', 'INACTIVO'].includes(nuevoEstado)) {
    throw new Error('Estado no permitido. Use "ACTIVO" o "INACTIVO".');
  }
  let cliente;

  try {
    cliente = await obtenerClientePorId(id);
    
    if (!cliente) {
      throw new Error(`El cliente con ID ${id} no existe.`);
    }

    await cliente.update({ estado: nuevoEstado });

    registrarEvento({
      idFuncion: idFuncionClienteAuditoria,
      accion: 'ACTUALIZAR_ESTADO_CLIENTE',
      descripcion: `ÉXITO: Actualización de estado para cliente ${cliente.nombre} con cédula ${cliente.cedula}`,
      observacion: `El cliente ha sido ${nuevoEstado === 'ACTIVO' ? 'activado' : 'inactivado'} correctamente.`
    });

    return cliente; // Retornamos aquí solo si todo salió bien

  } catch (error) {
    registrarEvento({
      idFuncion: idFuncionClienteAuditoria,
      accion: 'ACTUALIZAR_ESTADO_CLIENTE_FALLO',
      descripcion: `ERROR: No se pudo actualizar el estado para cliente ${cliente ? cliente.nombre : 'Desconocido'}`,
      observacion: `Error al intentar cambiar el estado a ${nuevoEstado}. Detalle: ${error.message || error}`
    });

    throw error; 
  }
}

module.exports = {
  contarClientesConFiltro,
  listarClientes,
  obtenerClientePorId,
  crearCliente,
  actualizarCliente,
  actualizarEstadoCliente
};