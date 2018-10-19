const http = require('http');

let requestHandler = function(request, response) {
  setInterval(() => {
    response.end(JSON.stringify({
      "connectedToLaunchDarkly": "Who needs Launch Darkly?",
      "isOffline": "Nope!!",
      "cacheConfigurationManager": {
        ttl: 15000
      }
    }));
  }, 2000);
}

let server = http.createServer(requestHandler);

server.listen(3000);
