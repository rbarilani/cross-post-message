var Util = require('./Util');

/**
 * Cross Post Message Hub Response
 *
 * @class Response
 *
 * @requires Util
 */
class Response {

  /**
   * @param {Request} request A client request
   * @param {object} [attributes] Response attributes
   * @constructor
   */
  constructor(request, attributes) {
    Util.extend(this, attributes || {});
    this.event = 'response';
    this.request = request;
  }

}

module.exports = Response;
