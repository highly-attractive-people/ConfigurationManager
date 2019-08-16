jest.mock('jsonfile');
const jsonfile = require('jsonfile');

const conman = require('./conman');

const source = (obj, { key, name } = {}) => {
  return {
    build() {
      return obj;
    },
    type: 'syncSource',
    key,
    name
  };
};

const asyncSource = obj => {
  return {
    build() {
      return Promise.resolve(obj);
    },
    type: 'asyncSource'
  };
};

describe('conman library', () => {
  beforeEach(() => {
    jsonfile.writeFile.mockResolvedValue();
    jsonfile.readFile.mockResolvedValue();
  });
  afterEach(() => {
    jsonfile.writeFile.mockReset();
    jsonfile.readFile.mockReset();
    conman.reset();
  });

  it('should work with default options and no sources', async () => {
    const config = await conman().build();
    conman.stop();
    expect(config).toEqual({});
  });

  it('should build with one asynchronous source', async () => {
    const source1 = asyncSource({ test: 'test' });
    const config = await conman()
      .addSource(source1)
      .build();
    conman.stop();
    expect(config).toEqual({ test: 'test' });
  });

  it('should build with one synchronous source and use the key', async () => {
    const source1 = source({ test: 'test' }, { key: 'TEST' });
    const config = await conman()
      .addSource(source1)
      .build();
    conman.stop();
    expect(config).toEqual({ TEST: { test: 'test' } });
  });

  it('should build with one synchronous source', async () => {
    const source1 = source({ test: 'test async' });
    const config = await conman()
      .addSource(source1)
      .build();
    conman.stop();
    expect(config).toEqual({ test: 'test async' });
  });

  it('should build with more than one source in order', async () => {
    const source1 = asyncSource({ test: 'test async', test2: 'test2' });
    const source2 = source({ test: 'test', test3: 'test3' });
    const config = await conman()
      .addSource(source1)
      .addSource(source2)
      .build();
    conman.stop();
    expect(config).toEqual({ test: 'test', test2: 'test2', test3: 'test3' });
    expect(jsonfile.writeFile).toHaveBeenCalledTimes(1);
    expect(jsonfile.readFile).toHaveBeenCalledTimes(1);
  });

  it('should get one key from the config', async () => {
    const source1 = source({ test: 'test async' });
    await conman()
      .addSource(source1)
      .build();
    conman.stop();
    expect(conman.get('test')).toBe('test async');
  });

  it('should get all the keys in the array from the config', async () => {
    const source1 = source({
      test: 'test async',
      test2: 'test2',
      test3: 'test3'
    });
    await conman()
      .addSource(source1)
      .build();
    conman.stop();
    expect(conman.get(['test', 'test2'])).toEqual(['test async', 'test2']);
  });

  it('should get a deep nested key from the config', async () => {
    const source1 = source({
      test: {
        test2: {
          test3: 'test3'
        }
      }
    });
    await conman()
      .addSource(source1)
      .build();
    conman.stop();
    expect(conman.get('test.test2.test3')).toBe('test3');
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
    await conman()
      .addSource(source1)
      .build();
    conman.stop();
    expect(conman.getObfuscate('test')).toBe('te**');
    expect(conman.getObfuscate('testUndefined')).toBe(undefined);
    expect(conman.getObfuscate('testNull')).toBe(null);
    expect(conman.getObfuscate('testNumber')).toBe('12**');
    expect(conman.getObfuscate('testBoolean')).toBe('tr**');
    expect(conman.getObfuscate('testObj')).toEqual({ 'va***': 'v**' });
    expect(conman.getObfuscate('testArr')).toEqual(['ar**', 'ar**']);
    expect(conman.getObfuscate(['testObj', 'test'])).toEqual([
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
    await conman()
      .addSource(source1)
      .build();
    conman.stop();
    expect(
      conman.getObfuscate('test', { position: 'start', separator: '-' })
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
    await conman()
      .addSource(source1)
      .build();
    conman.stop();
    expect(conman.get('test.test2.test4')).toBe(undefined);
  });

  it('should get the complete config if no key is provided', async () => {
    const source1 = source({ test: 'test async', test2: 'test2' });
    await conman()
      .addSource(source1)
      .build();
    conman.stop();
    expect(conman.get()).toEqual({ test: 'test async', test2: 'test2' });
  });

  it('should rebuild when time expires', async () => {
    const source1 = source({ test: 'test', test3: 'test3' });
    jest.spyOn(source1, 'build');
    await conman({ ttl: 1000 })
      .addSource(source1)
      .build();

    await new Promise(r => setTimeout(r, 3000));
    conman.stop();
    expect(source1.build).toHaveBeenCalledTimes(3);
  });

  it('should use custom options', async () => {
    const options = {
      logger: {
        log: jest.fn(),
        error: jest.fn()
      },
      logEnabled: true,
      useFile: false,
      ttl: 0
    };

    const source1 = source({ test: 'test', test3: 'test3' });
    jest.spyOn(source1, 'build');

    await conman(options)
      .addSource(source1)
      .build();
    expect(options.logger.log).toHaveBeenCalled();
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
    const config = await conman()
      .addSource(source1)
      .build();
    conman.stop();
    expect(config).toEqual({
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
    const config = await conman()
      .addSource(source1)
      .build();
    conman.stop();
    expect(config).toEqual({
      test: 'builtfromsource'
    });
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
