const conman = require('./packages/lib/src/conman');

module.exports = function conmaget(key) {
  return conman.get(key);
};
