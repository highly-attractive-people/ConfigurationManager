"use strict";

const StaticConfigurationManager = require('./src/lib/StaticConfigurationManager');
const RemoteConfigurationManager = require('./src/lib/RemoteConfigurationManager');
const LaunchDarklyConfigurationManager = require('./src/lib/LaunchDarklyConfigurationManager');
const NodeSelector = require('./src/lib/NodeSelector');

const staticConfig = new StaticConfigurationManager();
const remoteConfig = new RemoteConfigurationManager(staticConfig, NodeSelector, {timeout:3000});
const ldConfig = new LaunchDarklyConfigurationManager(remoteConfig, NodeSelector, {key: 'sdk-68160bd1-a59a-4339-bd5c-858d281540a6'});


ldConfig.buildTree()
  .then(function(value) {
    console.log('VALUE: ', value)
  })
  .catch(err => {
    console.log('ERROR TOP-LEVEL', err);
  });
