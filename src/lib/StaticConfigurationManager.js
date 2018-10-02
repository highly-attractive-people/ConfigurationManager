"use strict";

const ConfigurationManagerInterface = require('./ConfigurationManagerInterface');
const nodeConfig = require('config');

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
