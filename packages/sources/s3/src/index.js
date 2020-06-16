const AWS = require('aws-sdk');
const { mergeAll } = require('ramda');

const type = 's3';
let s3;

function _log(isEnabled, logger) {
  const fixedLogger = logger;
  if (!logger.log && logger.info) {
    fixedLogger.log = logger.info;
  }

  return function inner(logType, ...args) {
    if (isEnabled) {
      fixedLogger[logType](...args);
    }
  };
}
const defaultLogger = console;

function getAllFiles(params, logger) {
  return s3
    .listObjectsV2(params)
    .promise()
    .then(files => {
      const { Contents } = files;
      return Contents.filter(file => file && file.Key).map(file => file.Key);
    })
    .then(Keys => {
      const promises = Keys.map(Key => getFile({ ...params, Key }, logger));
      return Promise.all(promises).then(mergeAll);
    });
}
function getFile(params, logger) {
  return s3
    .getObject(params)
    .promise()
    .then(file => {
      return JSON.parse(file.Body.toString());
    })
    .catch(error => {
      logger('error', `Error Parsing file ${params.Key} with error: ${error}`);
    });
}

function source(userOptions, awsParams = {}) {
  s3 = new AWS.S3();
  const { name, key } = userOptions;
  const { Bucket, Key, ...userParams } = awsParams;
  AWS.config.update(userParams);
  if (!Bucket) {
    throw new Error('Calling s3 source with null or undefined Bucket');
  }

  function build(config, logger = _log(false, defaultLogger)) {
    if (!Key) {
      return getAllFiles({ Bucket }, logger);
    }

    return getFile({ Bucket, Key }, logger);
  }

  return {
    build,
    type,
    name,
    key
  };
}

module.exports = source;
