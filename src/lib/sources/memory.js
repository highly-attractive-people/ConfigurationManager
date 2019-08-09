const { mergeDeepRight } = require('ramda');

const type = 'memory';

function source(userOptions, userConfig) {
  let config = {};
  const { name } = userOptions;

  config = mergeDeepRight(config, userConfig);

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
    name
  };
}

module.exports = source;
