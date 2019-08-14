const { mergeDeepRight, pick } = require('ramda');
const nodeSelector = require('./helpers/nodeSelector');
const obfuscate = require('./helpers/obfuscate');
const jsonfile = require('jsonfile');
const appRoot = require('app-root-path');

const SECOND = 1000;
const MINUTE = 60 * SECOND;

const defaultLogger = {
  log: console.log,
  error: console.log
};

const cacheFileName = `${appRoot}/conman.cache.json`;
let isInitialized = false;

const defaultOptions = {
  // TODO CHANGE THIS TO 5 MINUTES
  ttl: 10 * SECOND,
  logEnabled: false,
  logger: defaultLogger,
  useFile: true,
  cacheFileName,
};

let sources = [];
let options = defaultOptions;
let privateCache;
let ttlInterval;
let selector;
let logger;

function _prepareCacheObject(tree) {
  return {
    lastModified: new Date().getTime(),
    data: tree
  };
}

const _log = options => (type, ...args) => {
  if (options.logEnabled) {
    options.logger[type](...args);
  }
};

function _writeToFile(cacheObject, options) {
  if (!options.useFile) {
    return Promise.resolve();
  }

  logger('log', 'Writing conman cache to file');
  return jsonfile
    .writeFile(options.cacheFileName, cacheObject, {
      spaces: 2,
      EOL: '\r\n'
    })
    .then(res => {
      logger(
        'log',
        `Succesfully wrote conman cache to file ${options.cacheFileName}`
      );
      return res;
    })
    .catch(error => {
      logger('error', `Couldn't write cache to file ${options.cacheFileName}`);
    });
}

function _isExpired(cache, options) {
  return new Date().getTime() - cache.lastModified <= options.ttl;
}

function _readFromFile(options) {
  return jsonfile
    .readFile(options.cacheFileName)
    .then(cache => {
      if (cache && cache.lastModified && _isExpired(cache, options)) {
        logger(
          'log',
          `Succesfully read cache from file ${options.cacheFileName}`
        );
        return cache.data;
      }
      return null;
    })
    .catch(err => {
      logger(
        'error',
        `Could not read cache config file "${options.cacheFileName}"`,
        err
      );
      return null;
    });
}

function _validateSource(source) {
  if (typeof source.build !== 'function') {
    return 'Source should have a build function';
  }
  if (!source.type) {
    return 'Source should have a type';
  }
  return null;
}

function _triggerInterval() {
  clearInterval(ttlInterval);
  if (options.ttl <= 0) {
    return;
  }
  ttlInterval = setInterval(build, options.ttl);
}

function _init(userOptions = {}) {
  options = { ...defaultOptions, ...userOptions };
  logger = _log(options);
  isInitialized = true;
  selector = nodeSelector(logger);
  return conman;
}

function addSource(source) {
  const sourceError = _validateSource(source);
  if (sourceError) {
    throw new Error(sourceError);
  }
  logger('log', `Source "${source.type}" added to conman`);
  sources.push(source);
  return conman;
}

function _get(key, privateCache) {
  if (key === undefined) {
    return privateCache;
  }

  return selector.query(privateCache, key);
}

function get(keys) {
  if (!isInitialized) {
    throw new Error('Conman has not been initialize');
  }

  if (Array.isArray(keys)) {
    return keys.map(key => _get(key, privateCache));
  }

  return _get(keys, privateCache);
}

function getObfuscate(keys, params) {
  return obfuscate(get(keys), params);
}

function _buildSources(sources) {
  const sourcesTypes = sources.map(({ name, type }) => name || type);
  logger(
    'log',
    `Build triggered for sources: "${sourcesTypes.join()}" at ${new Date().toISOString()}`
  );
  return Promise.all(sources.map(source => source.build())).then(configs => {
    logger(
      'log',
      `Build completed for sources: "${sourcesTypes.join()}" at ${new Date().toISOString()}`
    );
    return configs.reduce((acc, config) => {
      acc = mergeDeepRight(acc, config);
      return acc;
    }, {});
  });
}

function _setPrivateCache(config) {
  privateCache = config;
  return config;
}

function _buildAndSaveCache(sources) {
  return _buildSources(sources).then(configs => {
    return _writeToFile(_prepareCacheObject(configs), options).then(() =>
      _setPrivateCache(configs)
    );
  });
}

function build() {
  _triggerInterval();

  // read from file if its the first build
  if (!privateCache && options.useFile) {
    return _readFromFile(options).then(cache => {
      if (!cache) {
        return _buildAndSaveCache(sources);
      }
      return _setPrivateCache(cache);
    });
  }

  return _buildAndSaveCache(sources);
}

function stop() {
  clearInterval(ttlInterval);
}

function reset() {
  sources = [];
  options = defaultOptions;
  isInitialized = false;
  ttlInterval = undefined;
  privateCache = undefined;
  logger = undefined;
  clearInterval(ttlInterval);
}

const conman = _init;
conman.build = build;
conman.stop = stop;
conman.reset = reset;
conman.addSource = addSource;
conman.get = get;
conman.getObfuscate = getObfuscate;

module.exports = conman;
