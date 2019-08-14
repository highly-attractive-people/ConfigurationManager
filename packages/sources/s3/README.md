# s3 source for conman

Read the configuration from remote files store in s3.

### Options

| name | description | mandatory |
| ---- | ----------- | ---- |
| accessKeyId | AWS key| yes |
| secretAccessKey | AWS secret | yes |
| region | AWS region| no |
| sessionToken | AWS session token | yes |
| Bucket | S3 Bucket | yes |
| Key(optional) | File name | nox |
| name | source name | no |

If the Key is missing it will grab and combine all the files from the Bucket.

## Use example:

```js
const conman = require('@jepz20/conman');
const s3 = s3Source({
  Bucket: 'dcg-video-live-encoder-service-dev',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_DEFAULT_REGION,
  sessionToken: process.env.AWS_SESSION_TOKEN,
  name: 's3Source'
});


conman()
  .addSource(s3)
  .build();
```
