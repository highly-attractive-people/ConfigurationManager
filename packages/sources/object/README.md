# nconf source for conman

Adds an object to conman

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
