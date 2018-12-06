const http = require('http');

let requestHandler = function(request, response) {
  setInterval(() => {
    response.end(JSON.stringify(

      {
        "cacheConfigurationManager": {ttl: 50000},
        "isOffline": false,
        "whateverConfig": "from Remote",
        "nested": {"param": "Banana from Remote"}
      }

  ));
}, 1);
}

let server = http.createServer(requestHandler);

server.listen(3000);
