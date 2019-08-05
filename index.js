"use strict";

const colors = require('colors');
const StaticConfigurationManager = require('./src/lib/StaticConfigurationManager');
const RemoteConfigurationManager = require('./src/lib/RemoteConfigurationManager');
// const LaunchDarklyConfigurationManager = require('./src/lib/LaunchDarklyConfigurationManager');
const CacheConfigurationManager = require('./src/lib/CacheConfigurationManagerInterface');
const NodeSelector = require('./src/lib/NodeSelector');

// For demo purpose, I will re-assign decorated config to make commenting out easier.
var conf = new StaticConfigurationManager();
var conf = new RemoteConfigurationManager(conf, NodeSelector, {timeout:3000});
// var conf = new LaunchDarklyConfigurationManager(conf, NodeSelector, {key: 'sdk-68160bd1-a59a-4339-bd5c-858d281540a6', stream: false});
var cacheConfig = new CacheConfigurationManager(conf, NodeSelector, {ttl: 15000});


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

let sampleKeys = ['isOffline', "connectedToLaunchDarkly", "whateverConfig"];
function main() {
  let configKey = sampleKeys[Math.floor(Math.random() * sampleKeys.length)];

  // staticConfig.get(configKey)
  // remoteConfig.get(configKey)
  // ldConfig.get(configKey)
  cacheConfig.get(configKey)
    .then(value => {
      console.log(colors.grey.bold(configKey + ': ' + value));
      console.log('—————————————————————');
    });

}

main();
setInterval(main, 1000);


const http = require('http');

let requestHandler = function(request, response) {
  if (request.url === '/') {
    cacheConfig.clearCache();
    response.end('👋');
  }
}

let server = http.createServer(requestHandler);

server.listen(3001);
