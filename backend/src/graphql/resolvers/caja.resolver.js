const cajaService = require('../../services/caja.service');

const cajaResolvers = {
  Query: {
    obtenerCajas: async () => {
      return await cajaService.obtenerCajas();
    },
    obtenerCaja: async (_, { id }) => {
      return await cajaService.obtenerCaja(id);
    },
    obtenerSesionActiva: async (_, { usuarioId }) => {
      return await cajaService.obtenerSesionActiva(usuarioId);
    }
  },

  Mutation: {
    // --- Mutaciones de Administración ---
    crearCaja: async (_, { input }) => {
      return await cajaService.crearCaja(input);
    },
    actualizarCaja: async (_, { id, input }) => {
      return await cajaService.actualizarCaja(id, input);
    },
    inactivarCaja: async (_, { id }) => {
      return await cajaService.inactivarCaja(id);
    },

    // --- Mutaciones de Operación (Cajero) ---
    abrirSesionCaja: async (_, { input }) => {
      return await cajaService.abrirSesionCaja(input);
    },
    revisarSesionCaja: async (_, { input }) => {
      return await cajaService.revisarSesionCaja(input);
    },
    cerrarSesionCaja: async (_, { input }) => {
      return await cajaService.cerrarSesionCaja(input);
    }
  }
};

module.exports = cajaResolvers;