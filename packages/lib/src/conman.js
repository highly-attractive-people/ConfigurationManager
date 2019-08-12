const { mergeDeepRight } = require('ramda');
const NodeSelector = require('./helpers/nodeSelector');
const SECOND = 1000;
const MINUTE = 60 * SECOND;

const defaultLogger = {
  log: console.log,
  info: console.log,
  debug: console.log,
  error: console.log,
  warn: console.log
};

let isInitialized = false;
const sources = [];
let options = {
  // TODO CHANGE THIS TO 5 MINUTES
  ttl: 10 * SECOND,
  logEnabled: true,
  logger: defaultLogger
};

let privateCache = {};
let ttlInterval;
let selector;

function _validateSource(source) {
  if (typeof source.build !== 'function') {
    return 'Source should have a build function';
  }
  if (!source.type) {
    return 'Source should have a type';
  }
  return null;
}

function _ttl() {
  clearInterval(ttlInterval);
  if (options.ttl <= 0) {
    return;
  }
  ttlInterval = setInterval(build, options.ttl);
}

function _init(userOptions = {}) {
  options = { ...options, ...userOptions };
  isInitialized = true;
  selector = new NodeSelector(options);
  return conman;
}

function addSource(source) {
  const sourceError = _validateSource(source);
  if (sourceError) {
    throw new Error(sourceError);
  }
  options.logger.info(`Source "${source.type}" added to conman`);
  sources.push(source);
  return conman;
}

function get(key) {
  if (!isInitialized) {
    throw new Error('Conman has not been initialize');
  }
  if (key === undefined) {
    return privateCache;
  }
  return selector.query(privateCache, key);
}

function build() {
  const sourcesTypes = sources.map(({ name, type }) => name || type);
  options.logger.info(
    `Build triggered for sources: "${sourcesTypes.join()}" at ${new Date().toISOString()}`
  );
  _ttl();
  return Promise.all(sources.map(source => source.build()))
    .then(configs => {
      return configs.reduce((acc, config) => {
        acc = mergeDeepRight(acc, config);
        return acc;
      });
    })
    .then(configs => {
      options.logger.info(
        `Build completed for sources: "${sourcesTypes.join()}" at ${new Date().toISOString()}`
      );
      return setPrivateCache(configs);
    });
}

function setPrivateCache(config) {
  privateCache = config;
}

const conman = _init;
conman.build = build;
conman.addSource = addSource;
conman.get = get;
module.exports = conman;
