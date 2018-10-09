'use strict';

const ConfigurationManagerDecoratorInterface = require('./ConfigurationManagerDecoratorInterface');
const TreeSelector = require('./TreeSelector');
const { mergeDeepRight } = require('ramda');
const request = require('request-promise-native');


/**
 * Remote Configuration Manager
 * @extends ConfigurationManagerDecoratorInterface
 */
class RemoteConfigurationManager extends ConfigurationManagerDecoratorInterface {
  /**
   * @inheritdoc
   */
  constructor(component, nodeSelector, options = {}) {
    super(component);

    if (!nodeSelector || !nodeSelector.prototype instanceof TreeSelector) {
      throw new Error('You must provide an object that implements to TreeSelector');
    }

    this.nodeSelector = nodeSelector;
    this.options = mergeDeepRight(defaultOptions, options);
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
    return Promise.all([
      this.component.buildTree(),
      this._buildTree()
    ])
      .then((values) => {
        return mergeDeepRight(values[0], values[1]);
      })
      .catch((error) => {
        console.log('There was an issue with merging trees.', error);
      });
  }

  /**
   * "Private" function responsible for fetching the remote data.
   * @return {Promise<Object>}
   *   Native object representing configuration directly from the remote service.
   */
   _buildTree() {
    return request({uri:this.options.remoteConfigURI, json:true, timeout: this.options.timeout})
      .catch(error => {
        console.error(error.message);

        return {};
      });
  }
}

const defaultOptions = {
  remoteConfigURI: 'http://localhost:3000/',
  timeout: 2000
};

module.exports = RemoteConfigurationManager;
