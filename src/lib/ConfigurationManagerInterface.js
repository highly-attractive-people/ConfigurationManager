"use strict";

/**
 * Configuration Manager.
 *
 * This is the core subject of a Decorator pattern.
 */
class ConfigurationManagerInterface {
  /**
   * Retrieves the corresponding value of the specified property slug.
   *
   * @param  {string} property
   *  A string representation of the path to an object. The path nodes are
   *  delimited by periods (.)
   *
   * @return {array|boolean|number|object|string}
   *  The value of a configuration.
   */
  get(property) {
    throw new Error('You must provide an implementation for the get method.');
  }

  /**
   * This will fetch the entire tree of configurations in which one can traverse
   * over for querying for values.
   *
   * @return {object}
   *  More specifically, a hash of key/value pairs.
   */
  buildTree() {
    throw new Error('You must provide an implementation for the buildTree method.');
  }
}

module.exports = ConfigurationManagerInterface;
