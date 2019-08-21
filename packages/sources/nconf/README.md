# nconf source for conman

Uses nconf to import:

1. Environment Variables
1. Arguments
1. Files from
   - `${appRoot}/config/${appEnv}.env.json`
   - `${appRoot}/config/default.env.json`
   - `${__dirname}/../defaults/${appEnv}.env.json`
   - `${__dirname}/../defaults/default.env.json`


## Options
| Options       | Description                                                                    | Type    | Default                         |
| ------------- | ------------------------------------------------------------------------------ | ------- | ------------------------------- |
| name           | name of the source to be used instead of the type | string  | |
| key    |  key where the source data will be included inside the config| string, if no key is provided data is at the root of the config | |

## Use example:

```js
const conman = require('@highly-attractive-people/conman');
const nconfSource = require('@highly-attractive-people/conman-nconf-source');

const nconf = nconfSource({ name: 'defaultNconf' }); // you can assign a name

conman()
  .addSource(nconf)
  .build();
```
