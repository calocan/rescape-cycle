// A minimum configuration for cycleRecords.js
module.exports.config = {
  settings: {
    cycle: {
      drivers: {
        api: 'HTTP'
      }
    },
    domain: 'localhost',
    api: {
      protocol: 'http',
      host: 'localhost',
      port: '8080',
      root: '/api/'
    }
  }
};
