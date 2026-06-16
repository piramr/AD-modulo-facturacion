// src/pages/clientes/ClientesPage.jsx
import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import toast, { Toaster } from 'react-hot-toast';
import { LISTAR_CLIENTES, CREAR_CLIENTE, ACTUALIZAR_CLIENTE } from '../../apollo/clienteQueries';
import { validarCliente } from './clienteValidaciones';

const FORM_VACIO = {
  cedula: '', nombre: '', fechaNacimiento: '', tipoCliente: '',
  direccion: '', telefono: '', email: '', estado: 'Activo',
};

export default function ClientesPage() {
  const [form, setForm]           = useState(FORM_VACIO);
  const [errores, setErrores]     = useState({});
  const [editandoId, setEditandoId] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);

  // Queries y mutations
  const { data, loading, refetch } = useQuery(LISTAR_CLIENTES);
  const [crearCliente]    = useMutation(CREAR_CLIENTE);
  const [actualizarCliente] = useMutation(ACTUALIZAR_CLIENTE);

  const clientes = data?.clientes || [];

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Limpiar error del campo al modificarlo
    if (errores[e.target.name]) {
      setErrores({ ...errores, [e.target.name]: null });
    }
  }

  function abrirFormNuevo() {
    setForm(FORM_VACIO);
    setErrores({});
    setEditandoId(null);
    setMostrarForm(true);
  }

  function abrirFormEditar(cliente) {
    setForm({
      cedula:          cliente.cedula,
      nombre:          cliente.nombre,
      fechaNacimiento: cliente.fechaNacimiento,
      tipoCliente:     cliente.tipoCliente,
      direccion:       cliente.direccion,
      telefono:        cliente.telefono,
      email:           cliente.email,
      estado:          cliente.estado,
    });
    setErrores({});
    setEditandoId(cliente.id);
    setMostrarForm(true);
  }

  // CA3 HU1: inactivar en lugar de eliminar
  async function inactivarCliente(cliente) {
    if (!window.confirm(`¿Inactivar al cliente ${cliente.nombre}?`)) return;
    try {
      const { data } = await actualizarCliente({
        variables: { id: cliente.id, input: { estado: 'Inactivo' } }
      });
      toast.success(data.actualizarCliente.mensaje);
      refetch();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleGuardar() {
    // CA1: validar antes de enviar
    const erroresValidacion = validarCliente(form);
    if (Object.keys(erroresValidacion).length > 0) {
      setErrores(erroresValidacion);
      return;
    }

    try {
      if (editandoId) {
        // Actualizar cliente existente
        const { data } = await actualizarCliente({
          variables: { id: editandoId, input: form }
        });
        toast.success(data.actualizarCliente.mensaje);
      } else {
        // CA4: crear nuevo cliente
        const { data } = await crearCliente({ variables: { input: form } });
        toast.success(data.crearCliente.mensaje);
      }
      setMostrarForm(false);
      setForm(FORM_VACIO);
      refetch();
    } catch (err) {
      // CA2: cédula duplicada u otros errores del backend
      toast.error(err.message);
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Toaster position="top-right" />

      {/* Encabezado */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Administración de Clientes</h1>
        <button
          onClick={abrirFormNuevo}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + Nuevo Cliente
        </button>
      </div>

      {/* Formulario (modal simple) */}
      {mostrarForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-screen overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              {editandoId ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h2>

            <div className="grid grid-cols-1 gap-4">
              <Campo label="Cédula" name="cedula" value={form.cedula}
                onChange={handleChange} error={errores.cedula} />
              <Campo label="Nombre completo" name="nombre" value={form.nombre}
                onChange={handleChange} error={errores.nombre} />
              <Campo label="Fecha de nacimiento" name="fechaNacimiento" type="date"
                value={form.fechaNacimiento} onChange={handleChange}
                error={errores.fechaNacimiento} />

              {/* Tipo de cliente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de cliente
                </label>
                <select name="tipoCliente" value={form.tipoCliente} onChange={handleChange}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${errores.tipoCliente ? 'border-red-500' : 'border-gray-300'}`}>
                  <option value="">-- Seleccione --</option>
                  <option value="Contado">Contado</option>
                  <option value="Crédito">Crédito</option>
                </select>
                {errores.tipoCliente && <p className="text-red-500 text-xs mt-1">{errores.tipoCliente}</p>}
              </div>

              <Campo label="Dirección" name="direccion" value={form.direccion}
                onChange={handleChange} error={errores.direccion} />
              <Campo label="Teléfono" name="telefono" value={form.telefono}
                onChange={handleChange} error={errores.telefono} placeholder="0987654321" />
              <Campo label="Email" name="email" type="email" value={form.email}
                onChange={handleChange} error={errores.email} />

              {/* Estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select name="estado" value={form.estado} onChange={handleChange}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${errores.estado ? 'border-red-500' : 'border-gray-300'}`}>
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
                {errores.estado && <p className="text-red-500 text-xs mt-1">{errores.estado}</p>}
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setMostrarForm(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition">
                Cancelar
              </button>
              <button onClick={handleGuardar}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de clientes */}
      {loading ? (
        <p className="text-gray-500">Cargando clientes...</p>
      ) : (
        <div className="overflow-x-auto rounded-xl shadow">
          <table className="min-w-full bg-white text-sm">
            <thead className="bg-blue-600 text-white">
              <tr>
                {['Cédula','Nombre','Tipo','Teléfono','Email','Estado','Acciones'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clientes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">
                    No hay clientes registrados
                  </td>
                </tr>
              ) : (
                clientes.map((c, i) => (
                  <tr key={c.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3">{c.cedula}</td>
                    <td className="px-4 py-3 font-medium">{c.nombre}</td>
                    <td className="px-4 py-3">{c.tipoCliente}</td>
                    <td className="px-4 py-3">{c.telefono}</td>
                    <td className="px-4 py-3">{c.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        c.estado === 'Activo'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {c.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      <button onClick={() => abrirFormEditar(c)}
                        className="text-blue-600 hover:underline text-xs font-medium">
                        Editar
                      </button>
                      {c.estado === 'Activo' && (
                        <button onClick={() => inactivarCliente(c)}
                          className="text-red-500 hover:underline text-xs font-medium">
                          Inactivar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Componente auxiliar para campos de texto
function Campo({ label, name, value, onChange, error, type = 'text', placeholder = '' }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type} name={name} value={value} onChange={onChange}
        placeholder={placeholder}
        className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}