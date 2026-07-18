# Especificación de Frontend
## Módulo de Facturación

> **Versión:** 1.0  
> **Objetivo:** Definir el comportamiento esperado del Frontend para el módulo de Facturación. Este documento no describe lógica de negocio del backend ni contratos GraphQL, únicamente la experiencia de usuario, navegación y comportamiento de la interfaz.

---

# 1. Descripción General

El módulo de Facturación es un microservicio independiente que consume servicios de otros módulos del sistema.

## Integraciones

El Frontend consumirá servicios GraphQL expuestos por el backend del módulo de Facturación y, cuando corresponda, por el módulo de Seguridad.

Los módulos relacionados son:

- Seguridad
  - Login
  - JWT
  - Recuperación de contraseña
  - Roles y permisos
  - Auditoría

- Inventario
  - Catálogo de productos
  - Kardex de ventas

- Cuentas por Cobrar
  - Registro de facturas a crédito

---

# 2. Roles

Actualmente existen dos roles:

- Administrador
- Cajero

Un usuario puede poseer ambos roles al mismo tiempo.

En ese caso el Frontend deberá mostrar la unión de todas las opciones de ambos roles.

---

# 3. Flujo de Inicio de Sesión

Al ingresar al sistema se mostrará la pantalla de autenticación.

## Componentes

### Campos

- Username
- Password

### Botones

- Iniciar sesión
- Recuperar contraseña

---

## Inicio de sesión

Cuando el usuario presione **Iniciar sesión**, el Frontend enviará las credenciales al módulo de Seguridad.

Si el login es exitoso:

- almacenar el JWT;
- obtener la información del usuario;
- obtener los roles y permisos;
- construir dinámicamente el menú lateral;
- redireccionar al Dashboard (Resumen).

---

# 4. Recuperación de Contraseña

## Paso 1

Al seleccionar **Recuperar contraseña**, se mostrará un formulario con:

- Correo electrónico

Botón:

- Enviar código

El Frontend únicamente enviará el correo al módulo de Seguridad.

El módulo enviará un código de 6 dígitos al correo del usuario.

---

## Paso 2

Una vez enviado el código, el Frontend mostrará otro formulario con:

- Código de recuperación
- Nueva contraseña
- Confirmar contraseña

Botón:

- Restablecer contraseña

El Frontend enviará directamente:

- correo
- código
- nueva contraseña

al módulo de Seguridad.

> **Importante**
>
> El Frontend **no valida** el código recibido.
>
> Toda la validación corresponde al módulo de Seguridad.

---

# 5. Construcción del Menú

Después del login, el Frontend construirá el menú utilizando los roles y permisos obtenidos.

## Rol Administrador

- Resumen
- Cajas
- Saldos de cuentas bancarias
- Ajustes del sistema

---

## Rol Cajero

- Resumen
- Facturación
- Clientes
- Reportes

---

## Usuario con ambos roles

Si el usuario posee ambos roles, deberá visualizar todas las opciones anteriores.

---

# 6. Pantalla Resumen

Disponible para:

- Administrador
- Cajero

Al ingresar al sistema se mostrará un Dashboard con los indicadores principales del módulo.

---

# 7. Pantalla Cajas

**Disponible únicamente para Administrador.**

## Vista principal

Mostrar una tabla con las cajas existentes.

Acciones disponibles:

- Crear caja
- Editar caja
- Configurar caja
- Inactivar caja

---

## Sesiones enviadas a revisión

Debajo del listado de cajas se mostrará otra sección denominada:

**Sesiones pendientes de revisión**

Cada registro mostrará:

- Caja
- Cajero
- Fecha de apertura
- Fecha de envío
- Estado

Al seleccionar una sesión se abrirá el detalle.

---

## Detalle de sesión

Mostrar:

- Caja
- Cajero
- Fecha de apertura
- Fecha de cierre
- Total de facturas
- Total vendido
- Resumen de pagos

Además deberá existir una sección para distribuir el dinero recaudado.

### Distribución del dinero

El usuario podrá agregar uno o varios destinos.

Cada fila contendrá:

- Cuenta bancaria
- Monto

Debe permitir:

- Agregar otra cuenta
- Eliminar una asignación

Se recomienda que el total distribuido sea igual al total recaudado.

Cuando el total esté completamente distribuido se habilitará el botón:

