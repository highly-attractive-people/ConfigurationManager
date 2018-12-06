"use strict";

const colors = require('colors');
const StaticConfigurationManager = require('./src/lib/StaticConfigurationManager');
const RemoteConfigurationManager = require('./src/lib/RemoteConfigurationManager');
const LaunchDarklyConfigurationManager = require('./src/lib/LaunchDarklyConfigurationManager');
const CacheConfigurationManager = require('./src/lib/CacheConfigurationManagerInterface');
const NodeSelector = require('./src/lib/NodeSelector');



var config = new StaticConfigurationManager();
var config = new RemoteConfigurationManager(config, NodeSelector, {timeout:1000});
// var config = new LaunchDarklyConfigurationManager(config, NodeSelector, {key: 'sdk-d00d03f0-3e73-4eca-b002-48c8bb6d020e'});
var config = new CacheConfigurationManager(config, NodeSelector, {ttl: 25000});





/*******************************************************************************
 * Demo 1 - fetch entire cached tree
 */
config.buildTree().then(tree => console.log(tree));
/*******************************************************************************
 * End Demo 1
 */


/*******************************************************************************
 * Demo 2 - fetch individual config items
 */
let sampleKeys = ['isOffline', "whateverConfig", "nested.param"];
function main() {
  let configKey = sampleKeys[Math.floor(Math.random() * sampleKeys.length)];

  config.get(configKey)
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
    config.clearCache();
    response.end('Refresh this page to invoke clearing the cache.');
  }
}

let server = http.createServer(requestHandler);

server.listen(3001);
/*******************************************************************************
 * End Demo 2
*/
