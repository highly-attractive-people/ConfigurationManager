const R = require('ramda');
const createObject = (path, value) => {
  let keys = path.split('.');
  let retVal = value;

  while (keys.length) {
    let key = keys.pop();
    retVal = R.objOf(key, retVal);
  }

  return retVal;
}
//
// console.log(createObject('a.b.c', 'value'));  // { a: { b: { c: 'value' } } }


var rawSet = {
  'laugh-out-loud': true,
  'user.occupation': 'engineer',
  'user.occupation.hasBenefits': true
}

function makeTree(raw) {
  return R.mergeAll(
    R.values(
      R.mapObjIndexed(
        (val, key, obj) => {
          return createObject(key, val);
        })(raw)));
}

console.log(makeTree(rawSet));
