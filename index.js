"use strict";

const StaticConfigurationManager = require('./src/lib/StaticConfigurationManager');
const RemoteConfigurationManager = require('./src/lib/RemoteConfigurationManager');
const NodeSelector = require('./src/lib/NodeSelector');

const staticConfig = new StaticConfigurationManager();
const remoteConfig = new RemoteConfigurationManager(staticConfig, NodeSelector, {});


remoteConfig.get('user')
  .then(function(value) {
    console.log(value)
  })
  .catch(err => {
    console.log(err);
  });
