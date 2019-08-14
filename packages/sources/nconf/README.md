# nconf source for conman

Uses nconf to import:

1. Environment Variables
1. Arguments
1. Files from
   - `${appRoot}/config/${appEnv}.env.json`
   - `${appRoot}/config/default.env.json`
   - `${__dirname}/../defaults/${appEnv}.env.json`
   - `${__dirname}/../defaults/default.env.json`

## Use example:

```js
const conman = require('@jepz20/conman');
const nconfSource = require('@jepz20/conman-nconf-source');

const nconf = nconfSource({ name: 'defaultNconf' }); // you can assign a name

conman({ ttl: 1000 * 15, logEnabled: true })
  .addSource(nconf)
  .build();
```
