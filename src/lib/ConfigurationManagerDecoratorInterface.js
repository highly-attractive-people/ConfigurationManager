'use strict';

const ConfigurationManagerInterface = require('./ConfigurationManagerInterface');

/**
 * Configuration Manager Decorator Interface.
 *
 * This should contain a property "component" which conforms to
 * ConfigurationManagerInterface. Albeit, Javascript is a dynamic language, we
 * cannot enforce class types on compile time. Likewise, this definition also
 * serves as an abstract class which is implementing the constructor on behalf
 * of concrete decorators.
 *
 * @extends ConfigurationManagerInterface
 */
class ConfigurationManagerDecoratorInterface extends ConfigurationManagerInterface {
  constructor(component) {
    if (!component) {
      throw new Error('You must provide an object that implements to ConfigurationManagerInterface');
    }
    this.component = component;
  }
}

module.exports = ConfigurationManagerDecoratorInterface;
