'use strict';

import WindowChannel from './WindowChannel.js';
import HubStatus from './HubStatus.js';
import Util from './Util.js';
import Response from './Response.js';
import Request from './Request.js';
import Window from './Window.js';

/**
 * Cross Post Message Hub
 *
 * @class Hub
 */
export default class Hub {
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
   * import {Hub} from 'cross-post-message';
   *
   * let hub = new Hub({
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
  constructor(opt) {
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
  when(method, uri, cb) {
    this._definitions.push({
      method: method,
      uri: uri,
      cb: cb
    });
    return this;
  };
}


/**
 * Installs the necessary listener for the window message event.
 *
 * @private
 */
function installListener() {
  Window.addEventListener('message', (e) => {
    let rawRequest;
    if(this._debug) { console.log('hub receive a message', e) }

    if(!checkOrigin.call(this, e.origin)) {
      console.warn('cross-post-message-hub. Origin is not allowed. skip message');
      return;
    }
    try {
      rawRequest = JSON.parse(e.data);
    } catch (e) {
      console.error(e);
    }

    if (Request.isRaw(rawRequest)) {
      onRequest.call(this, Request.fromRaw(rawRequest), e);
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
function onRequest (request, e) {
  var response;
  var definition = Util.find(this._definitions, (definition) => {
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
    this._client.postMessage(response, e.origin);
    return;
  }

  var promise = new Promise((resolve, reject) => {
    try{
      definition.cb(request, resolve, reject);
    }catch(e) {
      reject(new Response(request, {
        status: 500,
        body: e
      }));
    }
  });

  promise.then((definitionResponse) => {
    var response;
    if (typeof definitionResponse === 'string') {
      response = new Response(request, {
        status : 200,
        body: definitionResponse
      });
    } else {
      response = new Response(request, definitionResponse);
    }
    this._client.postMessage(response, e.origin);
  })
  .catch((definitionResponse) => {
    var response;
    if (typeof definitionResponse === 'string') {
      response = new Response(request, {
        status: 500,
        body: new Error(definitionResponse)
      });
    } else {
      response = new Response(request, definitionResponse);
    }
    if(Util.isSuccessHttpStatus(response.status)) {
      response.status = 500;
    }
    this._client.postMessage(response, e.origin);
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
  if(!this._allowedOrigins.length) {
    return true;
  }
  // FIXME handle regexp
  return this._allowedOrigins.indexOf(origin) > -1;
}



