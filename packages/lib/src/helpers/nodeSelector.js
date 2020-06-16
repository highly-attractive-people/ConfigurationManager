/**
 * Node Selector traverses a tree structure and fetches the value of a node,
 * specified by the provided Xpath-like string representation.
 */

/**
 * Private helper function to iterate over tree recursively.
 *
 * @param  {object} tree
 * @param  {string} property
 * @return {Mixed}
 */
function _query(tree, property) {
  const propertyNameParts = Array.isArray(property)
    ? property
    : property.split('.');

  const name = propertyNameParts[0];
  const value = tree[name];

  if (propertyNameParts.length <= 1) {
    return value;
  }

  // Note that typeof null === 'object'
  if (value === null || typeof value !== 'object') {
    return undefined;
  }

  return _query(value, propertyNameParts.slice(1));
}

function nodeSelector(logger) {
  function query(tree, property) {
    if (tree === null || tree === undefined) {
      throw new Error(
        'Calling NodeSelector.query() with null or undefined tree argument'
      );
    }

    if (property === null || property === undefined) {
      throw new Error(
        'Calling NodeSelector.query() with null or undefined property argument'
      );
    }

    const value = _query(tree, property);

    if (value === undefined) {
      logger('debug', `Property "${property}" is not defined.`);
    }

    return value;
  }
  return {
    query
  };
}

module.exports = nodeSelector;
