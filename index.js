'use strict';

const conman = require('./packages/lib/conman');
const getconman = require('./getcoman');
const nconfSource = require('./packages/sources/nconf');
const memorySource = require('./packages/sources/memory');
const s3Source = require('./packages/sources/s3');

const colors = require('colors');

const firstMemory = memorySource(
  { name: 'mem1' },
  {
    fox_stag_ing: { encoders: { slce199_fxd1: 'JOSE' } }
  }
);
const secondMemory = memorySource(
  { name: 'mem2' },
  {
    fox_stag_ing: { encoders: { slce199_fxd1: 'YENY' } }
  }
);
const s3dev = s3Source({
  Bucket: 'dcg-video-live-encoder-service-dev',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_DEFAULT_REGION,
  sessionToken: process.env.AWS_SESSION_TOKEN,
  name: 's3dev'
});

const nconfDefault = nconfSource({ name: 'defaultNconf' });

function main() {
  console.log(
    JSON.stringify(getconman(['fox_stag_ing.encoders', undefined]), null, 4)
  );
}
let counter = 0;
setInterval(() => {
  firstMemory
    .add({
      fox_stag_ing: { encoders: { slce199_fxd1: 'JOSE-' + counter } }
    })
    .add({
      fox_stag_ing: { encoders: { slce199_fxd2: 'JOSE-' + counter } }
    });
  counter++;
}, 1000);

conman({ ttl: 1000 * 15 })
  // .addSource(nconfDefault)
  .addSource(firstMemory)
  .addSource(secondMemory)
  // .addSource(s3dev)
  .build()
  .then(() => {
    setInterval(main, 3000);
    let requestHandler = function(request, response) {
      if (request.url === '/') {
        conman.build();
        response.end('👋 BYE');
      }
    };

    let server = http.createServer(requestHandler);

    server.listen(3001);
  });

const http = require('http');
