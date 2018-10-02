'use strict';

const ConfigurationManagerInterface = require('./ConfigurationManagerInterface');
const nodeConfig = require('config');

/**
 * Static Configuration Manager
 *  This concrete class implements ConfigurationManagerInterface using the package
 *  node-config to fetch static config from the disk.
 *
 * @extends ConfigurationManagerInterface
 */
class StaticConfigurationManager extends ConfigurationManagerInterface {

  get(property) {
    try {
      return Promise.resolve(nodeConfig.get(property));
    }
    catch (error) {
      return Promise.reject(error);
    }
  }

  buildTree() {
    try {
        Promise.resolve(nodeConfig);
    }
    catch (error) {
      Promise.reject(error);
    }
  }
}

module.exports = new StaticConfigurationManager();
