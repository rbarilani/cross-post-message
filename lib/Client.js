var Common = require('./Common');

/**
 * @see Client
 * @requires CrossPostMessageCommon
 */
var Client = (function (Common) {

  var FRAME_STYLES = {
    display:  'none',
    position: 'absolute',
    top:      '-999px',
    left:     '-999px'
  };


  /**
   * Cross Post Message Request
   *
   * @param {object} attributes
   * @constructor
   */
  function Request(attributes) {
    Common.extend(this, attributes);
    this.event = 'request';
    this.id = Common.generateUUID();
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
    var frame, key;

    frame = window.document.createElement('iframe');
    frame.id = id;

    // Style the iframe
    for (key in FRAME_STYLES) {
      if (FRAME_STYLES.hasOwnProperty(key)) {
        frame.style[key] = FRAME_STYLES[key];
      }
    }

    window.document.body.appendChild(frame);
    frame.src = url;

    return frame;
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

      if(this._debug) { console.log('client received a message', e) };

      // check the origin: must be sent from the hub domain;
      if(this._origin !== e.origin) {
        console.warn('cross-post-message-client origin not allowed.', e.origin);
        return;
      }

      if(e.data === Common.HUB_STATUS.READY) {
        if(this._connected) { return }
        this._connected = true;
        Common.trigger.call(this, 'ready', e);
        return;
      }

      try{
        var response = JSON.parse(e.data);
      }catch(e) {
        console.error(e);
      }

      if(response && response.event === 'response') {
        Common.trigger.call(this, 'response', response);
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

    Common.isSuccessStatus(response.status) ?
      pendingRequest.resolve(response) :  pendingRequest.reject(response);

    delete this._pendingRequests[response.request.id];
  }

  /**
   * Constructs a new cross post message client given the url to a hub. By default,
   * an iframe is created within the document body that points to the url. It
   * also accepts an options object, which may include a timeout, and
   * promise. The timeout, in milliseconds, is applied to each request and
   * defaults to 5000ms. If the promise key is supplied the constructor for a Promise, that Promise library
   * will be used instead of the default window.Promise.
   *
   * @param {string} url
   * @param {object} [opt={}]
   * @constructor
   */
  function CrossPostMessageClient(url, opt) {
    var _opt = Common.merge({
      promise: Promise,
      timeout: 5000,
      debug: false
    }, opt);

    this._debug = _opt.debug;
    this._Promise = _opt.promise;
    this._timeout = _opt.timeout;
    this._id  = Common.generateUUID();
    this._origin = Common.getOrigin(url);
    this._hub = createFrame(url, 'cross-post-message:' + this._id).contentWindow;
    this._connected = false;
    this._callbacks = {};
    this._pendingRequests = {};
    installListener.call(this);
  }

  /**
   * Subscribe to events
   *
   * @param {string} eventName - event name (ready|response)
   * @param {Function} cb - the function to be invoked
   * @returns {CrossPostMessageClient}
   */
  CrossPostMessageClient.prototype.on = function (eventName, cb) {
    this._callbacks[eventName] = this._callbacks[eventName] || [];
    this._callbacks[eventName].push(cb);
    return this;
  };

  /**
   * Sends a request to the hub.
   * Stores pendingRequest in the _pendingRequests stack
   * for later invocation when response arrive, or deletion on timeout.
   * Returns a promise that is settled in either instance.
   *
   * @returns {Promise} A promise that is settled on hub response or timeout
   */
  CrossPostMessageClient.prototype.request = function (attributes, options) {
    var _this = this;
    var _request = new Request(attributes);
    var _opt = Common.merge({
      timeout: 3000
    }, options || {});

    if(!this._connected) { return this._Promise.reject(new Error('cross-post-message-client request. Client not connected.')); }

    this._hub.postMessage(JSON.stringify(_request), this._origin);

    return new this._Promise(function (resolve, reject) {
      var timeout = setTimeout(function() {
        delete _this._pendingRequests[_request.id];
        reject(new Error('cross-post-message-client request. Timeout error', _request));
      }, _this._timeout || _opt.timeout);

      _this._pendingRequests[_request.id] = {
        resolve: resolve,
        reject: reject,
        timeout: timeout
      }
    });
  };

  return CrossPostMessageClient;

})(Common);

module.exports = Client;


