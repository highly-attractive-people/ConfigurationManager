const { mergeDeepRight } = require('ramda');
const jsonfile = require('jsonfile');
const appRoot = require('app-root-path');

const nodeSelector = require('./helpers/nodeSelector');
const obfuscate = require('./helpers/obfuscate');

const SECOND = 1000;
const MINUTE = 60 * SECOND;

const defaultLogger = console;

const cacheFileName = `${appRoot}/conman.cache.json`;
let isInitialized = false;

const defaultOptions = {
  ttl: 5 * MINUTE,
  logEnabled: false,
  logger: defaultLogger,
  useFile: true,
  cacheFileName
};

let conman;

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

const _log = opts => (type, ...args) => {
  if (opts.logEnabled) {
    opts.logger[type](...args);
  }
};

function _writeToFile(cacheObject, opts) {
  if (!opts.useFile) {
    return Promise.resolve();
  }

  logger('log', 'Writing conman cache to file');
  return jsonfile
    .writeFile(opts.cacheFileName, cacheObject, {
      spaces: 2,
      EOL: '\r\n'
    })
    .then(res => {
      logger(
        'log',
        `Succesfully wrote conman cache to file ${opts.cacheFileName}`
      );
      return res;
    })
    .catch(error => {
      logger(
        'error',
        `Couldn't write cache to file ${opts.cacheFileName}`,
        error
      );
    });
}

function _isExpired(cache, opts) {
  return new Date().getTime() - cache.lastModified <= opts.ttl;
}

function _readFromFile(opts) {
  return jsonfile
    .readFile(opts.cacheFileName)
    .then(cache => {
      if (cache && cache.lastModified && _isExpired(cache, opts)) {
        logger('log', `Succesfully read cache from file ${opts.cacheFileName}`);
        return cache.data;
      }
      return null;
    })
    .catch(err => {
      logger(
        'error',
        `Could not read cache config file "${opts.cacheFileName}"`,
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

function _get(key, _privateCache) {
  if (key === undefined) {
    return _privateCache;
  }

  return selector.query(_privateCache, key);
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

function _buildSources(_sources) {
  const sourcesTypes = _sources.map(({ name, type }) => name || type);
  const sourcesKeys = _sources.map(source => source.key);
  logger(
    'log',
    `Build triggered for sources: "${sourcesTypes.join()}" at ${new Date().toISOString()}`
  );
  return Promise.all(_sources.map(source => source.build())).then(configs => {
    logger(
      'log',
      `Build completed for sources: "${sourcesTypes.join()}" at ${new Date().toISOString()}`
    );
    return configs.reduce((acc, config, index) => {
      const sourceKey = sourcesKeys[index];
      if (sourceKey) {
        return mergeDeepRight(acc, { [sourceKey]: config });
      }
      return mergeDeepRight(acc, config);
    }, {});
  });
}

function _setPrivateCache(config) {
  privateCache = config;
  return config;
}

function _buildAndSaveCache(_sources) {
  return _buildSources(_sources).then(configs => {
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

conman = _init;
conman.build = build;
conman.stop = stop;
conman.reset = reset;
conman.addSource = addSource;
conman.get = get;
conman.getObfuscate = getObfuscate;

module.exports = conman;
