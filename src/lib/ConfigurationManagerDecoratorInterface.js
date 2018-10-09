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
  /**
   * This interface has a component, as well as is a component, which enables
   * the decorator pattern.
   * @param {ConfigurationManagerInterface} component
   *   A class that represents the child component.
   */
  constructor(component) {
    super();

    if (!component || !component.prototype instanceof ConfigurationManagerInterface) {
      throw new Error('You must provide an object that implements to ConfigurationManagerInterface');
    }
    this.component = component;
  }

}

module.exports = ConfigurationManagerDecoratorInterface;
