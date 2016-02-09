/**
 * @class EventEmitter
 */
class EventEmitter {

  /**
   * @constructor
   */
  constructor() {
    this._callbacks = {};
  }

  /**
   * Subscribe to events
   *
   * @param {string} eventName - event name (ready|response)
   * @param {Function} cb - the function to be invoked
   * @returns {EventEmitter}
   */
  on(eventName, cb) {
    this._callbacks[eventName] = this._callbacks[eventName] || [];
    this._callbacks[eventName].push(cb);
    return this;
  }

  /**
   * Trigger an event with variadic arguments
   *
   * @param {string} eventName
   * @param {...} [args]
   * @returns {EventEmitter}
   */
  trigger(eventName, ...args) {
    if (!this._callbacks[eventName]) {
      return this;
    }
    this._callbacks[eventName].forEach((cb) => {
      cb.apply(this, args);
    });

    return this;
  }
}

module.exports = EventEmitter;
