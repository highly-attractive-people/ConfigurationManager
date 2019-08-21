# CONMAN

Conman is a plugabble configuration management library.

- **Centralize**: Add as many sources in the order you prefer to your config. You can use existing sources or define your own.

- **Dependable**: You are guaranteed the sources are built in order from first to last, overriding any overlapping key. Your configuration can be stored in a file, for persistence and audibility.

- **Refreshable**: Based on a TTL, the config rebuilds in the background, or you can trigger a rebuild manually at any point in time.

## Getting Started
```js
// Require conman
const Conman = require('@highly-attractive-people/conman');

// Require the sources you will need in your config
const s3 = require('@highly-attractive-people/conman-s3-source');
const memory = require('@highly-attractive-people/conman-memory-source');

// if your source requires it initialize it
const s3Source = s3({ Bucket: 'Your Bucker' });
const memorySource = memory({ key: 'value' });

const conman = Conman({ ttl: 1000 * 60 * 15 }) // Create a new instance and initialize conman with your options
conman
  .addSource(s3Source) // add all the sources you need by priority
  .addSource(memorySource) // if a key exists in s3Source and memorySource, memorySource will take precedence
  .build() // returns a promise that re$solves when the build process is completed
  .then(config => {
    const key = conman.get('key'); // retreive a key from the store
    // initialize your app, for example a http server
    let requestHandler = function(request, response) {
      if (request.url === '/') {
        conman.build(); // you can rebuild the config at demand
        response.end('👋 BYE');
      }
    };
    let server = http.createServer(requestHandler);

    server.listen(3000);
  });
```

## API

### initialize

`conman(options)` initialize conman with the given options. This is required before you can build or get a value from conman

#### Options

| Options       | Description                                                                    | Type    | Default                         |
| ------------- | ------------------------------------------------------------------------------ | ------- | ------------------------------- |
| ttl           | time in microseconds to rebuild the config. if set to 0 no rebuild is schedule | number  | 60000( 10 minutes)              |
| logEnabled    | if conman should log info and errors                                           | boolean | false                           |
| logger        | object that contains at least a `log` and `error` function for logging         | object  | console                         |
| useFile       | should it write the config to file and read from it if it exists               | boolean | true                            |
| cacheFileName | name of the cache file with the built config                                   | string  | YOUR_APP_ROOT/conman.cache.json |

### addSource

`conman.addSource(source)` adds a source to conman. The source should at least contain a `build` function and a `type`.

### build

`conman.build()`
Build the sources added by the `addSource` method in order from all the added sources and returns promise the resolves when the build is completed and schedules a new build base on the `ttl` option. If `ttl` is `0` a new built is NOT schedule.

If `useFile` option is true, it will try to read a cache file and write the new config to the cache file.
The cache file has the following format:

- **lastModified**: timestamp when the file was created,
- **data**: configuration object

```json
  {
    "lastModified": 498787200000,
    "data": {
      "key": "value"
    }
```

if lastModified exceeds the TTL the data will be ignored and the config will be rebuilt base on the sources

### get

`conman(key)` gets a single key, an array of keys, or the complete config from the configuration object. If you want to retrieve a nested key add a `.` between each key
Examples, if your config looks like:

```json
{
  "my": {
    "precious": {
      "key": "value"
    }
  },
  "another": "another value"
}
```

#### to retrieve a key

```js
const key = conman.get('my');
// returns { "precious": "key": "value } }
```

#### to retrieve a nested key

```js
const key = conman.get('my.precious.key');
// returns "value"
```

#### to retrieve several keys

```js
const key = conman.get(['my.precious.key', 'another']);
// returns ["value","another value"]
```

#### to retrieve the complete config file

```js
const key = conman.get();
/* returns
  {
    "my": {
      "precious": {
        "key": "value"
      }
    },
    "another": "another value"
  }
  */
```

### getObfuscate

`conman.getObfuscate(key, options)` behaves exactly as `conman.get` but returns an obfuscated version of the value.

| Options | Description | Type | Default |
| ------------- | ------------------------------------------------------------------------------ | ------- | ------------------------------- |
| percentage | percentage of the values that should be obfuscated (replaced by the `character` option | float | 0.5 |
| separator| how to divide the value that will be obfuscated | string | '' (empty string) |
| position | What part of the value to obfuscate `start` or `end` | string | end |
| character | what character should be used to obfuscate the value | string | '\*' |

Examples, if your config looks like:

```json
{
  "my": {
    "precious": {
      "key": "value"
    }
  },
  "another": "another-value"
}
```

#### if you retreive a string value

```js
const key = conman.getObfuscated('my.precious.key');
// returns "***ue"
```

#### if you retrieve an object value

```js
const key = conman.getObfuscated('my.precious');
// returns { "**y": "***ue" }
```

#### if you separate by `-`

```js
const key = conman.getObfuscated('another', { separator: '-' });
// returns "*******-value"
```

### stop

`conman.stop()` stops the rebuilt interval schedule base on the TTL

### reset

`conman.reset()` clears all the sources, the configuration cache and resets all defaults options

## Creating your own source

A source can be as simple as an object that contains a `build` and `type` properties.

#### Source interface

- **build(mandatory)**: a function that returns an object or a promise that returns an object. The build method receives the config built from the sources until that point.
- **type(mandatory)**: a string which identifies the type of source
- **name(optional)**: in case you want to identify each instance of your source you can include a name. If a name exists it would be used instead of the `type`

#### Example

```js
const source = (obj, { key, name } = {}) => {
  return {
    build(config) { // recieves the config up until that point
      if (config.extra) {
        return { ...obj, extra: config.extra };
      }
      return obj;
    },
    type: 'syncSource',
    key,
    name
  };
};
```
