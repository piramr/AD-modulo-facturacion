const { Op } = require('sequelize');
const Cliente = require('../models/cliente.model');
const PistaAuditoria = require('../models/pistaAuditoria.model');

function construirWhere(filtros = {}) {
  const where = {};

  // Filtros tradicionales
  if (filtros.estado) where.estado = filtros.estado;
  if (filtros.tipo_cliente) where.tipo_cliente = filtros.tipo_cliente;

  // Filtros por campo (Búsqueda parcial)
  if (filtros.cedula) where.cedula = { [Op.like]: `%${filtros.cedula}%` };
  if (filtros.nombre) where.nombre = { [Op.iLike]: `%${filtros.nombre}%` };

  // BÚSQUEDA MULTI-ATRIBUTO
  if (filtros.search) {
    const termino = `%${filtros.search}%`;
    
    where[Op.or] = [
      { nombre: { [Op.iLike]: termino } },  // Coincide con nombre (Case-Insensitive)
      { cedula: { [Op.like]: termino } },   // Coincide con cédula
    ];
  }

  return where;
}

async function contarClientesConFiltro(filtros = {}) {
  const where = construirWhere(filtros);
  return Cliente.count({ where });
}

async function listarClientes(filtros = {}) {
  const where = construirWhere(filtros);

  const limit = filtros.limit ? parseInt(filtros.limit, 10) : 10;
  const offset = filtros.offset ? parseInt(filtros.offset, 10) : 0;

  return Cliente.findAndCountAll({
    where,
    limit,
    offset,
    order: [['created_at', 'DESC']]
  });
}

/**
 * Obtener un cliente específico por su ID
 */
async function obtenerClientePorId(id) {
  const cliente = await Cliente.findByPk(id);
  if (!cliente) {
    throw new Error(`El cliente con ID ${id} no existe.`);
  }
  return cliente;
}

/**
 * HU1 - CA4: Registrar un nuevo cliente validando lógica de negocio
 */
async function crearCliente(datos, usuarioDictante) {
  // 1. Validar duplicidad de cédula (Control preventivo antes del golpe en BD)
  const existe = await Cliente.findOne({ where: { cedula: datos.cedula } });
  if (existe) {
    throw new Error(`Ya existe un cliente registrado con la cédula ${datos.cedula}.`);
  }

  // 2. Validar fecha de nacimiento (Regla SQL: fecha_nacimiento <= CURRENT_DATE)
  const fechaNac = new Date(datos.fecha_nacimiento);
  const hoy = new Date();
  if (fechaNac > hoy) {
    throw new Error('La fecha de nacimiento no puede ser mayor a la fecha actual.');
  }

  const nuevoCliente = await Cliente.create(datos);

  // 3. Pista de Auditoría Opcional
  if (usuarioDictante) {
    await PistaAuditoria.create({
      usuario_id: usuarioDictante.id,
      accion: 'CREAR_CLIENTE',
      detalles: { cliente_id: nuevoCliente.id, cedula: nuevoCliente.cedula }
    });
  }

  return nuevoCliente;
}

/**
 * Actualizar los datos de un cliente existente
 */
async function actualizarCliente(id, datos, usuarioDictante) {
  const cliente = await obtenerClientePorId(id);

  // Validar fecha de nacimiento si se intenta modificar
  if (datos.fecha_nacimiento) {
    const fechaNac = new Date(datos.fecha_nacimiento);
    if (fechaNac > new Date()) {
      throw new Error('La fecha de nacimiento no puede ser mayor a la fecha actual.');
    }
  }

  await cliente.update(datos);

  if (usuarioDictante) {
    await PistaAuditoria.create({
      usuario_id: usuarioDictante.id,
      accion: 'ACTUALIZAR_CLIENTE',
      detalles: { cliente_id: id }
    });
  }

  return cliente;
}

/**
 * HU1 - CA3: Cambiar el estado del cliente (Inactivar de forma lógica)
 */
async function actualizarEstadoCliente(id, nuevoEstado, usuarioDictante) {
  if (!['Activo', 'Inactivo'].includes(nuevoEstado)) {
    throw new Error('Estado no permitido. Use "Activo" o "Inactivo".');
  }

  const cliente = await obtenerClientePorId(id);
  await cliente.update({ estado: nuevoEstado });

  if (usuarioDictante) {
    await PistaAuditoria.create({
      usuario_id: usuarioDictante.id,
      accion: `INACTIVAR_CLIENTE`,
      detalles: { cliente_id: id, nuevo_estado: nuevoEstado }
    });
  }

  return cliente;
}

module.exports = {
  contarClientesConFiltro,
  listarClientes,
  obtenerClientePorId,
  crearCliente,
  actualizarCliente,
  actualizarEstadoCliente
};