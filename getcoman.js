const conman = require('./packages/lib/src/conman');

module.exports = function conmaget(key) {
  return conman.getObfuscate(key, { percentage: 0.5, separator: '' });
};
