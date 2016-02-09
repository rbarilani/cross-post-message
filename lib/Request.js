'use strict';

import Util from './Util.js';

/**
 * Cross Post Message Client Request
 *
 * @class Request
 *
 */
export default class Request {

  /**
   *
   * @param {object} attributes
   * @param {string} [id=null] A uuid to identify the request, if null it will be generated
   *
   * @constructor
   */
  constructor(attributes, id = null) {
    Util.extend(this, attributes);
    this.type = Request.TYPE;
    this.id = id || Util.generateUUID();
  }

  /**
   * Check if raw request is a serialized request
   *
   * @param {object} rawRequest
   * @returns {*|boolean}
   */
  static isRaw(rawRequest) {
    return rawRequest
      && rawRequest.type === Request.TYPE
      && rawRequest.id;
  }

  /**
   * Instantiate a new Request from a serialized request
   * @param rawRequest
   */
  static fromRaw(rawRequest) {
    return new Request(rawRequest, rawRequest.id);
  }
}

Request.TYPE = 'request';



