# nconf source for conman

Adds an object to conman

## Options

| Options | Description                                                  | Type                                                            | Default |
| ------- | ------------------------------------------------------------ | --------------------------------------------------------------- | ------- |
| name    | name of the source to be used instead of the type            | string                                                          |         |
| key     | key where the source data will be included inside the config | string, if no key is provided data is at the root of the config |         |

## Use example:

```js
const conman = require('@jepz20/conman');
const objSource = require('@jepz20/conman-obj-source');

const obj = objSource(
  { name: 'defaultNconf' }, // you can assign a name
  {
    my: 'value'
  } // object to include
);

conman()
  .addSource(obj)
  .build();
```
