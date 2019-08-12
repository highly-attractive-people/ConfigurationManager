'use strict';

const conman = require('./src/lib/conman');
const getconman = require('./getcoman');
const nconfSource = require('./src/lib/sources/nconf');
const memorySource = require('./src/lib/sources/memory');
const s3Source = require('./src/lib/sources/s3');
const obfuscated = require('./src/lib/sources/obfuscated');

const colors = require('colors');

const firstMemory = memorySource(
  { name: 'mem1' },
  {
    fox_staging: { encoders: { slce199_fxd1: 'JOSE' } }
  }
);
const secondMemory = memorySource(
  { name: 'mem2' },
  {
    fox_staging: { encoders: { slce199_fxd1: 'YENY' } }
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


const obs = obfuscated(
  { name: 'obs' },
  {
    fox_staging: {
      encoders: {
        slce199_fxd1: 'JOSE',
        slce199_fxd1: ['Eduardo', 'Perdomo', 'Zelaya']
      },
      isBoolean: true,
      isNumber: 1344123
    }
  }
);
const nconfDefault = nconfSource({ name: 'defaultNconf' });

function main() {
  console.log(JSON.stringify(getconman(), null, 4));
}
let counter = 0;
setInterval(() => {
  firstMemory
    .add({
      fox_staging: { encoders: { slce199_fxd1: 'JOSE-' + counter } }
    })
    .add({
      fox_staging: { encoders: { slce199_fxd2: 'JOSE-' + counter } }
    });
  counter++;
}, 1000);

conman({ ttl: 1000 * 15 })
  .addSource(nconfDefault)
  // .addSource(firstMemory)
  // .addSource(secondMemory)
  // .addSource(s3dev)
  // .addSource(obs)
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
