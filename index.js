"use strict";

const configManager = require('./src/lib/StaticConfigurationManager');

let remoteConfig = {
  "user": {
    "type": "human"
  }
};

configManager.get('user')
  .then(function(value) {console.log(value)});
