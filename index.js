const http = require('http');

const conman = require('./packages/lib/src/conman');
const getconman = require('./getcoman');
const nconfSource = require('./packages/sources/nconf/src');
const objectSource = require('./packages/sources/object/src');
const s3Source = require('./packages/sources/s3/src');

const firstObj = objectSource(
  { name: 'mem1' },
  {
    fox_staging: { encoders: { slce199_fxd1: 'JOSE' } }
  }
);
const secondObj = objectSource(
  { name: 'mem2', key: 'CHANNEL_GROUPS' },
  {
    fox_staging: { encoders: { slce199_fxd1: 'YENY' } }
  }
);
const s3dev = s3Source(
  {
    name: 's3dev',
    key: 'CHANNEL_GROUPS'
  },
  {
    Bucket: 'dcg-video-live-encoder-service-dev',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_DEFAULT_REGION,
    sessionToken: process.env.AWS_SESSION_TOKEN
  }
);

const nconfDefault = nconfSource({ name: 'defaultNconf' });

function main() {
  console.log(JSON.stringify(getconman(), null, 4));
}
let counter = 0;
setInterval(() => {
  firstObj
    .add({
      fox_staging: { encoders: { slce199_fxd1: `TEST ${counter}` } }
    })
    .add({
      fox_staging: { encoders: { slce199_fxd2: `TEST ${counter}` } }
    });
  counter += 1;
}, 1000);

conman({ ttl: 1000 * 15, logEnabled: true })
  .addSource(nconfDefault)
  .addSource(firstObj)
  .addSource(secondObj)
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
