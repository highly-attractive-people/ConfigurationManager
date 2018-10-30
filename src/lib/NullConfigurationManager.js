'use strict';

const ConfigurationManagerInterface = require('./ConfigurationManagerInterface');

/**
 * Null Configuration Manager
 *  This concrete class implements ConfigurationManagerInterface and returns nothing.
 *  Can be useful for testing decorator functionality without introducting
 *  concrete base component functionality.
 *
 * @extends ConfigurationManagerInterface
 */
class NullConfigurationManager extends ConfigurationManagerInterface {

  get(property) {
    return Promise.resolve({});
  }

  buildTree() {
    return Promise.resolve({});
  }
}

module.exports = NullConfigurationManager;
