const saldosService = require('../../services/saldos.service');

const saldosResolvers = {
  Query: {
    saldoCuenta: async (_, { cuentaId }) => {
      return await saldosService.obtenerSaldoCuenta(cuentaId);
    }
  },
  Mutation: {
    registrarMovimiento: async (_, { input }) => {
      return await saldosService.registrarMovimiento(input);
    }
  }
};

module.exports = saldosResolvers;