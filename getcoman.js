const conman = require('./src/lib/conman');

module.exports = function(key) {
  return conman.get(key);
};
