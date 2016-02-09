(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _WindowChannel = require('./WindowChannel.js');

var _WindowChannel2 = _interopRequireDefault(_WindowChannel);

var _HubStatus = require('./HubStatus.js');

var _HubStatus2 = _interopRequireDefault(_HubStatus);

var _Util = require('./Util.js');

var _Util2 = _interopRequireDefault(_Util);

var _EventEmitter2 = require('./EventEmitter.js');

var _EventEmitter3 = _interopRequireDefault(_EventEmitter2);

var _Request = require('./Request.js');

var _Request2 = _interopRequireDefault(_Request);

var _Response = require('./Response.js');

var _Response2 = _interopRequireDefault(_Response);

var _Window = require('./Window.js');

var _Window2 = _interopRequireDefault(_Window);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * Cross Post Message Client
 *
 * @class Client
 *
 * @example
 * import {Client} from 'cross-post-message';
 *
 * let client = new Client('http://hub-domain.hub');
 *
 * client.on('ready', function () {
 *   client
 *     .request({ method: 'GET',  uri: '/info' })
 *     .then(function (response) {
 *       console.log('success', response.body); // OUTPUT: foo
 *     })
 *     .catch(function (response) {
 *       console.error(response);
 *     });
 * });
 *
 * client.on('response', function (response) {
 *   console.log('response to request: ' + response.request.id , response);
 * });
 *
 */

var Client = function (_EventEmitter) {
  _inherits(Client, _EventEmitter);

  /**
   * Constructs a new cross post message client given the url to a hub. By default,
   * an iFrame is created within the document body that points to the url. It
   * also accepts an options object, which may include a timeout, and
   * promise. The timeout, in milliseconds, is applied to each request and
   * defaults to 5000ms. If the promise key is supplied the constructor for a Promise, that Promise library
   * will be used instead of the default window.Promise.
   *
   * @param {string} url
   * @param {object} [opt={}]
   * @constructor
   */

  function Client(url, opt) {
    _classCallCheck(this, Client);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Client).call(this));

    var _opt = opt || {};
    _this._debug = _opt.debug || false;
    _this._Promise = _opt.promise || Promise;
    _this._timeout = _opt.timeout || 5000;
    _this._id = _Util2.default.generateUUID();
    _this._origin = getOrigin(url);
    _this._frame = createFrame(url, 'cross-post-message:' + _this._id).contentWindow;
    _this._hub = new _WindowChannel2.default(_this._frame);
    _this._connected = false;
    _this._pendingRequests = {};
    installListener.call(_this);
    return _this;
  }

  /**
   * Sends a request to the hub.
   * Stores pendingRequest in the _pendingRequests stack
   * for later invocation when response arrive, or deletion on timeout.
   * Returns a promise that is settled in either instance.
   *
   * @param {object} [attributes] - request attributes
   * @param {object} [options] - send request options
   * @returns {Promise} A promise that is settled on hub response or timeout
   */

  _createClass(Client, [{
    key: 'request',
    value: function request(attributes, options) {
      var _this2 = this;

      var _request = new _Request2.default(attributes);
      var _opt = options || {};

      if (!this._connected) {
        return this._Promise.reject(new Error('cross-post-message-client request. Client not connected.'));
      }

      this._hub.postMessage(_request, this._origin);

      return new this._Promise(function (resolve, reject) {
        var timeout = _Window2.default.setTimeout(function () {
          delete _this2._pendingRequests[_request.id];
          reject(new Error('cross-post-message-client request. Timeout error', _request));
        }, _opt.timeout || _this2._timeout);

        _this2._pendingRequests[_request.id] = {
          resolve: resolve,
          reject: reject,
          timeout: timeout
        };
      });
    }
  }]);

  return Client;
}(_EventEmitter3.default);

/**
 * Installs the necessary listener for the window message event.
 * When a ready message is received, the client's _connected status is changed to true, and the
 * ready event is fired. Given a response message, the callback
 * corresponding to its request is invoked. If response.status holds an error value
 * the promise associated with the original request is rejected with
 * the error. Otherwise the promise is fulfilled and passed response.
 *
 * @private
 */

