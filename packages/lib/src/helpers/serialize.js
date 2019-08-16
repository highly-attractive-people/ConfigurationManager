const serialize = (arr, cb, initialValue) => {
  return arr.reduce(
    (accPromise, it) => accPromise.then(acc => cb(acc, it)),
    Promise.resolve(initialValue)
  );
};

module.exports = serialize;