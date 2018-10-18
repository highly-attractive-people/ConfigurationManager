const http = require('http');

let requestHandler = function(request, response) {
  setInterval(() => {
    response.end(JSON.stringify({
      "user": {
        "color": "blue",
        "name": "Steve"
      },
      "holiday": "Christmas",
      "isOffline": "NEVER!",
      "cacheConfigurationManager": {
        ttl: 25000
      }
    }));
  }, 2000);
}

let server = http.createServer(requestHandler);

server.listen(3000);
