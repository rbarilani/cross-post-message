'use strict';

import Util from './Util';

/**
 * Cross Post Message Client Request
 *
 * @class Request
 *
 * @requires Util
 */
export default class Request {
  /**
   * Cross Post Message Client Request
   *
   * @private
   * @param {object} attributes
   * @constructor
   */
  constructor(attributes) {
    Util.extend(this, attributes);
    this.event = 'request';
    this.id = Util.generateUUID();
  }
}


