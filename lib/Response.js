'use strict';

import Util from './Util';

/**
 * Cross Post Message Hub Response
 *
 * @class Response
 *
 * @requires Util
 */
export default class Response {

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
