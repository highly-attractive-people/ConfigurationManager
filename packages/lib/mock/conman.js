function mockedConfig(initialConfig) {
  let config;
  return {
    build(newConf = {}) {
      config = { ...initialConfig, ...newConf };
      return Promise.resolve(config);
    },
    get(property) {
      return property ? config[property] : config;
    },
    addSource() {
      return this;
    },
  };
}

module.exports = mockedConfig;