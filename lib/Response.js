var Common = require('./Common');

/**
 * Cross Post Message Hub Response
 *
 * @class Response
 *
 * @requires Common
 */
class Response {

  /**
   * @param {Request} request A client request
   * @param {object} [attributes] Response attributes
   * @constructor
   */
  constructor(request, attributes) {
    Common.extend(this, attributes || {});
    this.event = 'response';
    this.request = request;
  }

}

module.exports = Response;
