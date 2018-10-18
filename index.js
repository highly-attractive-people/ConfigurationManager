"use strict";

const colors = require('colors');
const StaticConfigurationManager = require('./src/lib/StaticConfigurationManager');
const RemoteConfigurationManager = require('./src/lib/RemoteConfigurationManager');
const LaunchDarklyConfigurationManager = require('./src/lib/LaunchDarklyConfigurationManager');
const CacheConfigurationManager = require('./src/lib/CacheConfigurationManagerInterface');
const NodeSelector = require('./src/lib/NodeSelector');

const staticConfig = new StaticConfigurationManager();
const remoteConfig = new RemoteConfigurationManager(staticConfig, NodeSelector, {timeout:3000});
const ldConfig = new LaunchDarklyConfigurationManager(remoteConfig, NodeSelector, {key: 'sdk-68160bd1-a59a-4339-bd5c-858d281540a6', stream: false});
const cacheConfig = new CacheConfigurationManager(remoteConfig, NodeSelector, {ttl: 15000});


// ldConfig.get('connectedToLaunchDarkly')
//   .then(function(value) {
//     console.log('VALUE: ', value)
//   })
//   .catch(err => {
//     console.log('ERROR TOP-LEVEL', err);
//   });



// remoteConfig.buildTree().then(cacheConfig.saveCache).then( () => {
//   console.log('cache was built.');
// });

// cacheConfig.getCache().then( cache => {
//   console.log(cache);
//   cacheConfig.getCache().then( cache => console.log(cache));
// });

// cacheConfig.readCache()
//   .then( (data) => {
//     console.log('read file OK.');
//     console.log(data);
//   })
//   .catch( error => {
//     console.log(error);
//   });

// cacheConfig.clearCache().then( () => {
//   cacheConfig.getTTL()
//     .then(timer => {
//       console.log('Is expired: ', timer.isExpired(new Date().getTime()));
//       console.log('Time Remaining: ', timer.timeRemaining(new Date().getTime()));
//       cacheConfig.getCache().then( cache => console.log(cache));
//     });
// });

// cacheConfig.get('user').then( value => console.log(value));

let sampleKeys = ['isOffline', "connectedToLaunchDarkly"];
function main() {
  let configKey = sampleKeys[Math.floor(Math.random() * sampleKeys.length)];
  console.log('—————————————————————');
  cacheConfig.get(configKey)
    .then(value => console.log(colors.grey.bold(configKey + ': ' + value)) );

}

main();
setInterval(main, 8000);
