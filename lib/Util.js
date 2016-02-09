'use strict';

let Math = require('./Math');

/**
 * @name Util
 * @requires Math
 */
const Util = {
  /**
   * UUID v4 generation, taken from: http://stackoverflow.com/questions/
   * 105034/how-to-create-a-guid-uuid-in-javascript/2117523#2117523
   *
   * @function
   * @returns {string} A UUID v4 string
   */
  generateUUID: () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      let r = Math.random() * 16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
  },
  /**
   * Check if an http status must be considered successful
   * @param {number} status
   * @returns {boolean}
   */
  isSuccessHttpStatus: (status) => {
    return 200 <= status && status < 400;
  },
  /**
   * Find an item
   *
   * @param {Array} collection
   * @param {Function} cb
   * @param {*} $this
   * @returns {*}
   */
  find: (collection, cb, $this) => {
    let found;
    $this = $this || this;
    for(let i = 0; i <= collection.length; i++) {
      found = cb.call($this, collection[i], i, collection)
      if(found) { return found; }
    }
    return found;
  },
  /**
   * Extend source with target properties
   * @param {object} source
   * @param {object} target
   * @returns {*}
   */
  extend: function (source, target) {
    for(var prop in target) {
      if(target.hasOwnProperty(prop)) {
        source[prop] = target[prop];
      }
    }
    return source;
  }
};

module.exports = Util;
