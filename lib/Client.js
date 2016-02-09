'use strict';

import WindowChannel from './WindowChannel.js';
import HubStatus from './HubStatus';
import Util from './Util';
import EventEmitter from './EventEmitter';
import Request from './Request';
import Window from './Window';

/**
 * Cross Post Message Client
 * @class Client
 *
 * @requires WindowChannel
 * @requires HubStatus
 * @requires Util
 * @requires EventEmitter
 * @requires Request
 * @requires Window
 */
export default class Client extends EventEmitter {
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
  constructor(url, opt) {

    super();
    var _opt = opt || {};
    this._debug = _opt.debug || false;
    this._Promise = _opt.promise || Promise;
    this._timeout = _opt.timeout || 5000;
    this._id  = Util.generateUUID();
    this._origin = getOrigin(url);
    this._frame = createFrame(url, `cross-post-message:${this._id}`).contentWindow;
    this._hub = new WindowChannel(this._frame);
    this._connected = false;
    this._pendingRequests = {};
    installListener.call(this);
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
  request (attributes, options) {
    var _request = new Request(attributes);
    var _opt = options || {};

    if(!this._connected) {
      return this._Promise.reject(new Error('cross-post-message-client request. Client not connected.'));
    }

    this._hub.postMessage(_request, this._origin);

    return new this._Promise((resolve, reject) => {
      var timeout = Window.setTimeout(() => {
        delete this._pendingRequests[_request.id];
        reject(new Error('cross-post-message-client request. Timeout error', _request));
      }, _opt.timeout || this._timeout);

      this._pendingRequests[_request.id] = {
        resolve: resolve,
        reject: reject,
        timeout: timeout
      }
    });
  }
}

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
function installListener() {
  window.addEventListener('message', function (e) {

    if(this._debug) { console.log('client received a message', e) }

    // check the origin: must be sent from the hub domain;
    if(this._origin !== e.origin) {
      console.warn('cross-post-message-client origin not allowed.', e.origin);
      return;
    }

    if(e.data === HubStatus.READY) {
      if(this._connected) { return }
      this._connected = true;
      this.trigger('ready', e);
      return;
    }

    try{
      var response = JSON.parse(e.data);
    }catch(e) {
      console.error(e);
    }

    if(response && response.event === 'response') {
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
 * @param response
 */
function onResponse(response) {
  var pendingRequest = this._pendingRequests[response.request.id];

  if(!pendingRequest) { return; }

  clearTimeout(pendingRequest.timeout);

  Util.isSuccessHttpStatus(response.status) ?
    pendingRequest.resolve(response) :  pendingRequest.reject(response);

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
function createFrame (url, id) {

  /**
   * iFrame css styles
   * @type {{display: string, position: string, top: string, left: string}}
   */
  var FRAME_STYLES = {
    display:  'none',
    position: 'absolute',
    top:      '-999px',
    left:     '-999px'
  };

  var frame, key;

  frame = Window.document.createElement('iframe');
  frame.id = id;

  // Style the iframe
  for (key in FRAME_STYLES) {
    if (FRAME_STYLES.hasOwnProperty(key)) {
      frame.style[key] = FRAME_STYLES[key];
    }
  }

  Window.document.body.appendChild(frame);
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
  let uri, protocol, origin;

  uri = Window.document.createElement('a');
  uri.href = url;

  if (!uri.host) {
    uri = Window.location;
  }

  if (!uri.protocol || uri.protocol === ':') {
    protocol = Window.location.protocol;
  } else {
    protocol = uri.protocol;
  }

  origin = protocol + '//' + uri.host;
  origin = origin.replace(/:80$|:443$/, '');

  return origin;
}







