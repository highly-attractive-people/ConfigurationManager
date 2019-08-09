const memory = require('./memory');

const type = 'obs';

function obfuscate(val) {
  if (val === undefined || val === null) {
    return val;
  }

  if (Array.isArray(val)) {
    return obfuscateArray(val);
  }

  if (typeof val === 'object') {
    return obfuscateObj(val);
  }

  if (typeof val === 'string') {
    return obfuscateStr(val);
  }
  return obfuscateStr(val.toString());
}

function obfuscateStr(val) {
  const l = Math.floor(val.length / 2);
  return '*'.repeat(l) + val.substring(l);
}

function obfuscateObj(obj) {
  return Object.entries(obj).reduce((acc, [key, val]) => {
    acc[obfuscateStr(key)] = obfuscate(val);
    return acc;
  }, {});
}

function obfuscateArray(arr) {
  return arr.map(obfuscateStr);
}

function source(userOptions, userConfig) {
  const base = memory(userOptions, userConfig);
  function build() {
    config = base.build();
    return obfuscateObj(config);
  }
  return { ...base, build, type };
}

module.exports = source;
