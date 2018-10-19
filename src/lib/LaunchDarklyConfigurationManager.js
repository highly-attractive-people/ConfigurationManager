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
  _buildTree() {
    console.log('Building LD tree..');
    this.ldClient = LaunchDarkly.init(this.options.key, this.options);

    const anonymousUser = {
      anonymous: true,
      key:''
    };

    return this.ldClient.waitForInitialization()
      .then(client => {
        return client.allFlagsState(anonymousUser)
          .then(flagState => {
            client.close();
            return flagState.allValues();
          })
      })
      .catch( e => console.error(e));
  }
}

module.exports = LaunchDarklyConfigurationManager;
