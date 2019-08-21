const { mergeDeepRight } = require('ramda');

const type = 'object';

function source(userOptions = {}, initialConfig = {}) {
  let config = {};
  const { name, key } = userOptions;

  config = mergeDeepRight(config, initialConfig);

  function build() {
    return config;
  }

  function add(userConfig) {
    config = mergeDeepRight(config, userConfig);
    return this;
  }
  return {
    build,
    type,
    add,
    name,
    key
  };
}

module.exports = source;
