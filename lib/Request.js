var Common = require('./Common');

/**
 * Cross Post Message Client Request
 *
 * @class Request
 *
 * @requires Common
 */
class Request {
  /**
   * Cross Post Message Client Request
   *
   * @private
   * @param {object} attributes
   * @constructor
   */
  constructor(attributes) {
    Common.extend(this, attributes);
    this.event = 'request';
    this.id = Common.generateUUID();
  }
}

module.exports = Request;
