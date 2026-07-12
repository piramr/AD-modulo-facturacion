const { AsyncLocalStorage } = require('async_hooks');

const contextStorage = new AsyncLocalStorage();

const getCurrentContext = () => {
  return contextStorage.getStore() || { token: '', ip: '127.0.0.1' };
};

module.exports = {
  contextStorage,
  getCurrentContext
};
