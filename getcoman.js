const conman = require('./packages/lib/conman');

module.exports = function(key) {
  return conman.getObfuscate(key, { percentage: 0.5, separator: '' });
};
