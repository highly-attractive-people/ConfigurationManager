'use strict';

const nconf = require('nconf');
const appRoot = require('app-root-path');
const type = 'nconf';

function source(userOptions) {
  const { name } = userOptions;
  function build() {
    nconf
      .use('memory')
      .argv()
      .env({
        transform(obj) {
          obj.value = obj.value.trim();
          return obj;
        }
      });

    /**
     * Gets the current app env to be able to load the defaults.
     * @type {string}
     */
    const appEnv = (nconf.get('APP_ENV') || 'local').trim();

    nconf
      .file('service-env', `${appRoot}/config/${appEnv}.env.json`)
      .file('service-defaults', `${appRoot}/config/default.env.json`)
      .file('shared-env', `${__dirname}/../defaults/${appEnv}.env.json`)
      .file('shared-defaults', `${__dirname}/../defaults/default.env.json`);

    return nconf.get();
  }

  return {
    build,
    type,
    name
  };
}

module.exports = source;
