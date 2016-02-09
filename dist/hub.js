(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.CrossPostMessageHub = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Response = require('./Response');
var Util = require('./Util');
var WindowChannel = require('./WindowChannel');
var HubStatus = require('./HubStatus');

/**
 * Cross Post Message Hub
 *
 * @class Hub
 *
 * @requires Response
 * @requires Util
 */

var Hub = function () {
  /**
   * Accepts an options object with one key: allowedOrigins.
   * The value for allowedOrigins is expected to be an an arry of strings or RegExp.
   * The hub is then initialized to accept requests from any of
   * the matching origins.
   * A 'ready' message is sent to the parent window once complete.
   *
   * @param {object} [opt]
   * @param {array<string|RegExp>} opt.allowedOrigins
   * @constructor
   *
   * @example
   * let CrossPostMessage = require('cross-post-message');
   * let hub = new CrossPostMessage.Hub({
   *  allowedOrigins: ['https://app.com', /:(www\.)?example.com$/ ]
   * });
   *
   * // resolve response with body = 'Hello World!'
   * hub.when('GET', '/hello', (request, resolve) => {
   *    request('Hello World!');
   * });
   *
   * // reject with an error or resolve with response attributes
   * hub.when('POST', '/data', (request, resolve, reject) => {
   *    if(!request.body) {
   *      reject(new Error('cannot save data!'));
   *      return;
   *    }
   *    resolve({ status: 201, body: 'created' });
   * });
   *
   */

  function Hub(opt) {
    _classCallCheck(this, Hub);

    var _opt = opt || {};
    this._debug = _opt.debug || false;
    this._allowedOrigins = _opt.allowedOrigins || [];
    this._definitions = [];
    this._client = new WindowChannel(window.parent);
    this._client.postMessage(HubStatus.READY);
    installListener.call(this);
  }

  /**
   * Creates a new hub when definition.
   *
   * @param {string} method HTTP method
   * @param {string|RegExp|function(string)} uri HTTP url or function that receives a url
   *   and returns true if the url matches the current definition. uri
   * @param {function} cb - cb(request, resolve, reject) a function that will be executed when a request match the definition
   *
   * @returns {Hub}
   */

  _createClass(Hub, [{
    key: 'when',
    value: function when(method, uri, cb) {
      this._definitions.push({
        method: method,
        uri: uri,
        cb: cb
      });
      return this;
    }
  }]);

  return Hub;
}();

module.exports = Hub;

/**
 * Installs the necessary listener for the window message event.
 *
 * @private
 */
function installListener() {
  var _this = this;

  window.addEventListener('message', function (e) {
    if (_this._debug) {
      console.log('hub receive a message', e);
    }

    if (!checkOrigin.call(_this, e.origin)) {
      console.warn('cross-post-message-hub. Origin is not allowed. skip message');
      return;
    }
    try {
      var request = JSON.parse(e.data);
    } catch (e) {
      console.error(e);
    }

    if (request && request.event === 'request') {
      onRequest.call(_this, request, e);
    }
  }, true);
}

/**
 * Called when a request message is received from an allowed origin
 *
 * @private
 *
 * @param {object} request - a request object
 * @param {MessageEvent} e
 */
function onRequest(request, e) {
  var _this2 = this;

  var response;
  var definition = Util.find(this._definitions, function (definition) {
    // simple matching
    if (definition.method === request.method && definition.uri === request.uri) {
      return definition;
    }
  });

  // NOT FOUND
  if (!definition) {
    response = new Response(request, {
      status: 404,
      body: new Error('Definition not found')
    });
    this._client.postMessage(response, e.origin);
    return;
  }

  var promise = new Promise(function (resolve, reject) {
    try {
      definition.cb(request, resolve, reject);
    } catch (e) {
      reject(new Response(request, {
        status: 500,
        body: e
      }));
    }
  });

  promise.then(function (definitionResponse) {
    var response;
    if (typeof definitionResponse === 'string') {
      response = new Response(request, {
        status: 200,
        body: definitionResponse
      });
    } else {
      response = new Response(request, definitionResponse);
    }
    _this2._client.postMessage(response, e.origin);
  }).catch(function (definitionResponse) {
    var response;
    if (typeof definitionResponse === 'string') {
      response = new Response(request, {
        status: 500,
        body: new Error(definitionResponse)
      });
    } else {
      response = new Response(request, definitionResponse);
    }
    if (Util.isSuccessHttpStatus(response.status)) {
      response.status = 500;
    }
    _this2._client.postMessage(response, e.origin);
  });
}

/**
 * Check if origin is allowed
 *
 * @private
 *
 * @param {string} origin - origin to check
 * @returns bool
 */
function checkOrigin(origin) {
  if (!this._allowedOrigins.length) {
    return true;
  }
  // FIXME handle regexp
  return this._allowedOrigins.indexOf(origin) > -1;
}

},{"./HubStatus":2,"./Response":3,"./Util":4,"./WindowChannel":5}],2:[function(require,module,exports){
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

},{}],3:[function(require,module,exports){
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Util = require('./Util');

/**
 * Cross Post Message Hub Response
 *
 * @class Response
 *
 * @requires Util
 */

var Response =

/**
 * @param {Request} request A client request
 * @param {object} [attributes] Response attributes
 * @constructor
 */
function Response(request, attributes) {
  _classCallCheck(this, Response);

  Util.extend(this, attributes || {});
  this.event = 'response';
  this.request = request;
};

module.exports = Response;

},{"./Util":4}],4:[function(require,module,exports){
'use strict';

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
   * @param {target} target
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

module.exports = Util;

},{}],5:[function(require,module,exports){
'use strict';

/**
 * @class WindowChannel
 * @requires Window
 */

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

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

module.exports = WindowChannel;

},{}]},{},[1])(1)
});