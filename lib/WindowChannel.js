'use strict';

/**
 * @class WindowChannel
 */
export default class WindowChannel {
  /**
   * @constructor
   * @param {Window|{postMessage: Function}} source
   */
  constructor(source) {
    /**
     * @type {Window}
     */
    this.source = source;
  }

  /**
   * @see Window.postMessage
   * @param message
   * @param targetOrigin
   * @param transfer
   */
  postMessage(message, targetOrigin, transfer) {
    let _message = (typeof message === 'string') ? message : JSON.stringify(message);
    this.source.postMessage(_message, targetOrigin || '*', transfer);
  }
}
