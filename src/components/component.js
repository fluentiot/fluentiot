/**
 * Represents an abstract base class for components with basic functionality.
 *
 * @abstract
 * @class
 */
class Component {
    /**
     * Creates a new Component instance. This constructor should not be called directly.
     * @constructor
     * @param {Fluent} Fluent - The Fluent instance to be used by the component.
     * @throws {Error} If instantiated directly.
     */
    constructor(Fluent) {
        if (new.target === Component) {
            throw new Error('Cannot instantiate abstract class Component.')
        }

        this.Fluent = Fluent
        this._event = null // The cached event component instance.
    }

    /**
     * Retrieves a specific component by name using Fluent.
     *
     * @param {string} name - The name of the component to retrieve.
     * @returns {Object} The requested component.
     */
    getComponent(name) {
        return this.Fluent.component.get(name)
    }

    /**
     * Retrieves the event component, caching it if not already done
     *
     * @returns {Object} The event component instance.
     */
    event() {
        if (!this._event) {
            this._event = this.getComponent('event')
        }
        return this._event
    }

    /**
     * Emits an event through the event component.
     *
     * @param {...any} args - Arguments to be passed to the event emission.
     */
    emit(...args) {
        this.event().emit(...args)
    }
}

module.exports = Component
