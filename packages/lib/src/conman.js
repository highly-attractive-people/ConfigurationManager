const { mergeDeepRight } = require('ramda');
const jsonfile = require('jsonfile');
const appRoot = require('app-root-path');

const nodeSelector = require('./helpers/nodeSelector');
const obfuscate = require('./helpers/obfuscate');
const serialize = require('./helpers/serialize');

const SECOND = 1000;
const MINUTE = 60 * SECOND;

const defaultLogger = console;

const defaultCacheFileName = `${appRoot}/conman.cache.json`;

const defaultOptions = {
  ttl: 5 * MINUTE,
  logEnabled: false,
  logger: defaultLogger,
  useFile: true,
  defaultCacheFileName
};

const _log = opts => (type, ...args) => {
  if (opts.logEnabled) {
    opts.logger[type](...args);
  }
};

function conman(userOptions) {
  let sources = [];
  let privateCache;
  let ttlInterval;
  let logger;
  let options = { ...defaultOptions, ...userOptions };

  logger = _log(options);
  const selector = nodeSelector(logger);

  function _prepareCacheObject(tree) {
    return {
      lastModified: new Date().getTime(),
      data: tree
    };
  }

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
          logger(
            'log',
            `Succesfully read cache from file ${opts.cacheFileName}`
          );
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

  function addSource(source) {
    const sourceError = _validateSource(source);
    if (sourceError) {
      throw new Error(sourceError);
    }
    logger('log', `Source "${source.type}" added to conman`);
    sources.push(source);
    return this;
  }

  function _get(key, _privateCache) {
    const safeCache = _privateCache || {};
    if (key === undefined) {
      return safeCache;
    }

    return selector.query(safeCache || {}, key);
  }

  function get(keys) {
    if (Array.isArray(keys)) {
      return keys.map(key => _get(key, privateCache));
    }

    return _get(keys, privateCache);
  }

  function getObfuscate(keys, params) {
    return obfuscate(get(keys), params);
  }

  function _buildSources(_sources) {
    async function buildSource(config, source) {
      const sourceConfig = await source.build(config);
      const parseConfig = source.key
        ? { [source.key]: sourceConfig }
        : sourceConfig;

      return mergeDeepRight(config, parseConfig);
    }

    return serialize(_sources, buildSource, {});
  }

  function _setPrivateCache(config) {
    privateCache = config;
    return config;
  }

  async function _buildAndSaveCache(_sources) {
    const sourcesTypes = _sources.map(({ name, type }) => name || type);
    logger(
      'log',
      `Build triggered for sources: "${sourcesTypes.join()}" at ${new Date().toISOString()}`
    );
    const configs = await _buildSources(_sources);
    logger(
      'log',
      `Build completed for sources: "${sourcesTypes.join()}" at ${new Date().toISOString()}`
    );
    await _writeToFile(_prepareCacheObject(configs), options);
    return _setPrivateCache(configs);
  }

  async function build() {
    _triggerInterval();

    // read from file if its the first build
    if (!privateCache && options.useFile) {
      const cache = await _readFromFile(options);
      if (!cache) {
        return _buildAndSaveCache(sources);
      }
      return _setPrivateCache(cache);
    }

    return _buildAndSaveCache(sources);
  }

  function stop() {
    clearInterval(ttlInterval);
  }

  function reset() {
    sources = [];
    options = defaultOptions;
    ttlInterval = undefined;
    privateCache = undefined;
    logger = undefined;
    clearInterval(ttlInterval);
  }

  return {
    build,
    stop,
    reset,
    addSource,
    get,
    getObfuscate
  };
}

module.exports = { create: conman };
