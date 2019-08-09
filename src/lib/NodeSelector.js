'use strict';

const TreeSelector = require('./TreeSelector');

/**
 * Node Selector traverses a tree structure and fetches the value of a node,
 * specified by the provided Xpath-like string representation.
 */
class NodeSelector extends TreeSelector {
  constructor(options) {
    super();
    this.options = options;
  }
  /**
   * Query a tree structure provided a XPath-like string.
   *
   * @param  {object} tree
   * @param  {string} property
   * @return {Mixed}
   */
  query(tree, property) {
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

    var value = _query(tree, property);

    if (value === undefined) {
      this.options.logger.error('Property "' + property + '" is not defined.');
    }

    return value;
  }
}

/**
 * Private helper function to iterate over tree recursively.
 *
 * @param  {object} tree
 * @param  {string} property
 * @return {Mixed}
 */
function _query(tree, property) {
  let propertyNameParts = Array.isArray(property)
      ? property
      : property.split('.'),
    name = propertyNameParts[0],
    value = tree[name];

  if (propertyNameParts.length <= 1) {
    return value;
  }

  // Note that typeof null === 'object'
  if (value === null || typeof value !== 'object') {
    return undefined;
  }

  return _query(value, propertyNameParts.slice(1));
}

module.exports = NodeSelector;
