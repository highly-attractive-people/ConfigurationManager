jest.mock('jsonfile');
const jsonfile = require('jsonfile');

const conman = require('./conman');

const source = (obj = {}, { key, name } = {}) => {
  return {
    build(config) {
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

const asyncSource = (obj = {}, { key, name } = {}) => {
  return {
    build(config) {
      if (config.extra) {
        return Promise.resolve({ ...obj, extra: config.extra });
      }
      return Promise.resolve(obj);
    },
    type: 'asyncSource',
    key,
    name
  };
};

const logger = {
  log: jest.fn(),
  error: jest.fn()
};

describe('conman library', () => {
  beforeEach(() => {
    jsonfile.writeFile.mockResolvedValue();
    jsonfile.readFile.mockResolvedValue();
  });
  afterEach(() => {
    jsonfile.writeFile.mockReset();
    jsonfile.readFile.mockReset();
    logger.log.mockReset();
    logger.error.mockReset();
  });

  it('should work with default options and no sources', async () => {
    const config = conman();
    const data = await config.build();
    config.stop();
    expect(data).toEqual({});
  });

  it('should build with one asynchronous source', async () => {
    const source1 = asyncSource({ test: 'test' });
    const config = conman();
    const data = await config.addSource(source1).build();
    config.stop();
    expect(data).toEqual({ test: 'test' });
  });

  it('should build with one synchronous source and use the key', async () => {
    const source1 = source({ test: 'test' }, { key: 'TEST' });
    const config = conman();
    const data = await config.addSource(source1).build();
    config.stop();
    expect(data).toEqual({ TEST: { test: 'test' } });
  });

  it('should build with one synchronous source and pass the configf', async () => {
    const source1 = source({ test: 'test', extra: 'extra config' });
    const source2 = source({ test: 'usesConfig' });
    const config = conman();
    const data = await config
      .addSource(source1)
      .addSource(source2)
      .build();
    config.stop();
    expect(data).toEqual({ test: 'usesConfig', extra: 'extra config' });
  });

  it('should build with one asynchronous source and pass the configf', async () => {
    const source1 = asyncSource({ test: 'test', extra: 'extra config async' });
    const source2 = asyncSource({ test: 'usesConfig' });
    const config = conman();
    const data = await config
      .addSource(source1)
      .addSource(source2)
      .build();
    config.stop();
    expect(data).toEqual({ test: 'usesConfig', extra: 'extra config async' });
  });

  it('should build with one synchronous source', async () => {
    const source1 = source({ test: 'test async' });
    const config = conman();
    const data = await config.addSource(source1).build();
    config.stop();
    expect(data).toEqual({ test: 'test async' });
  });

  it('should build with more than one source in order', async () => {
    const source1 = asyncSource({ test: 'test async', test2: 'test2' });
    const source2 = source({ test: 'test', test3: 'test3' });
    const config = conman();
    const data = await config
      .addSource(source1)
      .addSource(source2)
      .build();
    config.stop();
    expect(data).toEqual({ test: 'test', test2: 'test2', test3: 'test3' });
    expect(jsonfile.writeFile).toHaveBeenCalledTimes(1);
    expect(jsonfile.readFile).toHaveBeenCalledTimes(1);
  });

  it('should get one key from the config', async () => {
    const source1 = source({ test: 'test async' });
    const config = conman();
    await config.addSource(source1).build();
    config.stop();
    expect(config.get('test')).toBe('test async');
  });

  it('should get all the keys in the array from the config', async () => {
    const source1 = source({
      test: 'test async',
      test2: 'test2',
      test3: 'test3'
    });
    const config = conman();
    await config.addSource(source1).build();
    config.stop();
    expect(config.get(['test', 'test2'])).toEqual(['test async', 'test2']);
  });

  it('should get a deep nested key from the config', async () => {
    const source1 = source({
      test: {
        test2: {
          test3: 'test3'
        }
      }
    });
    const config = conman();
    await config.addSource(source1).build();
    config.stop();
    expect(config.get('test.test2.test3')).toBe('test3');
  });

  it('should get obfuscated value from the config', async () => {
    const source1 = source({
      test: 'test',
      testObj: {
        value: 'val'
      },
      testUndefined: undefined,
      testNull: null,
      testNumber: 1234,
      testBoolean: true,
      testArr: ['arr1', 'arr2']
    });
    const config = conman();
    await config.addSource(source1).build();
    config.stop();
    expect(config.getObfuscate('test')).toBe('te**');
    expect(config.getObfuscate('testUndefined')).toBe(undefined);
    expect(config.getObfuscate('testNull')).toBe(null);
    expect(config.getObfuscate('testNumber')).toBe('12**');
    expect(config.getObfuscate('testBoolean')).toBe('tr**');
    expect(config.getObfuscate('testObj')).toEqual({ 'va***': 'v**' });
    expect(config.getObfuscate('testArr')).toEqual(['ar**', 'ar**']);
    expect(config.getObfuscate(['testObj', 'test'])).toEqual([
      { 'va***': 'v**' },
      'te**'
    ]);
  });

  it('should get obfuscated value from the config with custom options', async () => {
    const source1 = source({
      test: 'te-st',
      testObj: {
        value: 'va-l'
      },
      testArr: ['arr-1', 'a-rr2']
    });
    const config = conman();
    await config.addSource(source1).build();
    config.stop();
    expect(
      config.getObfuscate('test', { position: 'start', separator: '-' })
    ).toBe('***st');
  });

  it('should return undefined if the key doesnt exist in the config', async () => {
    const source1 = source({
      test: {
        test2: {
          test3: 'test3'
        }
      }
    });
    const config = conman();
    await config.addSource(source1).build();
    config.stop();
    expect(config.get('test.test2.test4')).toBe(undefined);
  });

  it('should get the complete config if no key is provided', async () => {
    const source1 = source({ test: 'test async', test2: 'test2' });
    const config = conman();
    await config.addSource(source1).build();
    config.stop();
    expect(config.get()).toEqual({ test: 'test async', test2: 'test2' });
  });

  it('should rebuild when time expires', async () => {
    const source1 = source({ test: 'test', test3: 'test3' });
    jest.spyOn(source1, 'build');
    const config = conman({ ttl: 1000 });
    await config.addSource(source1).build();

    await new Promise(r => setTimeout(r, 3000));
    config.stop();
    expect(source1.build).toHaveBeenCalledTimes(3);
  });

  it('should use custom options', async () => {
    const options = {
      logger,
      logEnabled: true,
      useFile: false,
      ttl: 0
    };

    const source1 = source({ test: 'test', test3: 'test3' });
    jest.spyOn(source1, 'build');
    const config = conman(options);
    await config.addSource(source1).build();
    expect(options.logger.log).toHaveBeenCalled();
    expect(jsonfile.writeFile).toHaveBeenCalledTimes(0);
    expect(jsonfile.readFile).toHaveBeenCalledTimes(0);
    expect(source1.build).toHaveBeenCalledTimes(1);
  });

  it('should use logger info if no logger log is provided', async () => {
    const customLogger = {
      info: jest.fn(),
      error: jest.fn()
    };

    const options = {
      logger: customLogger,
      logEnabled: true,
      useFile: false,
      ttl: 0
    };

    const source1 = source({ test: 'test', test3: 'test3' });
    jest.spyOn(source1, 'build');
    const config = conman(options);
    await config.addSource(source1).build();
    expect(options.logger.info).toHaveBeenCalled();
    expect(jsonfile.writeFile).toHaveBeenCalledTimes(0);
    expect(jsonfile.readFile).toHaveBeenCalledTimes(0);
    expect(source1.build).toHaveBeenCalledTimes(1);
  });


  it('should use the file if is NOT expired', async () => {
    const source1 = source({ test: 'test', test3: 'test3' });
    jsonfile.readFile.mockResolvedValueOnce({
      lastModified: new Date().getTime(),
      data: {
        test: 'readfromfile'
      }
    });
    const config = conman();
    const data = await config.addSource(source1).build();
    config.stop();
    expect(data).toEqual({
      test: 'readfromfile'
    });
  });

  it('should NOT use the file if is expired', async () => {
    const source1 = source({ test: 'builtfromsource' });
    jsonfile.readFile.mockResolvedValueOnce({
      lastModified: new Date().getTime() - 1000 * 60 * 60 * 24,
      data: {
        test: 'readfromfile'
      }
    });
    const config = conman();
    const data = await config.addSource(source1).build();
    config.stop();
    expect(data).toEqual({
      test: 'builtfromsource'
    });
  });

  it('should build even if failed to read file and logs an error', async () => {
    const source1 = source({ test: 'builtfromsource' });
    jsonfile.readFile.mockRejectedValueOnce();
    const config = conman({
      logEnabled: true,
      logger
    });
    const data = await config.addSource(source1).build();
    config.stop();
    expect(data).toEqual({
      test: 'builtfromsource'
    });
    expect(logger.error).toHaveBeenCalledTimes(1);
  });

  it('should build even if failed to write file and logs an error', async () => {
    const source1 = source({ test: 'test', test3: 'test3' });
    jsonfile.writeFile.mockRejectedValueOnce();
    const config = conman({
      logEnabled: true,
      logger
    });
    const data = await config.addSource(source1).build();
    config.stop();
    expect(data).toEqual({ test: 'test', test3: 'test3' });
    expect(logger.error).toHaveBeenCalledTimes(1);
  });

  it(`should create independent instances with the provider`, async () => {
    const conman1 = conman({ ttl: 0 });
    const conman2 = conman({ ttl: 0 });

    await conman1.addSource(source({ test: 'conman1' })).build();
    await conman2.addSource(source({ test: 'conman2' })).build();

    expect(conman1.get()).toEqual({ test: 'conman1' });
    expect(conman2.get()).toEqual({ test: 'conman2' });

    conman1.reset();
    expect(conman1.get()).toEqual({});
    expect(conman2.get()).toEqual({ test: 'conman2' });
  });

  it('should throw an error if the source is missing its build property', async () => {
    expect(() => conman().addSource({ type: 'source' })).toThrow();
  });

  it(`should throw an error if the source's build is not a function`, async () => {
    expect(() =>
      conman().addSource({ type: 'source', build: 'not a function' })
    ).toThrow();
  });

  it(`should throw an error if the source is missing its type`, async () => {
    expect(() =>
      conman().addSource({
        build() {
          return {};
        }
      })
    ).toThrow();
  });
});
