'use strict';

const ConfigurationManagerDecoratorInterface = require('./ConfigurationManagerDecoratorInterface');
const TreeSelector = require('./TreeSelector');
const R = require('ramda');

/**
 * Remote Configuration Manager
 * @extends ConfigurationManagerDecoratorInterface
 */
class RemoteConfigurationManager extends ConfigurationManagerDecoratorInterface {
  /**
   * @inheritdoc
   */
  constructor(component, nodeSelector, options) {
    super(component);

    if (!nodeSelector || !nodeSelector.prototype instanceof TreeSelector) {
      throw new Error('You must provide an object that implements to TreeSelector');
    }

    this.nodeSelector = nodeSelector;
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
      _buildTree()
    ])
      .then((values) => {
        return R.mergeDeepRight(values[0], values[1]);
      })
      .catch((error) => {
        console.log('There was an issue with merging trees.', error);
      });
  }
}

const _buildTree = function() {
  return Promise.resolve({
    "user": {
      "color": "blue",
      "name": "Bob"
    },
    "holiday": "Christmas"
  });
}

module.exports = RemoteConfigurationManager;
