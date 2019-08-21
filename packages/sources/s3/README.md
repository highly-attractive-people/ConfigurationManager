# s3 source for conman

Read the configuration from remote files store in s3.

### Options

| name            | description                                                  | type                                                            | mandatory |
| --------------- | ------------------------------------------------------------ | --------------------------------------------------------------- | --------- |
| accessKeyId     | AWS key                                                      | yes                                                             |
| secretAccessKey | AWS secret                                                   | yes                                                             |
| region          | AWS region                                                   | no                                                              |
| sessionToken    | AWS session token                                            | yes                                                             |
| Bucket          | S3 Bucket                                                    | yes                                                             |
| Key             | File name                                                    | nox                                                             |
| name            | name of the source to be used instead of the type            | string                                                          | no        |
| key             | key where the source data will be included inside the config | string, if no key is provided data is at the root of the config | no        |

If the Key is missing it will grab and combine all the files from the Bucket.

## Use example:

```js
const conman = require('@highly-attractive-people/conman');
const s3 = s3Source(
  { name: 's3Source', key: 's3' },
  {
    Bucket: 'dcg-video-live-encoder-service-dev',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_DEFAULT_REGION,
    sessionToken: process.env.AWS_SESSION_TOKEN
  }
);

conman()
  .addSource(s3)
  .build();
```
