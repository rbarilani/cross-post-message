'use strict';

import Util from './Util.js';

/**
 * Cross Post Message Hub Response
 *
 * @class Response
 *
 */
export default class Response {

  /**
   * @param {Request} request A client request
   * @param {object} [attributes] Response attributes
   * @constructor
   */
  constructor(request, attributes) {
    Util.extend(this, attributes || {});
    this.type = Response.TYPE;
    this.request = request;
  }

  /**
   * Check if raw response is a serialized response
   *
   * @param {object} rawResponse
   * @returns {*|boolean}
   */
  static isRaw(rawResponse) {
    return rawResponse
      && rawResponse.type === Response.TYPE
      && rawResponse.request;
  }

  /**
   * Instantiate a new Response from a serialized response
   *
   * @param {object} rawResponse
   * @returns {Response} Response
   */
  static fromRaw(rawResponse) {
    return new Response(rawResponse.request, rawResponse);
  }
}

Response.TYPE = 'response';