**Cerrar sesión**

---

# 8. Pantalla Saldos de Cuentas Bancarias

Disponible únicamente para Administrador.

La pantalla tendrá dos secciones.

## Saldos

Listado de cuentas mostrando:

- Banco
- Número de cuenta
- Saldo actual

---

## Movimientos recientes

Listado con los movimientos más recientes.

---

## Detalle de una cuenta

Al seleccionar una cuenta se abrirá una pantalla con todos los movimientos asociados.

Los movimientos serán únicamente de consulta.

No existirá opción para:

- editar;
- eliminar.

---

# 9. Pantalla Ajustes del Sistema

Disponible únicamente para Administrador.

El formulario contendrá los siguientes campos:

- Nombre de la empresa
- RUC
- Porcentaje de IVA
- Cuenta bancaria por defecto (opcional)

Botón:

- Guardar configuración

Esta información será utilizada posteriormente durante la impresión de las facturas.

Ejemplo:

> Para pagos de facturas a crédito deposite en la cuenta bancaria configurada por defecto.

---

# 10. Pantalla Facturación

Disponible únicamente para Cajero.

Al ingresar a este módulo el Frontend deberá validar si el usuario posee una sesión de caja abierta.

---

## Caso 1

Existe una sesión abierta.

El usuario será enviado directamente a la pantalla de facturación.

---

## Caso 2

No existe una sesión abierta.

Se mostrará una pantalla con todas las cajas disponibles.

Cada caja será representada mediante una tarjeta (Card).

Cada tarjeta mostrará:

- Nombre
- Estado

Ejemplo:

- Disponible
- Ocupada

Una caja únicamente puede tener una sesión activa.

---

## Apertura de Caja

Al seleccionar una caja disponible aparecerá un diálogo solicitando:

- Monto de apertura

Botón:

- Abrir caja

Después de crear la sesión el usuario será enviado automáticamente a la pantalla de facturación.

---

## Pantalla Operativa de Facturación

Debe permitir:

- Buscar productos.
- Agregar productos al comprobante.
- Buscar clientes.
- Registrar un nuevo cliente (si aplica).
- Emitir facturas de contado.
- Emitir facturas a crédito.
- Eliminar productos del detalle.
- Modificar cantidades.
- Visualizar totales.

---

## Finalización de sesión

La pantalla tendrá un botón:

**Finalizar sesión**

o

**Enviar a revisión**

Al presionarlo se solicitará:

- Monto físico recaudado.

Luego se mostrará un resumen con:

- Fecha de apertura
- Fecha de cierre
- Caja
- Cajero
- Total de facturas
- Total vendido
- Monto esperado
- Monto ingresado
- Diferencia

Finalmente el usuario confirmará el envío de la sesión para revisión del administrador.

---

# 11. Pantalla Clientes

Disponible para Cajero.

Mostrar una tabla con los clientes registrados.

Acciones:

- Crear cliente
- Editar cliente
- Inactivar cliente

---

# 12. Pantalla Reportes

Disponible para Cajero.

Mostrar las opciones necesarias para generar los reportes definidos en la HU6.

Ejemplo:

- Reporte de facturación
- Reporte de clientes

---

# 13. Consideraciones de UX

- El menú lateral debe construirse dinámicamente según los permisos del usuario.
- Todas las operaciones deberán mostrar indicadores de carga.
- Mostrar mensajes de éxito y error para todas las operaciones.
- Confirmar las acciones críticas (inactivar, cerrar sesión de caja, etc.).
- Mantener una navegación consistente entre todas las pantallas.
- Utilizar tablas con búsqueda, ordenamiento y paginación cuando corresponda.
- Utilizar formularios con validaciones básicas de campos obligatorios.

---

# 14. Reglas para el Frontend

- El Frontend no debe implementar reglas de negocio que correspondan al backend.
- El Frontend no valida códigos de recuperación de contraseña.
- La visibilidad de menús y acciones dependerá exclusivamente de los permisos recibidos.
- El JWT deberá almacenarse y enviarse en todas las peticiones autenticadas.
- Si el token expira, el usuario deberá ser redireccionado al Login.
- Una caja solo puede mostrar una sesión activa.
- Si un cajero ya posee una sesión abierta, el sistema debe abrir directamente la pantalla de facturación.
- El cierre definitivo de una sesión siempre será realizado por un Administrador.