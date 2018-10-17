const http = require('http');

let requestHandler = function(request, response) {
  setInterval(() => {
    response.end(JSON.stringify({
      "user": {
        "color": "blue",
        "name": "Steve"
      },
      "holiday": "Christmas",
      "isOffline": false,
      "cacheConfigurationManager": {
        ttl: 116000
      }
    }));
  }, 2000);
}

let server = http.createServer(requestHandler);

server.listen(3000);
