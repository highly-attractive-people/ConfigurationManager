const AWS = require('aws-sdk');
const { mergeAll } = require('ramda');

const type = 's3';
let s3;

function getAllFiles(params) {
  return s3
    .listObjectsV2(params)
    .promise()
    .then(files => {
      const { Contents } = files;
      return Contents.filter(file => file && file.Key).map(file => file.Key);
    })
    .then(Keys => {
      const promises = Keys.map(Key => getFile({ ...params, Key }));
      return Promise.all(promises).then(mergeAll);
    });
}
function getFile(params) {
  return s3
    .getObject(params)
    .promise()
    .then(file => {
      return JSON.parse(file.Body.toString());
    });
}

function source(userOptions) {
  s3 = new AWS.S3();
  const { Bucket, Key, name, ...options } = userOptions;
  AWS.config.update(options);
  if (!Bucket) {
    throw new Error('Calling s3 source with null or undefined Bucket');
  }

  function build() {
    if (!Key) {
      return getAllFiles({ Bucket });
    }

    return getFile({ Bucket, Key });
  }

  return {
    build,
    type,
    name
  };
}

module.exports = source;
