const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DOCUMENT_REGEX = /^[0-9]{6,15}$/
const PHONE_REGEX = /^[+0-9()\-\s]{7,20}$/
const NAME_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/

export const CLIENTE_ESTADOS = ['Activo', 'Inactivo']
export const TIPO_CLIENTE_OPTIONS = ['Contado', 'Crédito']
export const FACTURA_ESTADOS = ['Emitida', 'Pagada', 'Anulada']
export const TIPO_PAGO_OPTIONS = ['Efectivo', 'Crédito']
export const IVA_PERCENT = 15

export const sanitizeText = (value) => String(value ?? '').trim()
export const normalizeDocument = (value) => sanitizeText(value).replace(/\s+/g, '')
export const toNumber = (value) => Number(String(value ?? '').replace(',', '.'))
export const parseBoolean = (value) => value === true || value === 'true' || value === 1 || value === '1'

const countDigits = (value) => (String(value ?? '').match(/\d/g) ?? []).length
const isValidEmail = (value) => EMAIL_REGEX.test(sanitizeText(value))
const isValidDocument = (value) => DOCUMENT_REGEX.test(normalizeDocument(value))
const isValidPhone = (value) => PHONE_REGEX.test(sanitizeText(value)) && countDigits(value) >= 7
const isValidName = (value) => NAME_REGEX.test(sanitizeText(value))

const isValidPastOrTodayDate = (value) => {
  if (!value) return false
  const parsedDate = new Date(`${value}T00:00:00`)
  if (Number.isNaN(parsedDate.getTime())) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return parsedDate.getTime() <= today.getTime()
}

export const getFirstError = (errors) => Object.values(errors).find(Boolean) || ''

export const validateClienteForm = (form, existingClientes = []) => {
  const values = {
    cedula: sanitizeText(form.cedula),
    nombre: sanitizeText(form.nombre),
    fecha_nacimiento: sanitizeText(form.fecha_nacimiento),
    tipo_cliente: sanitizeText(form.tipo_cliente),
    direccion: sanitizeText(form.direccion),
    telefono: sanitizeText(form.telefono),
    email: sanitizeText(form.email),
    estado: sanitizeText(form.estado),
  }

  const errors = {}

  if (!values.cedula || !isValidDocument(values.cedula)) {
    errors.cedula = 'La cedula debe contener solo digitos entre 6 y 15 caracteres.'
  }

  if (existingClientes.some((cliente) => normalizeDocument(cliente.cedula) === normalizeDocument(values.cedula) && cliente.id !== form.id)) {
    errors.cedula = 'Ya existe un cliente con esa cedula.'
  }

  if (values.nombre.length < 3 || !isValidName(values.nombre)) {
    errors.nombre = 'El nombre debe tener al menos 3 caracteres y no contener numeros.'
  }

  if (!isValidPastOrTodayDate(values.fecha_nacimiento)) {
    errors.fecha_nacimiento = 'La fecha de nacimiento no puede ser vacia ni mayor a la fecha actual.'
  }

  if (!TIPO_CLIENTE_OPTIONS.includes(values.tipo_cliente)) {
    errors.tipo_cliente = 'Selecciona un tipo de cliente valido.'
  }

  if (!values.direccion || values.direccion.length < 5) {
    errors.direccion = 'La direccion debe tener al menos 5 caracteres.'
  }

  if (!isValidPhone(values.telefono)) {
    errors.telefono = 'El telefono debe tener al menos 7 digitos.'
  }

  if (!isValidEmail(values.email)) {
    errors.email = 'Ingresa un correo electronico valido.'
  }

  if (!CLIENTE_ESTADOS.includes(values.estado)) {
    errors.estado = 'Selecciona un estado valido.'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    values,
  }
}

export const validateDetalleFacturaForm = (form) => {
  const values = {
    producto_id: sanitizeText(form.producto_id),
    producto_nombre: sanitizeText(form.producto_nombre),
    cantidad: Number(form.cantidad),
    precio_unitario: toNumber(form.precio_unitario),
    graba_iva: parseBoolean(form.graba_iva),
    porcentaje_iva_aplicado: toNumber(form.porcentaje_iva_aplicado ?? IVA_PERCENT),
    stock_actual: Number(form.stock_actual ?? 0),
  }

  const errors = {}

  if (!values.producto_id) {
    errors.producto_id = 'El producto es obligatorio.'
  }

  if (values.producto_nombre.length < 3) {
    errors.producto_nombre = 'El nombre del producto debe tener al menos 3 caracteres.'
  }

  if (!Number.isInteger(values.cantidad) || values.cantidad <= 0) {
    errors.cantidad = 'La cantidad debe ser un entero mayor a cero.'
  } else if (values.cantidad > values.stock_actual) {
    errors.cantidad = 'Inventario insuficiente.'
  }

  if (!Number.isFinite(values.precio_unitario) || values.precio_unitario < 0) {
    errors.precio_unitario = 'El precio unitario debe ser mayor o igual a cero.'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    values: {
      ...values,
      subtotal_linea: Number((values.cantidad * values.precio_unitario).toFixed(2)),
    },
  }
}

export const calculateFacturaTotals = (detalles = []) => {
  const subtotal = detalles.reduce((accumulator, detalle) => accumulator + Number(detalle.subtotal_linea || 0), 0)
  const totalIva = detalles.reduce((accumulator, detalle) => {
    if (!detalle.graba_iva) return accumulator
    const porcentaje = Number(detalle.porcentaje_iva_aplicado ?? IVA_PERCENT)
    return accumulator + Number(detalle.subtotal_linea || 0) * (porcentaje / 100)
  }, 0)

  return {
    subtotal: Number(subtotal.toFixed(2)),
    total_iva: Number(totalIva.toFixed(2)),
    total: Number((subtotal + totalIva).toFixed(2)),
  }
}

export const validateFacturaForm = (form, clientes = [], _facturas = [], detalles = []) => {
  void _facturas

  const values = {
    cliente_id: sanitizeText(form.cliente_id),
    tipo_pago: sanitizeText(form.tipo_pago),
    fecha_emision: sanitizeText(form.fecha_emision),
    estado: sanitizeText(form.estado),
  }

  const errors = {}

  if (!values.cliente_id) {
    errors.cliente_id = 'Debes seleccionar un cliente.'
  } else if (!clientes.some((cliente) => cliente.id === values.cliente_id)) {
    errors.cliente_id = 'El cliente seleccionado no existe.'
  }

  if (!TIPO_PAGO_OPTIONS.includes(values.tipo_pago)) {
    errors.tipo_pago = 'Selecciona un tipo de pago valido.'
  }

  if (!values.fecha_emision) {
    errors.fecha_emision = 'La fecha de emision es obligatoria.'
  }

  if (!FACTURA_ESTADOS.includes(values.estado)) {
    errors.estado = 'Selecciona un estado valido.'
  }

  if (!Array.isArray(detalles) || detalles.length === 0) {
    errors.detalles = 'Debes agregar al menos un producto al detalle de la factura.'
  }

  const duplicatesInDetails = detalles.some(
    (detalle, index) => detalles.findIndex((candidate) => candidate.producto_id === detalle.producto_id) !== index,
  )

  if (duplicatesInDetails) {
    errors.detalles = 'No puedes repetir el mismo producto en el detalle.'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    values,
  }
}

export const formatCurrencyNumber = (value) => Number((Number(value) || 0).toFixed(2))
