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
  cacheFileName: defaultCacheFileName
};

/**
 * Logs only when the option is enabled
 * @private
 * @param  {boolean} isEnabled Should log?
 * @param  {object} logger Object that atleast a log and error function
 * @param  {function} logger.log Logs info
 * @param  {function} logger.error Logs error
 * @return  {function(string, *)} Function that logs if enabled with the set logger
 */
function _log(isEnabled, logger) {
  const fixedLogger = logger;
  if (!logger.log && logger.info) {
    fixedLogger.log = logger.info;
  }

  if (!logger.debug && logger.info) {
    fixedLogger.debug = logger.info;
  }

  return function inner(type, ...args) {
    if (isEnabled) {
      fixedLogger[type](...args);
    }
  };
}

/**
 * Format the config to have a timestamp
 * @private
 * @param  {object} tree
 */
function _prepareCacheObject(tree) {
  return {
    lastModified: new Date().getTime(),
    data: tree
  };
}

/**
 * Writes cache object
 * @private
 * @param  {object} cacheObject
 * @param  {object} opts Options to write file
 * @param  {string} opts.cacheFileName Filename where to save the file
 * @param  {object} opts.logger Object that atleast a log and error function
 */

function _writeToFile(cacheObject, opts) {
  opts.logger('log', 'Writing conman cache to file');
  return jsonfile
    .writeFile(opts.cacheFileName, cacheObject, {
      spaces: 2,
      EOL: '\r\n'
    })
    .then((res) => {
      opts.logger(
        'log',
        `Succesfully wrote conman cache to file ${opts.cacheFileName}`
      );
      return res;
    })
    .catch((error) => {
      opts.logger(
        'error',
        `Couldn't write cache to file ${opts.cacheFileName} with error: ${error}`
      );
    });
}
/**
 * Calculates if TTL has expired
 * @private
 * @param  {number} lastModified Timestamp when it was last modified
 * @param  {number} ttl Miliseconds until next expiration
 */
function _isExpired(lastModified, ttl) {
  return new Date().getTime() - lastModified <= ttl;
}

/**
 * Reads file with the cache object
 * @private
 * @param  {object} opts Options to Read file
 * @param  {string} opts.cacheFileName Filename where to read the file
 * @param  {object} opts.logger Object with atleast a log and error function
 */
function _readFromFile(opts) {
  return jsonfile
    .readFile(opts.cacheFileName)
    .then((cache) => {
      const { lastModified } = cache || {};
      if (_isExpired(lastModified, opts.ttl)) {
        opts.logger(
          'log',
          `Succesfully read cache from file ${opts.cacheFileName}`
        );
        return cache.data;
      }
      return null;
    })
    .catch((err) => {
      opts.logger(
        'error',
        `Could not read cache config file "${opts.cacheFileName}" with error ${err}`,
      );
      return null;
    });
}
/**
 * Validate if a source has all the necessary properties
 * @private
 * @param  {Object} source
 */
function _validateSource(source) {
  if (typeof source.build !== 'function') {
    return 'Source should have a build function';
  }
  if (!source.type) {
    return 'Source should have a type';
  }
  return null;
}
/**
 * @private
 * @param  {function} selector function that gets the key from the cache
 * @param  {sting} key
 * @param  {object} _privateCache
 */
function _get(selector, key, _privateCache) {
  const safeCache = _privateCache || {};
  if (key === undefined) {
    return safeCache;
  }

  return selector.query(safeCache || {}, key);
}
/**
 * Builds the sources sequencially
 * @private
 * @param  {array} _sources array of sources
 */
function _buildSources(_sources, options) {
  async function buildSource(config, source) {
    try {
      const sourceConfig = await source.build(config, options.logger);
      const parseConfig = source.key
        ? { [source.key]: sourceConfig }
        : sourceConfig;

      return mergeDeepRight(config, parseConfig);
    } catch (e) {
      options.logger(
        'error',
        `Unable to build source: "${source.key}" at ${new Date().toISOString()} with error ${e}`
      );
      const parseConfig = source.key
        ? { [source.key]: {} }
        : {};
      return mergeDeepRight(config, parseConfig);
    }
  }

  return serialize(_sources, buildSource, {});
}
/**
 * Factory to generate Conman Instances
 * @namespace
 * @param  {Object} userOptions
 * @param  {number} userOptions.ttl Milliseconds before rebuilding the config
 * @param  {boolean} userOptions.logEnabled Should it log?
 * @param  {logger} userOptions.logger Object with atleast a log and error function
 * @param  {boolean} userOptions.useFile Should it read and write the config to a file
 * @param  {string} userOptions.cacheFileName Name of the file where cache config will be saved
 * @returns {object}
 */
