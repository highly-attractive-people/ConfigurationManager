'use strict';

const RemoteConfigurationManager = require('./RemoteConfigurationManager');
const LaunchDarkly = require('ldclient-node');
const R = require('ramda');

const defaultOptions = {
  key: null
};

function texturize(path, value) {
  let keys = path.split('.');
  let retVal = value;

  while (keys.length) {
    let key = keys.pop();
    retVal = R.objOf(key, retVal);
  }

  return retVal;
}


function makeTree(ldResponseObject) {
  return R.mergeAll(
    R.values(
      R.mapObjIndexed(
        (val, key, obj) => {
          return texturize(key, val);
        })(ldResponseObject)));
}

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
            return makeTree(flagState.allValues());
          })
      })
      .catch( e => console.error(e));
  }
}

module.exports = LaunchDarklyConfigurationManager;