exports.default = Client;
function installListener() {
  window.addEventListener('message', function (e) {
    var rawResponse = undefined,
        response = undefined;

    if (this._debug) {
      console.log('client received a message', e);
    }

    // check the origin: must be sent from the hub domain;
    if (this._origin !== e.origin) {
      console.warn('cross-post-message-client origin not allowed.', e.origin);
      return;
    }

    if (e.data === _HubStatus2.default.READY) {
      if (this._connected) {
        return;
      }
      this._connected = true;
      this.trigger('ready', e);
      return;
    }

    try {
      rawResponse = JSON.parse(e.data);
    } catch (e) {
      console.error(e);
    }

    if (_Response2.default.isRaw(rawResponse)) {
      response = _Response2.default.fromRaw(rawResponse);
      this.trigger('response', response);
      onResponse.call(this, response);
    }
  }.bind(this), false);
}

/**
 * On response handler, it's called when we receive a response from the hub
 *
 * @private
 *
 * @param {object} response
 */
function onResponse(response) {
  var pendingRequest = this._pendingRequests[response.request.id];

  if (!pendingRequest) {
    return;
  }

  clearTimeout(pendingRequest.timeout);

  _Util2.default.isSuccessHttpStatus(response.status) ? pendingRequest.resolve(response) : pendingRequest.reject(response);

  delete this._pendingRequests[response.request.id];
}

/**
 * Creates a new iFrame containing the hub. Applies the necessary styles to
 * hide the element from view, prior to adding it to the document body.
 * Returns the created element.
 *
 * @private
 *
 * @param  {string}            url The url to the hub
 * @param  {string}            [id] The frame id
 * returns {HTMLIFrameElement} The iFrame element itself
 */
function createFrame(url, id) {

  /**
   * iFrame css styles
   * @type {{display: string, position: string, top: string, left: string}}
   */
  var FRAME_STYLES = {
    display: 'none',
    position: 'absolute',
    top: '-999px',
    left: '-999px'
  };

  var frame, key;

  frame = _Window2.default.document.createElement('iframe');
  frame.id = id;

  // Style the iframe
  for (key in FRAME_STYLES) {
    if (FRAME_STYLES.hasOwnProperty(key)) {
      frame.style[key] = FRAME_STYLES[key];
    }
  }

  _Window2.default.document.body.appendChild(frame);
  frame.src = url;

  return frame;
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
  var uri = undefined,
      protocol = undefined,
      origin = undefined;

  uri = _Window2.default.document.createElement('a');
  uri.href = url;

  if (!uri.host) {
    uri = _Window2.default.location;
  }

  if (!uri.protocol || uri.protocol === ':') {
    protocol = _Window2.default.location.protocol;
  } else {
    protocol = uri.protocol;
  }

  origin = protocol + '//' + uri.host;
  origin = origin.replace(/:80$|:443$/, '');

  return origin;
}

},{"./EventEmitter.js":2,"./HubStatus.js":3,"./Request.js":4,"./Response.js":5,"./Util.js":6,"./Window.js":7,"./WindowChannel.js":8}],2:[function(require,module,exports){
'use strict';

/**
 * @class EventEmitter
 */

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var EventEmitter = function () {

  /**
   * @constructor
   */

  function EventEmitter() {
    _classCallCheck(this, EventEmitter);

    this._callbacks = {};
  }

  /**
   * Subscribe to events
   *
   * @param {string} eventName - event name (ready|response)
   * @param {Function} cb - the function to be invoked
   * @returns {EventEmitter}
   */

  _createClass(EventEmitter, [{
    key: 'on',
    value: function on(eventName, cb) {
      this._callbacks[eventName] = this._callbacks[eventName] || [];
      this._callbacks[eventName].push(cb);
      return this;
    }

    /**
     * Trigger an event with variadic arguments
     *
     * @param {string} eventName
     * @param {...} [args]
     * @returns {EventEmitter}
     */

  }, {
    key: 'trigger',
    value: function trigger(eventName) {
      var _this = this;

      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      if (!this._callbacks[eventName]) {
        return this;
      }
      this._callbacks[eventName].forEach(function (cb) {
        cb.apply(_this, args);
      });

      return this;
    }
  }]);

  return EventEmitter;
}();

exports.default = EventEmitter;

},{}],3:[function(require,module,exports){
'use strict';

/**
 * @name HubStatus
 * @type {{READY: string}}
 */

Object.defineProperty(exports, "__esModule", {
  value: true
});
var HubStatus = {
  READY: 'ready'
};

exports.default = HubStatus;

},{}],4:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _Util = require('./Util.js');

var _Util2 = _interopRequireDefault(_Util);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Cross Post Message Client Request
 *
 * @class Request
 *
 */