function conman(userOptions) {
  let sources = [];
  let privateCache;
  let ttlInterval;
  let options = { ...defaultOptions, ...userOptions };

  options.logger = _log(options.logEnabled, options.logger);

  const selector = nodeSelector(options.logger);

  function _setPrivateCache(config) {
    privateCache = config;
    return config;
  }

  function _triggerInterval() {
    clearInterval(ttlInterval);
    if (options.ttl <= 0) {
      return;
    }

    ttlInterval = setInterval(build, options.ttl);
  }

  async function _buildAndSaveCache(_sources) {
    const sourcesTypes = _sources.map(({ name, type }) => name || type);
    options.logger(
      'log',
      `Build triggered for sources: "${sourcesTypes.join()}" at ${new Date().toISOString()}`
    );
    const configs = await _buildSources(_sources, options);
    options.logger(
      'log',
      `Build completed for sources: "${sourcesTypes.join()}" at ${new Date().toISOString()}`
    );
    if (options.useFile) {
      await _writeToFile(_prepareCacheObject(configs), options);
    }

    return _setPrivateCache(configs);
  }

  /**
   * @function sourceBuild
   * @param  {object} config - config built by previous sources
   * @returns {object} built config by the source
   */

  /**
   * Adds a source to the conman instance
   * @param  {object} source
   * @param  {sourceBuild} source.build function that receives the config built by previous sources and returns and object
   * @param  {string} source.type string the identifies the type of source
   * @param  {string=} source.name string the identifies the specific source
   * @param  {string=} source.key if a key is provided the result from build will be added to that key
   * @returns {object} conman instance
   */
  function addSource(source) {
    const sourceError = _validateSource(source);
    if (sourceError) {
      throw new Error(sourceError);
    }
    options.logger('log', `Source "${source.type}" added to conman`);
    sources.push(source);
    return this;
  }

  /**
   * Build the sources added by the `addSource` method in order
   * if the useFile flag is set it would read the config from the cache file if it hasn't expired
   * if ttl options is not 0 it would rebuild the config in ttl milliseconds
   * @returns {Promise<object>} Promise that resolves with the generated config
   */
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
  /**
   * Gets a single key, an array of keys, or the complete config from the configuration object.
   * If you want to retrieve a nested key add a `.` between each key
   * @param  {(Array<string>|string)=} keys Array of keys or single to key to get from the property
   * @returns {(Array<*>|*)} If an array of keys is provided it returns an array of values, if a single key was provided returns the value of that key
   */
  function get(keys) {
    if (Array.isArray(keys)) {
      return keys.map((key) => _get(selector, key, privateCache));
    }

    return _get(selector, keys, privateCache);
  }

  /**
   * Behaves exactly as `conman.get` but returns an obfuscated version of the value.
   * @param  {(Array<string>|string)=} keys Array of keys or single to key to get from the property
   * @param  {object} params params to obfuscate the values
   * @param {float} [0.5] percentage Wercentage of the values that should be obfuscated (replaced by the `character` option
   * @param {string} [""] separator Wow to divide the value that will be obfuscated
   * @param {string} ["end"]  What part of the value to obfuscate `start` or `end`
   * @param {string} ["*"] character What character should be used to obfuscate the value
   * @returns {(Array<*>|*)} If an array of keys is provided it returns an array of values, if a single key was provided returns the value of that key
   */
  function getObfuscate(keys, params) {
    return obfuscate(get(keys), params);
  }

  /**
   * Stops the rebuilt interval schedule base on the TTL
   */
  function stop() {
    clearInterval(ttlInterval);
  }
  /**
   * Clears all the sources, the configuration cache and resets all defaults options
   */
  function reset() {
    sources = [];
    options = defaultOptions;
    ttlInterval = undefined;
    privateCache = undefined;
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

module.exports = conman;
