'use strict';

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
  trigger(eventName, /* ... */ args) {
    let _args = Array.prototype.slice.call(arguments);
    _args.shift();
    if (!this._callbacks[eventName]) {
      return this;
    }
    this._callbacks[eventName].forEach((cb) => {
      cb.apply(this, _args);
    });

    return this;
  }
}

module.exports = EventEmitter;
