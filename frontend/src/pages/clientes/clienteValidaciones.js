// src/pages/clientes/clienteValidaciones.js

// Valida cédula ecuatoriana (10 dígitos, algoritmo módulo 10)
export function validarCedula(cedula) {
  if (!/^\d{10}$/.test(cedula)) return 'La cédula debe tener 10 dígitos numéricos';

  const provincia = parseInt(cedula.substring(0, 2));
  if (provincia < 1 || provincia > 24) return 'Cédula inválida (provincia incorrecta)';

  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let digito = parseInt(cedula[i]);
    if (i % 2 === 0) {
      digito *= 2;
      if (digito > 9) digito -= 9;
    }
    suma += digito;
  }
  const digitoVerificador = (10 - (suma % 10)) % 10;
  if (digitoVerificador !== parseInt(cedula[9])) return 'Cédula inválida';

  return null;
}

export function validarCliente(datos) {
  const errores = {};

  // Cédula
  const errorCedula = validarCedula(datos.cedula);
  if (errorCedula) errores.cedula = errorCedula;

  // Nombre: solo letras y espacios
  if (!datos.nombre || datos.nombre.trim() === '') {
    errores.nombre = 'El nombre es obligatorio';
  } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(datos.nombre)) {
    errores.nombre = 'El nombre no puede contener números ni caracteres especiales';
  }

  // Fecha de nacimiento: no puede ser futura
  if (!datos.fechaNacimiento) {
    errores.fechaNacimiento = 'La fecha de nacimiento es obligatoria';
  } else if (new Date(datos.fechaNacimiento) >= new Date()) {
    errores.fechaNacimiento = 'La fecha de nacimiento no puede ser mayor a la fecha actual';
  }

  // Tipo de cliente
  if (!datos.tipoCliente || !['Contado', 'Crédito'].includes(datos.tipoCliente)) {
    errores.tipoCliente = 'Seleccione un tipo de cliente válido (Contado o Crédito)';
  }

  // Dirección
  if (!datos.direccion || datos.direccion.trim() === '') {
    errores.direccion = 'La dirección es obligatoria';
  }

  // Teléfono: formato ecuatoriano (09XXXXXXXX o 0X-XXXXXXX)
  if (!datos.telefono || datos.telefono.trim() === '') {
    errores.telefono = 'El teléfono es obligatorio';
  } else if (!/^(09\d{8}|0[2-7]\d{7})$/.test(datos.telefono.replace(/[-\s]/g, ''))) {
    errores.telefono = 'Formato de teléfono inválido (ej: 0987654321)';
  }

  // Email
  if (!datos.email || datos.email.trim() === '') {
    errores.email = 'El email es obligatorio';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email)) {
    errores.email = 'El email no tiene un formato válido';
  }

  // Estado
  if (!datos.estado || !['Activo', 'Inactivo'].includes(datos.estado)) {
    errores.estado = 'Seleccione un estado válido (Activo o Inactivo)';
  }

  return errores;
}