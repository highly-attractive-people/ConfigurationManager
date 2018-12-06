'use strict';

const RemoteConfigurationManager = require('./RemoteConfigurationManager');

class ContextualRemoteConfigurationManager extends RemoteConfigurationManager {
  /**
   * Discussion - client-side
   *
   * Consider accepting an simple object describing the context of the user
   * running the system: the platform, app version, user-specific attributes,
   * et al.
   */

  var context = {
    appVersion: 7.14,
    platform: 'iOS',
    userRegion: 'us-west',
    userSegmentations: [3287324, 189830, 118182]
  }

  /**
   * Discussion - server-side
   *
   * A service contains variations of a specific config.
   */
  'path.to.contextual.config': [
    {
      'expression': ['appVersion gt 7.12', 'platform eq iOS'],
      'value': 'Your app is compatible with X feature.',
      'disabled': false
    }
  ]

  /**
   * Discussion - evaluating rules
   *
   * For each config item with rules, traverse through each variant and return
   * the first value in which all expressions result in true.
   *
   * To optimize, we have to decide which algorithm: iterate over each config
   * with rules; reduce rules to evaluate by elimination of negated values.
   */
}
