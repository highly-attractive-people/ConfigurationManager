'use strict';

const RemoteConfigurationManager = require('./RemoteConfigurationManager');
const LaunchDarkly = require('ldclient-node');

const defaultOptions = {
  key: null
};

/**
 * Launch Darkly Configuration Manager
 *   Decorator/Adapter class for using the remote feature flagging service, Launch Darkly.
 *
 * @extends RemoteConfigurationManager
 */
class LaunchDarklyConfigurationManager extends RemoteConfigurationManager {
  /**
   * @inheritdoc
   */
  constructor(component, nodeSelector, options = {}) {
    super(component, nodeSelector, options);

    this.ldclient = LaunchDarkly.init(options.key);
  }

  /**
   * @inheritdoc
   */
  _buildTree() {
    console.log('Building LD tree..');
    const anonymousUser = {
      anonymous: true,
      key:''
    };

    return new Promise( (resolve, reject) => {
      this.ldclient.once('ready', () => {
        this.ldclient.allFlagsState(anonymousUser, (error, flagState) => {
          if (error) {
            console.error(error);
            this.ldclient.close();
            return resolve({});
          }
          this.ldclient.close();
          return resolve(flagState.allValues());
        });
      });
    });
  }
}

module.exports = LaunchDarklyConfigurationManager;