var Request = function () {

  /**
   *
   * @param {object} attributes
   * @param {string} [id=null] A uuid to identify the request, if null it will be generated
   *
   * @constructor
   */

  function Request(attributes) {
    var id = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

    _classCallCheck(this, Request);

    _Util2.default.extend(this, attributes);
    this.type = Request.TYPE;
    this.id = id || _Util2.default.generateUUID();
  }

  /**
   * Check if raw request is a serialized request
   *
   * @param {object} rawRequest
   * @returns {*|boolean}
   */

  _createClass(Request, null, [{
    key: 'isRaw',
    value: function isRaw(rawRequest) {
      return rawRequest && rawRequest.type === Request.TYPE && rawRequest.id;
    }

    /**
     * Instantiate a new Request from a serialized request
     * @param rawRequest
     */

  }, {
    key: 'fromRaw',
    value: function fromRaw(rawRequest) {
      return new Request(rawRequest, rawRequest.id);
    }
  }]);

  return Request;
}();

exports.default = Request;

Request.TYPE = 'request';

},{"./Util.js":6}],5:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _Util = require('./Util.js');

var _Util2 = _interopRequireDefault(_Util);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Cross Post Message Hub Response
 *
 * @class Response
 *
 */

var Response = function () {

  /**
   * @param {Request} request A client request
   * @param {object} [attributes] Response attributes
   * @constructor
   */

  function Response(request, attributes) {
    _classCallCheck(this, Response);

    _Util2.default.extend(this, attributes || {});
    this.type = Response.TYPE;
    this.request = request;
  }

  /**
   * Check if raw response is a serialized response
   *
   * @param {object} rawResponse
   * @returns {*|boolean}
   */

  _createClass(Response, null, [{
    key: 'isRaw',
    value: function isRaw(rawResponse) {
      return rawResponse && rawResponse.type === Response.TYPE && rawResponse.request;
    }

    /**
     * Instantiate a new Response from a serialized response
     *
     * @param {object} rawResponse
     * @returns {Response} Response
     */

  }, {
    key: 'fromRaw',
    value: function fromRaw(rawResponse) {
      return new Response(rawResponse.request, rawResponse);
    }
  }]);

  return Response;
}();

exports.default = Response;

Response.TYPE = 'response';

},{"./Util.js":6}],6:[function(require,module,exports){
'use strict';

/**
 * @name Util
 * @requires Math
 */

Object.defineProperty(exports, "__esModule", {
  value: true
});
var Util = {
  /**
   * UUID v4 generation, taken from: http://stackoverflow.com/questions/
   * 105034/how-to-create-a-guid-uuid-in-javascript/2117523#2117523
   *
   * @function
   * @returns {string} A UUID v4 string
   */
  generateUUID: function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0,
          v = c == 'x' ? r : r & 0x3 | 0x8;
      return v.toString(16);
    });
  },
  /**
   * Check if an http status must be considered successful
   * @param {number} status
   * @returns {boolean}
   */
  isSuccessHttpStatus: function isSuccessHttpStatus(status) {
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
  find: function find(collection, cb, $this) {
    var found = undefined;
    $this = $this || undefined;
    for (var i = 0; i <= collection.length; i++) {
      found = cb.call($this, collection[i], i, collection);
      if (found) {
        return found;
      }
    }
    return found;
  },
  /**
   * Extend source with target properties
   * @param {object} source
   * @param {object} target
   * @returns {*}
   */
  extend: function extend(source, target) {
    for (var prop in target) {
      if (target.hasOwnProperty(prop)) {
        source[prop] = target[prop];
      }
    }
    return source;
  }
};

exports.default = Util;

},{}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = window;

},{}],8:[function(require,module,exports){
'use strict';

/**
 * @class WindowChannel
 */

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var WindowChannel = function () {
  /**
   * @constructor
   * @param {Window|{postMessage: Function}} source
   */

  function WindowChannel(source) {
    _classCallCheck(this, WindowChannel);

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

  _createClass(WindowChannel, [{
    key: 'postMessage',
    value: function postMessage(message, targetOrigin, transfer) {
      var _message = typeof message === 'string' ? message : JSON.stringify(message);
      this.source.postMessage(_message, targetOrigin || '*', transfer);
    }
  }]);

  return WindowChannel;
}();

exports.default = WindowChannel;

},{}],9:[function(require,module,exports){
'use strict';

var _Client = require('../Client.js');

var _Client2 = _interopRequireDefault(_Client);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

window.CrossPostMessageClient = _Client2.default;

},{"../Client.js":1}]},{},[9]);
