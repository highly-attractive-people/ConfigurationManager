const defaultParams = {
  percentage: 0.5,
  separator: '',
  position: 'end',
  character: '*'
};

function getUncensored(val, start, end, separator) {
  return val.slice(start, end).join(separator);
}

function getAffix(val, uncensored, character) {
  return character.repeat(val.length - uncensored.length);
}

function obfuscateStr(val, params) {
  const { percentage, separator, character, position } = params;
  const splitValue = val.split(separator);
  const splitLen = splitValue.length;

  const len = Math.ceil(splitLen * percentage);

  if (position === 'end') {
    const uncensored = getUncensored(splitValue, 0, splitLen - len, separator);
    return uncensored + getAffix(val, uncensored, character);
  }

  const uncensored = getUncensored(splitValue, len, splitLen, separator);
  return getAffix(val, uncensored, character) + uncensored;
}

function obfuscateObj(obj, params) {
  return Object.entries(obj).reduce((acc, [key, val]) => {
    acc[obfuscateStr(key, params)] = _obfuscate(val, params);
    return acc;
  }, {});
}

function obfuscateArr(arr, params) {
  return arr.map(val => _obfuscate(val, params));
}

function _obfuscate(val, params) {
  if (val === undefined || val === null) {
    return val;
  }

  if (Array.isArray(val)) {
    return obfuscateArr(val, params);
  }

  if (typeof val === 'object') {
    return obfuscateObj(val, params);
  }

  if (typeof val === 'string') {
    return obfuscateStr(val, params);
  }

  return obfuscateStr(val.toString(), params);
}
function obfuscate(val, userParams) {
  const params = { ...defaultParams, ...userParams };

  return _obfuscate(val, params);
}

module.exports = obfuscate;
