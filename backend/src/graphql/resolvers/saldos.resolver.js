const saldosService = require('../../services/saldos.service');

const saldoResolvers = {
  Query: {
    saldoCuenta: async (_, { cuentaId }) => {
      return await saldosService.obtenerSaldoCuenta(cuentaId);
    }
  },

  Mutation: {
    // --- Gestión Administrativa de Saldos ---
    crearSaldoCuenta: async (_, { input }) => {
      return await saldosService.crearSaldoCuenta(input);
    },
    actualizarSaldoCuenta: async (_, { id, input }) => {
      return await saldosService.actualizarSaldoCuenta(id, input);
    },
    inactivarSaldoCuenta: async (_, { id }) => {
      return await saldosService.inactivarSaldoCuenta(id);
    },

    // --- Movimientos (Billetera) ---
    crearMovimiento: async (_, { input }) => {
      return await saldosService.registrarMovimiento(input);
    }
  }
};

module.exports = saldoResolvers;