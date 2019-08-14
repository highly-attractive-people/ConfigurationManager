const http = require('http');

const conman = require('./packages/lib/src/conman');
const getconman = require('./getcoman');
const nconfSource = require('./packages/sources/nconf/src');
const memorySource = require('./packages/sources/object/src');
const s3Source = require('./packages/sources/s3/src');

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
      fox_stag_ing: { encoders: { slce199_fxd1: `TEST ${counter}` } }
    })
    .add({
      fox_stag_ing: { encoders: { slce199_fxd2: `TEST ${counter}` } }
    });
  counter += 1;
}, 1000);

conman({ ttl: 1000 * 15, logEnabled: true })
  .addSource(nconfDefault)
  .addSource(firstMemory)
  .addSource(secondMemory)
  .addSource(s3dev)
  .build()
  .then(() => {
    setInterval(main, 3000);
    function requestHandler(request, response) {
      if (request.url === '/') {
        conman.build();
        response.end('👋 BYE');
      }
    }

    const server = http.createServer(requestHandler);

    server.listen(3001);
  });
