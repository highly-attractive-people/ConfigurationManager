"use strict";

const StaticConfigurationManager = require('./src/lib/StaticConfigurationManager');
const RemoteConfigurationManager = require('./src/lib/RemoteConfigurationManager');
const NodeSelector = require('./src/lib/NodeSelector');

const staticConfig = new StaticConfigurationManager();
const remoteConfig = new RemoteConfigurationManager(staticConfig, NodeSelector, {timeout:3000});


remoteConfig.buildTree()
  .then(function(value) {
    console.log('VALUE: ', value)
  })
  .catch(err => {
    console.log('ERROR TOP-LEVEL', err);
  });
