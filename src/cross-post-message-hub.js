var CrossPostMessageHub = (function (Common) {

  /**
   * Cross Post Message Response
   *
   * @private
   *
   * @param {Request} request A client request
   * @param {object} [attributes] Request attributes
   * @constructor
   */
  function Response(request, attributes) {
    Common.extend(this, attributes || {});
    this.event = 'response';
    this.request = request;
  }

  /**
   * Installs the necessary listener for the window message event.
   *
   * @private
   */
  function installListener() {
    window.addEventListener('message', function (e) {
      if(this._debug) { console.log('hub receive a message', e) };

      if(!checkOrigin.call(this, e.origin)) {
        console.warn('cross-post-message-hub. Origin is not allowed. skip message');
        return;
      }
      try {
        var request = JSON.parse(e.data);
      } catch (e) {
        console.error(e);
      }

      if (request && request.event === 'request') {
        onRequest.call(this, request);
      }

    }.bind(this), true);
  }

  /**
   * Check if the origin is allowed
   *
   * @private
   *
   * @param {string} origin - origin to check
   * @returns bool
   */
  function checkOrigin(origin) {
    if(!this._allowedOrigins.length) {
      return true;
    }
    // FIXME handle regexp
    return this._allowedOrigins.indexOf(origin) > -1;
  }

  /**
   * Called when a request message is received from an allowed origin
   *
   * @private
   *
   * @param {object} request - a request object
   */
  function onRequest (request) {
    var response;
    var definition = Common.find(this._definitions, function (definition) {
      // simple matching
      if (definition.method === request.method
        && definition.uri === request.uri) {
        return definition;
      }
    });

    // NOT FOUND
    if (!definition) {
      response = new Response(request, {
        status: 404,
        body: new Error('Definition not found')
      });
      window.parent.postMessage(JSON.stringify(response), '*');
      return;
    }

    var promise = new Promise(function (resolve, reject) {
      try{
        definition.cb(request, resolve, reject);
      }catch(e) {
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
            status : 200,
            body: definitionResponse
          });
        } else {
          response = new Response(request, definitionResponse);
        }
        window.parent.postMessage(JSON.stringify(response), '*');
    })
    .catch(function (definitionResponse) {
        var response;
        if (typeof definitionResponse === 'string') {
          response = new Response(request, {
            status: 500,
            body: new Error(definitionResponse)
          });
        } else {
          response = new Response(request, definitionResponse);
        }
        if(Common.isSuccessStatus(response.status)) {
          response.status = 500;
        }
        window.parent.postMessage(JSON.stringify(response), '*');
    });
  }


  /**
   * Accepts an options object with one key: allowedOrigins.
   * The value for allowedOrigins is expected to be an an arry of strings or RegExp.
   * The hub is then initialized to accept requests from any of
   * the matching origins.
   * A 'ready' message is sent to the parent window once complete.
   *
   * @param {object} [options]
   * @param {array<string|RegExp>} options.allowedOrigins
   * @constructor
   *
   * @example
   * var hub = new CrossPostMessageHub({
   *  allowedOrigins: ['https://app.com', /:(www\.)?example.com$/ ]
   * });
   *
   *
   */
  function CrossPostMessageHub(options) {
    var _opt = Common.merge({
      allowedOrigins: []
    }, options || {});
    this._definitions = [];
    this._allowedOrigins = _opt.allowedOrigins || [];
    window.parent.postMessage(Common.HUB_STATUS.READY, '*');
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
   * @returns {CrossPostMessageHub}
   */
  CrossPostMessageHub.prototype.when = function (method, uri, cb) {
    this._definitions.push({
      method: method,
      uri: uri,
      cb: cb
    });
    return this;
  };

  return CrossPostMessageHub;
})(CrossPostMessageCommon);
