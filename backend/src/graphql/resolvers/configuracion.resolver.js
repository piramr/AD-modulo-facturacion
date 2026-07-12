const configuracionService = require('../../services/configuracion.service');

const configuracionResolvers = {
  Query: {
    obtenerPreferencias: async () => {
      return await configuracionService.obtenerPreferencias();
    }
  },

  Mutation: {
    actualizarPreferencias: async (_, { input }) => {
      return await configuracionService.actualizarPreferencias(input);
    }
  }
};

module.exports = configuracionResolvers;