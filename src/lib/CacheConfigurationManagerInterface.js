'use strict';
const ConfigurationManagerInterface = require('./ConfigurationManagerInterface');
const Timer = require('./Timer');
const TreeSelector = require('./TreeSelector');
const { mergeDeepRight } = require('ramda');
const jsonFile = require('jsonfile');
const colors = require('colors');

const cacheFileName ='config/CacheConfigurationManager.db.json';
const defaultOptions = {
  ttl: 3000,
  cacheConfigPath: 'cacheConfigurationManager'
};

// TODO: reset ttl when reading component config, as this may contain an updated TTL.
//  - define default config path
//  - call this.component.get(cache.config.path) to reset tll on this.getRebuiltCacheObject
//  - Define a Cache object instead of using a data object and assuming properties?
//    - Cache.getData()
//    - Cache.getLastModified()
//    - Cache.persist()
//    - Cache.reload()
//    - Cache.destroy()



/**
 * Private in-memory cache storage.
 */
var cache;

/**
 * Cache Configuration Manager Interface
 *   This interface defines a cache-layer that wraps around a configuration
 *   manager object that may have expensive operations in retrieving
 *   configuration. This interface implements a Proxy pattern.
 *
 * @extends ConfigurationManagerInterface
 */
class CacheConfigurationManagerInterface extends ConfigurationManagerInterface {
  /**
   * This interface is a proxy to the ConfigurationManager component that it
   * wraps.
   *
   * @param {ConfigurationManagerInterface} component
   *   A class that represents the wrapped component.
   */
  constructor(component, nodeSelector, options) {
    super();

    if (!component || !component.prototype instanceof ConfigurationManagerInterface) {
      throw new Error('You must provide an object that implements to ConfigurationManagerInterface');
    }

    if (!nodeSelector || !nodeSelector.prototype instanceof TreeSelector) {
      throw new Error('You must provide an object that implements to TreeSelector');
    }

    this.component = component;
    this.nodeSelector = nodeSelector;
    this.options = mergeDeepRight(defaultOptions, options);

    this.get = this.get.bind(this);
    this.buildTree = this.buildTree.bind(this);
    this.getValidConfigurationObject = this.getValidConfigurationObject.bind(this);
    this.getRebuiltCacheObject = this.getRebuiltCacheObject.bind(this);
    this.writeCache = this.writeCache.bind(this);
    this.getTTL = this.getTTL.bind(this);
    this.prepareCacheObject = this.prepareCacheObject.bind(this);
    this.clearCache = this.clearCache.bind(this);
    this.setCacheInMemory = this.setCacheInMemory.bind(this);
    this.getCache = this.getCache.bind(this);
    this.readCacheFromFile = this.readCacheFromFile.bind(this);
    this.extractCacheData = this.extractCacheData.bind(this);
    this.readAndSetCacheInMemory = this.readAndSetCacheInMemory.bind(this);
    this.resetCacheOptions = this.resetCacheOptions.bind(this);
  }

  /**
   * @inheritdoc
   */
  get(property) {
    return this.buildTree()
      .then((tree) => {
        return this.nodeSelector.query(tree, property)}
      );
  }

  /**
   * @inheritdoc
   */
  buildTree() {
    return this.getTTL()
      .then(this.getValidConfigurationObject)
      .then(this.extractCacheData);
  }

  /**
   * Get a valid cache object according to the specified TTL.
   *
   * @param  {Timer} ttl
   *  A timer object representing the TTL.
   *
   * @return {Cache}
   *  A cache object.
   */
  getValidConfigurationObject(ttl) {
    console.log('seconds remaining: ' + ttl.timeRemaining() / 1000);

    if (ttl.isExpired()) {
      console.log('cache expired'.red);
      return this.getRebuiltCacheObject();
    }
    else {
      console.log('using cached config'.green);
      return this.getCache();
    }
  }

  /**
   * Rebuild cache and return a cache object from the canonical source.
   *
   * @return {Cache}
   *  A cache object.
   */
  getRebuiltCacheObject() {
    console.log('rebuilding cache object'.red);
    return this.component.buildTree()
      .then(this.resetCacheOptions)
      .then(this.writeCache)
      .then(this.readAndSetCacheInMemory);
  }

  resetCacheOptions(tree) {
    let configOptions = {};

    try {
      if (configOptions = this.nodeSelector.query(tree, this.options.cacheConfigPath)) {
        this.options = mergeDeepRight(defaultOptions, configOptions);
      }
    }
    catch (error) {
      console.error(error);
    }

    return Promise.resolve(tree);
  }

  /**
   * Save cache in a persistent storage.
   *
   * @param  {Hashable} tree
   *   A configuration object.
   *
   * @return {<Promise>Void}
   */
  writeCache(tree) {
    console.log("writing cache to file".grey);
    // throw new Error('You must provide an implementation for the setCache method.');
    const cacheObject = this.prepareCacheObject(tree);

    return jsonFile.writeFile(cacheFileName, cacheObject, {spaces: 2, EOL: '\r\n'})
      .then( res => {
        console.log("writing complete".grey);
      })
      .catch(error => {
        console.error(error);
      });
  }

  /**
   * Read cache from persistent storage
   */
  readCacheFromFile() {
    console.log('Reading cache from file'.grey);
    return jsonFile.readFile(cacheFileName);
  }

  /**
   * Indiscriminately fetch cache object as it is available. A new cache object
   * will be created an existing one is found.
   * @return {[type]} [description]
   */
  getCache() {
    // throw new Error('You must provide an implementation for the getCache method.');
    if (cache) {
      console.log('In-memory cache used'.green);
      return Promise.resolve(cache);
    }
    else {
      console.log('No in-memory cache found'.yellow);
      return this.readAndSetCacheInMemory()
        // If there was an error reading cache from file, then we attempt to
        // write the rebuild the cache and persist it.
        .catch( error => {
          console.log('no file found, but building anyway...'.grey);
          return getRebuiltCacheObject()
            .catch( error => console.error(error));
        });
    }
  }

  /**
   * Read cache from persistent storage and save in-memory.
   */
  readAndSetCacheInMemory(cacheObject) {
    return this.readCacheFromFile()
      .then(this.setCacheInMemory);
  }

  /**
   * Sets in-memory cache object.
   */
  setCacheInMemory(fileContents) {
    console.log('Persisting cache in-memory'.grey)
    cache = fileContents;
    return Promise.resolve(cache);
  }

  /**
   * Deletes in-memory and persistent storage of cache.
   */
  clearCache() {
    // throw new Error('You must provide an implementation for the clearCache method.');
    console.log("Clearing cache".red);
    cache = undefined;

    return new Promise( (resolve, reject) => {
      require('fs').unlink(cacheFileName, error => {
        if (error) {
          console.error(error);
        }
        return resolve();
      });
    });
  }

  /**
   * Helper for extracting the actual data from a cache object.
   * @return {Hashable}
   */
  extractCacheData(cacheObject) {
    return cacheObject.data;
  }

  /**
   * Wraps data into a "cache" object.
   * @return {Cache}
   */
  prepareCacheObject(tree) {
    return {
      lastModified: new Date().getTime(),
      data: tree
    };
  }

  /**
   * Returns a Timer instance which is used to represent the cache's TTL.
   * @return {Timer}
   */
  getTTL() {
    return this.getCache().then( cache => {
      if (cache && cache.lastModified) {
        return Promise.resolve(new Timer(cache.lastModified, this.options.ttl));
      }
      else {
        return Promise.reject(Error("Could not read lastModified value from cache."));
      }
    })
  }

}

module.exports = CacheConfigurationManagerInterface;
