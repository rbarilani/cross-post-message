var _ = require('lodash');

var Common = (function (_) {
  return {
    find: _.find,
    merge: _.merge,
    extend: _.extend,
    trigger: trigger,
    isSuccessStatus: isSuccessStatus,
    generateUUID: generateUUID,
    getOrigin: getOrigin,
    HUB_STATUS: {
      READY: 'cross-post-message:ready'
    }
  };

  /**
   * Check if a status is successful
   * @param {number} status
   * @returns {boolean}
   */
  function isSuccessStatus(status) {
    return 200 <= status && status < 400;
  }

  /**
   * Call every function in the _callbacks stack for a specific event
   *
   * @param {string} eventName - the event name
   * @param {...} [args] - use this arguments when invoking each callback
   * @returns {CrossPostMessageClient}
   *
   * @example
   * trigger.call(this, 'ready', 'arg1', 'arg2')
   * trigger.apply(this, ['ready', 'arg1', 'arg2']
   */
  function trigger(eventName, /*...*/ args) {
    var _args = Array.prototype.slice.call(arguments);
    _args.shift();

    if (!this._callbacks[eventName]) {
      return this;
    }
    this._callbacks[eventName].forEach(function (cb) {
      cb.apply(this, _args);
    }.bind(this));

    return this;
  }

  /**
   * UUID v4 generation, taken from: http://stackoverflow.com/questions/
   * 105034/how-to-create-a-guid-uuid-in-javascript/2117523#2117523
   *
   * @private
   *
   * @returns {string} A UUID v4 string
   */
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
  }

  /**
   * Returns the origin of an url, with cross browser support. Accommodates
   * the lack of location.origin in IE, as well as the discrepancies in the
   * inclusion of the port when using the default port for a protocol, e.g.
   * 443 over https. Defaults to the origin of window.location if passed a
   * relative path.
   *
   * @private
   *
   * @param   {string} url The url to a cross post message hub
   * @returns {string} The origin of the url
   */
  function getOrigin(url) {
    var uri, protocol, origin;

    uri = document.createElement('a');
    uri.href = url;

    if (!uri.host) {
      uri = window.location;
    }

    if (!uri.protocol || uri.protocol === ':') {
      protocol = window.location.protocol;
    } else {
      protocol = uri.protocol;
    }

    origin = protocol + '//' + uri.host;
    origin = origin.replace(/:80$|:443$/, '');

    return origin;
  }
})(_);

module.exports = Common;
