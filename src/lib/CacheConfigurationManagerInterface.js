'use strict';
const ConfigurationManagerInterface = require('./ConfigurationManagerInterface');
const Timer = require('./Timer');
const TreeSelector = require('./TreeSelector');
const { mergeDeepRight } = require('ramda');
const jsonFile = require('jsonfile');
const colors = require('colors');

const cacheFileName ='config/CacheConfigurationManager.db.json';
const defaultOptions = {
  ttl: 3000
};

// TODO: reset ttl when reading component config, as this may contain an updated TTL.
//  - define default config path
//  - call this.component.get(cache.config.path) to reset tll on this.getRebuiltCache

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
    this.getValidConfiguration = this.getValidConfiguration.bind(this);
    this.getRebuiltCache = this.getRebuiltCache.bind(this);
    this.writeCache = this.writeCache.bind(this);
    this.getTTL = this.getTTL.bind(this);
    this.prepareCacheObject = this.prepareCacheObject.bind(this);
    this.clearCache = this.clearCache.bind(this);
    this.setCacheInMemory = this.setCacheInMemory.bind(this);
    this.getCache = this.getCache.bind(this);
    this.readCacheFromFile = this.readCacheFromFile.bind(this);
    this.extractCacheData = this.extractCacheData.bind(this);
  }

  get(property) {
    console.log('cache get method');
    return this.buildTree()
      .then((tree) => {
        return this.nodeSelector.query(tree, property)}
      );
  }

  /**
   * Fetch a TTL object to pass on to the logic that will determine if the
   * config we return is valid.
   *
   * @return {<Promise>Hashable}
   */
  buildTree() {
    return this.getTTL()
      .then(this.getValidConfiguration)
      .then(this.extractCacheData);
  }

  extractCacheData(cache) {
    return cache.data;
  }

  getValidConfiguration(ttl) {
    console.log('seconds remaining: ' + ttl.timeRemaining() / 1000);
    if (ttl.isExpired()) {
      console.log('cache expired'.red);
      return this.getRebuiltCache();
    }
    else {
      console.log('using cached config'.green);
      return this.getCache();
    }
  }

  getRebuiltCache() {
    console.log('rebuilding cache'.red);
    return this.component.buildTree()
      .then(this.writeCache)
      .then(this.readCacheFromFile)
      .then(this.setCacheInMemory);
  }

  writeCache(tree) {
    console.log("writing cache to file".grey);
    // throw new Error('You must provide an implementation for the setCache method.');
    const preparedObject = this.prepareCacheObject(tree);

    return jsonFile.writeFile(cacheFileName, preparedObject, {spaces: 2, EOL: '\r\n'})
      .then( res => {
        console.log("writing complete".grey);
      })
      .catch(error => {
        console.error(error);
      });
  }

  readCacheFromFile() {
    console.log('Reading cache from file'.grey);
    return jsonFile.readFile(cacheFileName);
  }

  getCache() {
    // throw new Error('You must provide an implementation for the getCache method.');
    if (cache) {
      console.log('In-memory cache used'.green);
      return Promise.resolve(cache);
    }
    else {
      console.log('No in-memory cache found'.yellow);
      return this.readCacheFromFile()
        .then(this.setCacheInMemory)
        .catch( error => {
          console.log('no file found, but building anyway...'.grey);
          return this.component.buildTree()
            .then(this.writeCache)
            .then(this.readCacheFromFile)
            .then(this.setCacheInMemory);
        });
    }
  }

  setCacheInMemory(fileContents) {
    console.log('Persisting cache in-memory'.grey)
    cache = fileContents;
    return Promise.resolve(cache);
  }

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

  prepareCacheObject(tree) {
    return {
      lastModified: new Date().getTime(),
      data: tree
    };
  }

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
