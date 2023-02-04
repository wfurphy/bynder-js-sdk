"use strict";

var _slicedToArray2 = require("babel-runtime/helpers/slicedToArray");

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _typeof2 = require("babel-runtime/helpers/typeof");

var _typeof3 = _interopRequireDefault(_typeof2);

var _objectWithoutProperties2 = require("babel-runtime/helpers/objectWithoutProperties");

var _objectWithoutProperties3 = _interopRequireDefault(_objectWithoutProperties2);

var _extends2 = require("babel-runtime/helpers/extends");

var _extends3 = _interopRequireDefault(_extends2);

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

require("isomorphic-form-data");
var axios = require("axios");

var _require = require("path"),
    basename = _require.basename;

var isUrl = require("is-url");
var joinUrl = require("proper-url-join");
var queryString = require("query-string");
var simpleOAuth2 = require("simple-oauth2");
var pkg = require("../package.json");
var url = require("url");

var defaultAssetsNumberPerPage = 50;

/**
 * Rejects the request.
 * @return {Promise} error - Returns a Promise with the details for the wrong request.
 */
function rejectValidation(module, param) {
  return Promise.reject({
    status: 0,
    message: "The " + module + " " + param + " is not valid or it was not specified properly"
  });
}

/**
 * @classdesc Represents an API call.
 * @class
 * @abstract
 */

var APICall = function () {
  /**
   * Create a APICall.
   * @constructor
   * @param {string} baseURL - A string with the base URL for account.
   * @param {string} httpsAgent - A https agent.
   * @param {string} httpAgent - A http agent.
   * @param {string} token - Optional OAuth2 access token
   * @param {Object} [data={}] - An object containing the query parameters.
   */
  function APICall(baseURL, httpsAgent, httpAgent, token) {
    (0, _classCallCheck3.default)(this, APICall);

    if (!isUrl(baseURL)) throw new Error("The base URL provided is not valid");

    this.baseURL = baseURL;
    this.httpsAgent = httpsAgent;
    this.httpAgent = httpAgent;
    this.token = token;
  }

  /**
   * Fetch the information from the API.
   * @return {Promise} - Returns a Promise that, when fulfilled, will either return an JSON Object with the requested
   * data or an Error with the problem.
   */


  (0, _createClass3.default)(APICall, [{
    key: "send",
    value: function () {
      var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(method, url) {
        var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
        var callURL, headers, body;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                callURL = joinUrl(this.baseURL, url, { trailingSlash: true });

                if (!(!this.token && !this.permanentToken)) {
                  _context.next = 3;
                  break;
                }

                throw new Error("No token found");

              case 3:
                headers = {
                  'User-Agent': "bynder-js-sdk/" + pkg.version
                };

                if (!this.permanentToken) {
                  _context.next = 8;
                  break;
                }

                headers["Authorization"] = "Bearer " + this.permanentToken;
                _context.next = 12;
                break;

              case 8:
                _context.next = 10;
                return this.token.expired() ? this.token.refresh() : Promise.resolve(this.token);

              case 10:
                this.token = _context.sent;


                headers["Authorization"] = "Bearer " + this.token.token.access_token;

              case 12:
                body = "";


                if (method === "POST") {
                  headers["Content-Type"] = "application/x-www-form-urlencoded";

                  body = queryString.stringify(data);
                } else if (Object.keys(data).length && data.constructor === Object) {
                  callURL = joinUrl(callURL, { trailingSlash: true, query: data });
                }

                return _context.abrupt("return", axios(callURL, {
                  httpsAgent: this.httpsAgent,
                  httpAgent: this.httpAgent,
                  method: method,
                  data: body,
                  headers: headers
                }).then(function (response) {
                  if (response.status >= 400) {
                    // check for 4XX, 5XX, wtv
                    return Promise.reject({
                      status: response.status,
                      message: response.statusText,
                      body: response.data
                    });
                  }
                  if (response.status >= 200 && response.status <= 202) {
                    return response.data;
                  }
                  return {};
                }));

              case 15:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function send(_x2, _x3) {
        return _ref.apply(this, arguments);
      }

      return send;
    }()
  }]);
  return APICall;
}();

var bodyTypes = {
  BUFFER: "BUFFER",
  BLOB: "BLOB",
  STREAM: "STREAM",
  /**
   * @param {Object} body - The file body whose type we need to determine
   * @return {string} One of bodyTypes.BUFFER, bodyTypes.BLOB, bodyTypes.STREAM
   */
  get: function get(body) {
    if (typeof Buffer !== "undefined" && Buffer.isBuffer(body)) {
      return bodyTypes.BUFFER;
    }
    if (typeof window !== "undefined" && window.Blob && body instanceof window.Blob) {
      return bodyTypes.BLOB;
    }
    if (typeof body.read === "function") {
      return bodyTypes.STREAM;
    }
    return null;
  }
};

/**
 * @return {number} length - The amount of data that can be read from the file
 */

function getLength(file) {
  var body = file.body,
      length = file.length;

  var bodyType = bodyTypes.get(body);
  if (bodyType === bodyTypes.BUFFER) {
    return body.length;
  }
  if (bodyType === bodyTypes.BLOB) {
    return body.size;
  }
  return length;
}

/**
 * @classdesc Represents the Bynder SDK. It allows the user to make every call to the API with a single function.
 * @class
 */

var Bynder = function () {
  /**
   * Create Bynder SDK.
   * @constructor
   * @param {String} options.baseURL - The URL with the account domain.
   * @param {String} options.httpsAgent - The https agent.
   * @param {String} options.httpAgent - The http agent.
   * @param {String} options.clientId -- OAuth2 client id
   * @param {String} options.clientSecret -- OAuth2 client secret
   * @param
   * @param {Object} options - An object containing the consumer keys, access keys and the base URL.
   */
  function Bynder(options) {
    (0, _classCallCheck3.default)(this, Bynder);

    this.options = options;
    this.baseURL = options.baseURL;
    this.redirectUri = options.redirectUri || null;

    this.api = new APICall(options.baseURL, options.httpsAgent, options.httpAgent);

    if (typeof options.permanentToken === "string") {
      this.api.permanentToken = options.permanentToken;
      return;
    }

    var oauthBaseUrl = url.resolve(options.baseURL, "/v6/authentication/");

    this.oauth2 = simpleOAuth2.create({
      client: {
        id: options.clientId,
        secret: options.clientSecret
      },
      auth: {
        tokenHost: oauthBaseUrl,
        tokenPath: "oauth2/token",
        revokePath: "oauth2/revoke",
        authorizeHost: oauthBaseUrl,
        authorizePath: "oauth2/auth"
      }
    });

    if (options.token) {
      if (typeof options.token.access_token !== "string") {
        throw new Error("Invalid token format: " + JSON.stringify(options.token, null, 2));
      }
      this.api.token = this.oauth2.accessToken.create(options.token);
    }
  }

  /**
   * Builds OAuth2 authorization URL.
   * @return {String} Authorization URL
   */


  (0, _createClass3.default)(Bynder, [{
    key: "makeAuthorizationURL",
    value: function makeAuthorizationURL(state, scope) {
      return this.oauth2.authorizationCode.authorizeURL({
        redirect_uri: this.redirectUri,
        scope: scope,
        state: state
      });
    }

    /**
     * Gets OAuth2 access token from authorization code
     * 
     * :: 2023-02-03 wfurphy ::> Added Support for Client Credentials grant type
     * @see {@link https://bynder.docs.apiary.io/#reference/oauth-2.0/token-endpoint|API Call}
     * 
     * @param {?String} [code] - One time authorization code for authorization_code grant type. Leave null for client_credentials grant type
     * @param {String} [scope] - List of scopes to request to be granted to the access token. eg. `asset:read asset:write`
     * @return {String} access token
     */

  }, {
    key: "getToken",
    value: function getToken(code, scope) {
      var _this = this;

      var tokenConfig = {
        grant_type: 'client_credentials'
      };

      var authMethod = 'clientCredentials';

      if (this.redirectUri) {
        if (!code || typeof code !== 'string') {
          throw new Error("Invalid authorization code format: " + code ? JSON.stringify(code, null, 2) : '');
        }

        authMethod = 'authorizationCode';
        tokenConfig.grant_type = 'authorization_code';
        tokenConfig.code = code.trim();
        tokenConfig.redirect_uri = this.redirectUri;
      }

      if (scope && typeof scope == 'string') {
        tokenConfig.scope = scope.trim();
      }

      return this.oauth2[authMethod].getToken(tokenConfig).then(function (result) {
        var token = _this.oauth2.accessToken.create(result);
        _this.api.token = token;
        return token;
      });
    }

    /**
     * Get all the smartfilters.
     * @see {@link https://bynder.docs.apiary.io/#reference/smartfilters/smartfilters-operations/retrieve-smartfilters|API Call}
     * @return {Promise} Smartfilters - Returns a Promise that, when fulfilled, will either return an Array with the
     * smartfilters or an Error with the problem.
     */

  }, {
    key: "getSmartfilters",
    value: function getSmartfilters() {
      return this.api.send("GET", "v4/smartfilters/");
    }

    /**
     * Login to retrieve OAuth credentials.
     * @see {@link https://bynder.docs.apiary.io/#reference/users/-deprecated-login-a-user-operations/login-a-user|API Call}
     * @param {Object} params={} - An object containing the credentials with which the user intends to login.
     * @param {String} params.username - The username of the user.
     * @param {String} params.password - The password of the user.
     * @param {String} params.consumerId - The consumerId of the user.
     * @return {Promise} Credentials - Returns a Promise that, when fulfilled, will either return an Object with the
     * OAuth credentials for login or an Error with the problem.
     */

  }, {
    key: "userLogin",
    value: function userLogin(params) {
      if (!params.username || !params.password || !params.consumerId) {
        return rejectValidation("authentication", "username, password or consumerId");
      }

      return this.api.send("POST", "v4/users/login/", params);
    }

    /**
     * Get the assets according to the parameters provided.
     * @see {@link http://docs.bynder.apiary.io/#reference/assets/asset-operations/retrieve-assets|API Call}
     * @param {Object} [params={}] - An object containing the parameters accepted by the API to narrow the query.
     * @return {Promise} Assets - Returns a Promise that, when fulfilled, will either return an Array with the assets or
     * an Error with the problem.
     */

  }, {
    key: "getMediaList",
    value: function getMediaList() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      return this.api.send("GET", "v4/media/", (0, _extends3.default)({}, params, {
        count: false
      }, Array.isArray(params.propertyOptionId) ? params.propertyOptionId.join(",") : {}));
    }

    /**
     * Get the assets information according to the id provided.
     * @see {@link http://docs.bynder.apiary.io/#reference/assets/specific-asset-operations/retrieve-specific-asset|API Call}
     * @param {Object} params - An object containing the id and the version of the desired asset.
     * @param {String} params.id - The id of the desired asset.
     * @param {Boolean} [params.versions] - Whether to include info about the different asset versions.
     * @return {Promise} Asset - Returns a Promise that, when fulfilled, will either return an Object with the asset or
     * an Error with the problem.
     */

  }, {
    key: "getMediaInfo",
    value: function getMediaInfo() {
      var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var id = _ref2.id,
          options = (0, _objectWithoutProperties3.default)(_ref2, ["id"]);

      if (!id) {
        return rejectValidation("media", "id");
      }

      return this.api.send("GET", "v4/media/" + id + "/", options);
    }

    /**
     * Get all the assets starting from the page provided (1 by default) and incrementing according to the offset given.
     * @see {@link http://docs.bynder.apiary.io/#reference/assets/asset-operations/retrieve-assets|API Call}
     * @param {Object} [params={}] - An object containing the parameters accepted by the API to narrow the query.
     * @return {Promise} Assets - Returns a Promise that, when fulfilled, will either return an Array with all the
     * assets or an Error with the problem.
     */

  }, {
    key: "getAllMediaItems",
    value: function getAllMediaItems() {
      var _this2 = this;

      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var recursiveGetAssets = function recursiveGetAssets(_params, assets) {
        var queryAssets = assets;
        var params = (0, _extends3.default)({}, _params);
        params.page = !params.page ? 1 : params.page;
        params.limit = !params.limit ? defaultAssetsNumberPerPage : params.limit;

        return _this2.getMediaList(params).then(function (data) {
          queryAssets = assets.concat(data);
          if (data && data.length === params.limit) {
            // If the results page is full it means another one might exist
            params.page += 1;
            return recursiveGetAssets(params, queryAssets);
          }
          return queryAssets;
        }).catch(function (error) {
          return error;
        });
      };

      return recursiveGetAssets(params, []);
    }

    /**
     * Get the assets total according to the parameters provided.
     * @see {@link http://docs.bynder.apiary.io/#reference/assets/asset-operations/retrieve-assets|API Call}
     * @param {Object} [params={}] - An object containing the parameters accepted by the API to narrow the query.
     * @return {Promise} Number - Returns a Promise that, when fulfilled, will either return the number of assets
     * fitting the query or an Error with the problem.
     */

  }, {
    key: "getMediaTotal",
    value: function getMediaTotal() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var parametersObject = Object.assign({}, params, { count: true });
      if (Array.isArray(parametersObject.propertyOptionId)) {
        parametersObject.propertyOptionId = parametersObject.propertyOptionId.join();
      }
      return this.api.send("GET", "v4/media/", parametersObject).then(function (data) {
        return data.count.total;
      });
    }

    /**
     * Edit an existing asset with the information provided.
     * @see {@link http://docs.bynder.apiary.io/#reference/assets/specific-asset-operations/modify-asset|API Call}
     * @param {Object} params={} - An object containing the parameters accepted by the API to change in the asset.
     * @param {String} params.id - The id of the desired asset.
     * @return {Promise} Object - Returns a Promise that, when fulfilled, will either return an empty Object in
     * case it's successful or an Error with the problem.
     */

  }, {
    key: "editMedia",
    value: function editMedia() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      if (!params.id) {
        return rejectValidation("media", "id");
      }
      return this.api.send("POST", "v4/media/", params);
    }

    /**
     * Delete an existing asset.
     * @see {@link http://docs.bynder.apiary.io/#reference/assets/specific-asset-operations/delete-asset|API Call}
     * @param {Object} params={} - An object containing the id of the asset to be deleted.
     * @param {String} params.id - The id of the asset.
     * @return {Promise} Object - Returns a Promise that, when fulfilled, will either return an empty Object in
     * case it's successful or an Error with the problem.
     */

  }, {
    key: "deleteMedia",
    value: function deleteMedia(_ref3) {
      var id = _ref3.id;

      if (!id) {
        return rejectValidation("media", "id");
      }
      return this.api.send("DELETE", "v4/media/" + id + "/");
    }

    /**
     * Get all the metaproperties
     * @see {@link http://docs.bynder.apiary.io/#reference/metaproperties/retrieve-metaproperties|API Call}
     * @param {Object} params={} - An object containing the parameters accepted by the API to narrow the query.
     * @return {Promise} Metaproperties - Returns a Promise that, when fulfilled, will either return an Array with the
     * metaproperties or an Error with the problem.
     */

  }, {
    key: "getMetaproperties",
    value: function getMetaproperties() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      return this.api.send("GET", "v4/metaproperties/", params).then(function (data) {
        return Object.keys(data).map(function (metaproperty) {
          return data[metaproperty];
        });
      });
    }

    /**
     * Get the metaproperty information according to the id provided.
     * @see {@link http://docs.bynder.apiary.io/#reference/metaproperties/specific-metaproperty-operations/retrieve-specific-metaproperty|API Call}
     * @param {Object} params={} - An object containing the id of the desired metaproperty.
     * @param {String} params.id - The id of the desired metaproperty.
     * @return {Promise} Metaproperty - Returns a Promise that, when fulfilled, will either return an Object with the
     * metaproperty or an Error with the problem.
     */

  }, {
    key: "getMetaproperty",
    value: function getMetaproperty() {
      var _ref4 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          id = _ref4.id;

      if (!id) {
        return rejectValidation("metaproperty", "id");
      }
      return this.api.send("GET", "v4/metaproperties/" + id + "/");
    }

    /**
     * Save a new metaproperty in the information provided.
     * @see {@link http://docs.bynder.apiary.io/#reference/metaproperties/metaproperty-operations/create-metaproperty|API Call}
     * @param {Object} object={} - An object containing the data of the new metaproperty.
     * @return {Promise} Object - Returns a Promise that, when fulfilled, will either return an empty Object in
     * case it's successful or an Error with the problem.
     */

  }, {
    key: "saveNewMetaproperty",
    value: function saveNewMetaproperty() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      return this.api.send("POST", "v4/metaproperties/", {
        data: JSON.stringify(params)
      });
      // The API requires an object with the query content stringified inside
    }

    /**
     * Modify new metaproperty with the information provided.
     * @see {@link https://bynder.docs.apiary.io/#reference/metaproperties/specific-metaproperty-operations/modify-metaproperty|API Call}
     * @param {Object} object={} - An object containing the data of the metaproperty.
     * @param {String} params.id - The id of the desired metaproperty.
     * @return {Promise} Object - Returns a Promise that, when fulfilled, will either return an empty Object in
     * case it's successful or an Error with the problem.
     */

  }, {
    key: "editMetaproperty",
    value: function editMetaproperty() {
      var _ref5 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var id = _ref5.id,
          params = (0, _objectWithoutProperties3.default)(_ref5, ["id"]);

      if (!id) {
        return rejectValidation("metaproperty", "id");
      }
      return this.api.send("POST", "v4/metaproperties/" + id + "/", {
        data: JSON.stringify(params)
      });
      // The API requires an object with the query content stringified inside
    }

    /**
     * Delete the metaproperty with the provided id.
     * @see {@link http://docs.bynder.apiary.io/#reference/metaproperties/delete-metaproperty|API Call}
     * @param {Object} object={} - An object containing the id of the metaproperty to be deleted.
     * @param {String} object.id - The id of the metaproperty.
     * @return {Promise} Object - Returns a Promise that, when fulfilled, will either return an empty Object in
     * case it's successful or an Error with the problem.
     */

  }, {
    key: "deleteMetaproperty",
    value: function deleteMetaproperty() {
      var _ref6 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          id = _ref6.id;

      if (!id) {
        return rejectValidation("metaproperty", "id");
      }
      return this.api.send("DELETE", "v4/metaproperties/" + id + "/");
    }

    /**
     * Add an option of metaproperty
     * @see {@link http://docs.bynder.apiary.io/#reference/metaproperties/specific-metaproperty-operations/create-metaproperty-option|API Call}
     * @param {Object} params={} - An object containing the id of the desired metaproperty.
     * @param {String} params.id - The id of the desired metaproperty.
     * @param {String} params.name - The name of the desired metaproperty.
     * @return {Promise} Response - Returns a Promise that, when fulfilled, will either return an Object with the
     * response or an Error with the problem.
     */

  }, {
    key: "saveNewMetapropertyOption",
    value: function saveNewMetapropertyOption() {
      var _ref7 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var id = _ref7.id,
          params = (0, _objectWithoutProperties3.default)(_ref7, ["id"]);

      if (!id || !params.name) {
        return rejectValidation("metaproperty option", "id or name");
      }

      return this.api.send("POST", "v4/metaproperties/" + id + "/options/", {
        data: JSON.stringify(params)
      });
    }

    /**
     * modify an option of metaproperty
     * @see {@link http://docs.bynder.apiary.io/#reference/metaproperties/specific-metaproperty-operations/modify-metaproperty-option|API Call}
     * @param {Object} params={} - An object containing the id of the desired metaproperty.
     * @param {String} params.id - The id of the desired metaproperty.
     * @param {String} params.optionId - The id of the desired option.
     * @param {String} params.name - The id of the desired metaproperty.
     * @return {Promise} Response - Returns a Promise that, when fulfilled, will either return an Object with the
     * response or an Error with the problem.
     */

  }, {
    key: "editMetapropertyOption",
    value: function editMetapropertyOption() {
      var _ref8 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var id = _ref8.id,
          params = (0, _objectWithoutProperties3.default)(_ref8, ["id"]);

      if (!id || !params.optionId) {
        return rejectValidation("metaproperty option", "id or optionId");
      }

      return this.api.send("POST", "v4/metaproperties/" + id + "/options/" + params.optionId + "/", { data: JSON.stringify(params) });
    }

    /**
     * delete an option of metaproperty
     * @see {@link http://docs.bynder.apiary.io/#reference/metaproperties/specific-metaproperty-operations/delete-metaproperty-option|API Call}
     * @param {Object} params={} - An object containing the id of the desired metaproperty.
     * @param {String} params.id - The id of the desired metaproperty.
     * @param {String} params.optionId - The id of the desired option.
     * @param {String} params.name - The id of the desired metaproperty.
     * @return {Promise} Response - Returns a Promise that, when fulfilled, will either return an Object with the
     * response or an Error with the problem.
     */

  }, {
    key: "deleteMetapropertyOption",
    value: function deleteMetapropertyOption(_ref9) {
      var id = _ref9.id,
          optionId = _ref9.optionId;

      if (!id || !optionId) {
        return rejectValidation("metaproperty option", "id or optionId");
      }
      return this.api.send("DELETE", "v4/metaproperties/" + id + "/options/" + optionId + "/");
    }

    /**
     * Get the assets usage information according to the id provided.
     * @see {@link https://bynder.docs.apiary.io/#reference/asset-usage/asset-usage-operations/retrieve-asset-usage|API Call}
     * @param {Object} queryObject - An object containing the id of the desired asset.
     * @param {String} queryObject.id - The id of the desired asset to retrieve usage for.
     * @return {Promise} Asset Usage - Returns a Promise that, when fulfilled, will either return an Object with
     * the asset usage or an Error with the problem.
     */

  }, {
    key: "getAssetUsage",
    value: function getAssetUsage(queryObject) {
      if (!queryObject.id) {
        return rejectValidation("asset usage", "id");
      }

      var request = this.api.send('GET', '/media/usage/', { asset_id: queryObject.id });
      return request;
    }

    /**
     * Create a usage for an asset according to the provided query object.
     * @see {@link https://bynder.docs.apiary.io/#reference/asset-usage/asset-usage-operations/create-asset-usage|API Call}
     * @param {Object} queryObject - An object containing the properties for the desired asset usage.
     * @param {String} queryObject.id - The id of the desired asset to create a usage for.
     * @param {String} queryObject.integration_id - The id of the desired integration to add.
     * @param {String} queryObject.timestamp - Datetime. ISO8601 format: yyyy-mm-ddThh:mm:ssZ.
     * @param {String} queryObject.uri - Location. Example: /hippo/first_post.
     * @param {String} queryObject.additional - Additional information. Example: Usage description.
     * @return {Promise} Asset usage - Returns a Promise that, when fulfilled, will either return an Object with
     * the asset usage or an Error with the problem.
     */

  }, {
    key: "saveNewAssetUsage",
    value: function saveNewAssetUsage(queryObject) {
      if (!queryObject.id) {
        return rejectValidation("asset usage", "id");
      }
      if (!queryObject.integration_id) {
        return rejectValidation("asset usage", "integration_id");
      }

      var request = this.api.send('POST', '/media/usage/', {
        asset_id: queryObject.id,
        integration_id: queryObject.integration_id,
        timestamp: queryObject.timestamp || null,
        uri: queryObject.uri || null,
        additional: queryObject.additional || null
      });
      return request;
    }

    /**
     * Deletes an asset usage based on the provided asset and integration ids.
     * @see {@link https://bynder.docs.apiary.io/#reference/asset-usage/asset-usage-operations/delete-asset-usage|API Call}
     * @param {Object} queryObject - An object containing the id of the desired asset.
     * @param {String} queryObject.id - The id of the desired asset to retrieve usage for.
     * @param {String} queryObject.integration_id - The id of the desired integration to delete.
     * @param {String} queryObject.uri - Location. Example: /hippo/first_post.
     * @return {Promise} Asset Usage - Returns a Promise that, when fulfilled, will either return an Object with
     * the asset usage or an Error with the problem.
     */

  }, {
    key: "deleteAssetUsage",
    value: function deleteAssetUsage(queryObject) {
      if (!queryObject.id) {
        return rejectValidation("asset usage", "id");
      }
      if (!queryObject.integration_id) {
        return rejectValidation("asset usage", "integration_id");
      }

      var request = this.api.send('DELETE', '/media/usage/', {
        asset_id: queryObject.id,
        integration_id: queryObject.integration_id,
        uri: queryObject.uri || null
      });

      return request;
    }

    /**
     * Get all the tags
     * @see {@link http://docs.bynder.apiary.io/#reference/tags/tags-access/retrieve-entry-point|API Call}
     * @param {Object} [params={}] - An object containing the parameters accepted by the API to narrow the query.
     * @return {Promise} Tags - Returns a Promise that, when fulfilled, will either return an Array with the
     * tags or an Error with the problem.
     */

  }, {
    key: "getTags",
    value: function getTags() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      return this.api.send("GET", "v4/tags/", params);
    }

    /**
     * Get collections according to the parameters provided
     * @see {@link http://docs.bynder.apiary.io/#reference/collections/collection-operations/retrieve-collections|API Call}
     * @param {Object} [params={}] - An object containing the parameters accepted by the API to narrow the query.
     * @return {Promise} Collections - Returns a Promise that, when fulfilled, will either return an Array with the
     * collections or an Error with the problem.
     */

  }, {
    key: "getCollections",
    value: function getCollections() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      return this.api.send("GET", "v4/collections/", params);
    }

    /**
     * Get the collection information according to the id provided.
     * @see {@link http://docs.bynder.apiary.io/#reference/collections/specific-collection-operations/retrieve-specific-collection|API Call}
     * @param {Object} params={} - An object containing the id of the desired collection.
     * @param {String} params.id - The id of the desired collection.
     * @return {Promise} Collection - Returns a Promise that, when fulfilled, will either return an Object with the
     * collection or an Error with the problem.
     */

  }, {
    key: "getCollection",
    value: function getCollection() {
      var _ref10 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          id = _ref10.id;

      if (!id) {
        return rejectValidation("collection", "id");
      }
      return this.api.send("GET", "v4/collections/" + id + "/");
    }

    /**
     * Create the collection information according to the name provided.
     * @see {@link http://docs.bynder.apiary.io/#reference/collections/specific-collection-operations/create-collection|API Call}
     * @param {Object} params={} - An object containing the id of the desired collection.
     * @param {String} params.name - The name of the desired collection.
     * @param {String} params.description - The description of the desired collection.
     * @return {Promise} Response - Returns a Promise that, when fulfilled, will either return an Object with the
     * response or an Error with the problem.
     */

  }, {
    key: "saveNewCollection",
    value: function saveNewCollection() {
      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      if (!params.name) {
        return rejectValidation("collection", "name");
      }
      return this.api.send("POST", "v4/collections/", params);
    }

    /**
     * Add assets to the desired collection.
     * @see {@link http://docs.bynder.apiary.io/#reference/collections/specific-collection-operations/add-asset-to-a-collection|API Call}
     * @param {Object} params={} - An object containing the id of the desired collection.
     * @param {String} params.id - The id of the shared collection.
     * @param {String} params.data - JSON-serialised list of asset ids to add.
     * @return {Promise} Response - Returns a Promise that, when fulfilled, will either return an Object with the
     * response or an Error with the problem.
     */

  }, {
    key: "addMediaToCollection",
    value: function addMediaToCollection() {
      var _ref11 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          id = _ref11.id,
          data = _ref11.data;

      if (!id) {
        return rejectValidation("collection", "id");
      }
      if (!data) {
        return rejectValidation("collection", "data");
      }
      return this.api.send("POST", "v4/collections/" + id + "/media/", {
        data: JSON.stringify(data)
      });
    }

    /**
     * Remove assets from desired collection.
     * @see {@link http://docs.bynder.apiary.io/#reference/collections/specific-collection-operations/remove-asset-from-a-collection|API Call}
     * @param {Object} params={} - An object containing the id of the desired collection and deleteIds of assets.
     * @param {String} params.id - The id of the shared collection.
     * @param {String} params.deleteIds - Asset ids to remove from the collection
     * @return {Promise} Response - Returns a Promise that, when fulfilled, will either return an Object with the
     * response or an Error with the problem.
     */

  }, {
    key: "deleteMediaFromCollection",
    value: function deleteMediaFromCollection() {
      var _ref12 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          id = _ref12.id,
          deleteIds = _ref12.deleteIds;

      if (!id) {
        return rejectValidation("collection", "id");
      }
      if (!deleteIds) {
        return rejectValidation("collection", "deleteIds");
      }
      return this.api.send("DELETE", "v4/collections/" + id + "/media/", {
        deleteIds: Array.isArray(deleteIds) ? deleteIds.join(",") : deleteIds
      });
    }

    /**
     * Share the collection to the recipients provided.
     * @see {@link http://docs.bynder.apiary.io/#reference/collections/specific-collection-operations/share-collection|API Call}
     * @param {Object} params={} - An object containing the id of the desired collection.
     * @param {String} params.id - The id of the shared collection.
     * @param {String} params.recipients - The email addressed of the recipients.
     * @param {String} params.collectionOptions - The recipent right of the shared collection: view, edit
     * @return {Promise} Collection - Returns a Promise that, when fulfilled, will either return an Object with the
     * collection or an Error with the problem.
     */

  }, {
    key: "shareCollection",
    value: function shareCollection() {
      var _ref13 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var id = _ref13.id,
          params = (0, _objectWithoutProperties3.default)(_ref13, ["id"]);

      if (!id) {
        return rejectValidation("collection", "id");
      }
      if (!params.recipients) {
        return rejectValidation("collection", "recipients");
      }
      if (!params.collectionOptions) {
        return rejectValidation("collection", "collectionOptions");
      }

      return this.api.send("POST", "v4/collections/" + id + "/share/", params);
    }

    /**
     * Get a list of brands and subbrands
     * @see {@link https://bynder.docs.apiary.io/#reference/security-roles/specific-security-profile/retrieve-brands-and-subbrands}
     * @return {Promise}
     */

  }, {
    key: "getBrands",
    value: function getBrands() {
      return this.api.send("GET", "v4/brands/");
    }

    /**
     * Gets the closest Amazon S3 bucket location to upload to.
     * @see {@link https://bynder.docs.apiary.io/#reference/upload-assets/1-get-closest-amazons3-upload-endpoint/get-closest-amazons3-upload-endpoint}
     * @return {Promise} Amazon S3 location url string.
     */

  }, {
    key: "getClosestUploadEndpoint",
    value: function getClosestUploadEndpoint() {
      return this.api.send("GET", "upload/endpoint");
    }

    /**
     * Starts the upload process. Registers a file upload with Bynder and returns authorisation information to allow
     * uploading to the Amazon S3 bucket-endpoint.
     * @see {@link https://bynder.docs.apiary.io/#reference/upload-assets/2-initialise-upload/initialise-upload}
     * @param {String} filename - filename
     * @return {Promise} Relevant S3 file information, necessary for the file upload.
     */

  }, {
    key: "initUpload",
    value: function initUpload(filename) {
      if (!filename) {
        return rejectValidation("upload", "filename");
      }
      return this.api.send("POST", "upload/init", { filename: filename });
    }

    /**
     * Registers a temporary chunk in Bynder.
     * @see {@link https://bynder.docs.apiary.io/#reference/upload-assets/3-upload-file-in-chunks-and-register-every-uploaded-chunk/register-uploaded-chunk}
     * @param {Object} init - result from init upload
     * @param {Number} chunkNumber - chunk number
     * @return {Promise}
     */

  }, {
    key: "registerChunk",
    value: function registerChunk(init, chunkNumber) {
      var s3file = init.s3file,
          filename = init.s3_filename;
      var uploadid = s3file.uploadid,
          targetid = s3file.targetid;

      return this.api.send("POST", "v4/upload/", {
        id: uploadid,
        targetid: targetid,
        filename: filename + "/p" + chunkNumber,
        chunkNumber: chunkNumber
      });
    }

    /**
     * Finalises the file upload when all chunks finished uploading and registers it in Bynder.
     * @see {@link https://bynder.docs.apiary.io/#reference/upload-assets/4-finalise-a-completely-uploaded-file/finalise-a-completely-uploaded-file}
     * @param {Object} init - Result from init upload
     * @param {String} fileName - Original file name
     * @param {Number} chunks - Number of chunks
     * @param {String} [mediaId] - Media ID of the asset the file will be added to as additional
     * @return {Promise}
     */

  }, {
    key: "finaliseUpload",
    value: function finaliseUpload(init, filename, chunks, mediaId) {
      var s3file = init.s3file,
          s3filename = init.s3_filename;
      var uploadid = s3file.uploadid,
          targetid = s3file.targetid;

      var payload = {
        targetid: targetid,
        s3_filename: s3filename + "/p" + chunks,
        chunks: chunks
      };
      if (mediaId) {
        var finalizeUrl = "v4/media/" + mediaId + "/save/additional/" + uploadid;
        return this.api.send("POST", finalizeUrl, payload);
      } else {
        return this.api.send("POST", "v4/upload/" + uploadid + "/", (0, _extends3.default)({}, payload, { original_filename: filename }));
      }
    }

    /**
     * Checks if the files have finished uploading.
     * @see {@link https://bynder.docs.apiary.io/#reference/upload-assets/5-poll-processing-state-of-finalised-files/retrieve-entry-point}
     * @param {String[]} importIds - The import IDs of the files to be checked.
     * @return {Promise}
     */

  }, {
    key: "pollUploadStatus",
    value: function pollUploadStatus(importIds) {
      return this.api.send("GET", "v4/upload/poll/", {
        items: importIds.join(",")
      });
    }

    /**
     * Resolves once assets are uploaded, or rejects after 60 attempts with 2000ms between them
     * @param {String[]} importIds - The import IDs of the files to be checked.
     * @return {Promise}
     */

  }, {
    key: "waitForUploadDone",
    value: function waitForUploadDone(importIds) {
      var POLLING_INTERVAL = 2000;
      var MAX_POLLING_ATTEMPTS = (typeof process === "undefined" ? "undefined" : (0, _typeof3.default)(process)) === 'object' ? process.env.BYNDER_MAX_POLLING_ATTEMPTS || 60 : 60;
      var pollUploadStatus = this.pollUploadStatus.bind(this);
      return new Promise(function (resolve, reject) {
        var attempt = 0;
        (function checkStatus() {
          pollUploadStatus(importIds).then(function (pollStatus) {
            if (pollStatus !== null) {
              var itemsDone = pollStatus.itemsDone,
                  itemsFailed = pollStatus.itemsFailed;

              if (itemsDone.length === importIds.length) {
                // done !
                return resolve({ itemsDone: itemsDone });
              }
              if (itemsFailed.length > 0) {
                // failed
                return reject({ itemsFailed: itemsFailed });
              }
            }
            if (++attempt > MAX_POLLING_ATTEMPTS) {
              // timed out
              return reject(new Error("Stopped polling after " + attempt + " attempts"));
            }
            return setTimeout(checkStatus, POLLING_INTERVAL);
          }).catch(reject);
        })();
      });
    }

    /**
     * Saves a media asset in Bynder. If media id is specified in the data a new version of the asset will be saved.
     * Otherwise a new asset will be saved.
     * @see {@link https://bynder.docs.apiary.io/#reference/upload-assets/4-finalise-a-completely-uploaded-file/save-as-a-new-asset}
     * @param {Object} data - Asset data
     * @return {Promise}
     */

  }, {
    key: "saveAsset",
    value: function saveAsset(data) {
      var brandId = data.brandId,
          mediaId = data.mediaId;

      if (!brandId) {
        return rejectValidation("upload", "brandId");
      }
      var saveURL = mediaId ? "v4/media/" + mediaId + "/save/" : "v4/media/save/";

      return this.api.send("POST", saveURL, data);
    }

    /**
     * Uploads arbirtrarily sized buffer or stream file to provided S3 endpoint in chunks and registers each chunk to Bynder.
     * Resolves the passed init result and final chunk number.
     * @param {Object} file ={} - An object containing the id of the desired collection.
     * @param {String} file.filename - The file name of the file to be saved
     * @param {Buffer|Readable} file.body - The file to be uploaded. Can be either buffer or a read stream.
     * @param {Number} file.length - The length of the file to be uploaded
     * @param {string} endpoint - S3 endpoint url
     * @param {Object} init - Result from init upload
     * @param {progressCallback} [progressCallback] - Function which is called anytime there is a progress update
     * @return {Promise}
     */

  }, {
    key: "uploadFileInChunks",
    value: function uploadFileInChunks(file, endpoint, init, progressCallback) {
      var body = file.body;

      var bodyType = bodyTypes.get(body);
      var length = getLength(file);
      var CHUNK_SIZE = 1024 * 1024 * 5;
      var chunks = Math.ceil(length / CHUNK_SIZE);

      var registerChunk = this.registerChunk.bind(this);
      var uploadPath = init.multipart_params.key;

      var uploadChunkToS3 = function uploadChunkToS3(chunkData, chunkNumber) {
        var form = new FormData();
        var params = Object.assign(init.multipart_params, {
          name: basename(uploadPath) + "/p" + chunkNumber,
          chunk: chunkNumber,
          chunks: chunks,
          Filename: uploadPath + "/p" + chunkNumber,
          key: uploadPath + "/p" + chunkNumber
        });
        Object.keys(params).forEach(function (key) {
          form.append(key, params[key]);
        });
        form.append("file", chunkData);
        var opts = void 0;
        if (typeof window !== "undefined") {
          opts = {}; // With browser based FormData headers are taken care of automatically
        } else {
          opts = {
            headers: Object.assign(form.getHeaders(), {
              "content-length": form.getLengthSync()
            })
          };
        }
        return axios.post(endpoint, form, opts);
      };

      function delay(ms) {
        return new Promise(function (resolve) {
          setTimeout(resolve, ms);
        });
      }

      progressCallback({
        action: 'Uploading file',
        completed: 'Initializing',
        chunksUploaded: 0,
        chunks: chunks
      });

      // sequentially upload chunks to AWS, then register them
      function nextChunk(chunkNumber) {
        if (chunkNumber >= chunks) {
          return Promise.resolve({ init: init, chunkNumber: chunkNumber });
        }
        var chunkData = void 0;
        if (bodyType === bodyTypes.STREAM) {
          // handle stream data
          chunkData = body.read(CHUNK_SIZE);
          if (chunkData === null) {
            // our read stream is not done yet reading
            // let's wait for a while...
            return delay(50).then(function () {
              progressCallback({
                action: 'Uploading file',
                completed: 'Initializing',
                chunksUploaded: chunkNumber,
                chunks: chunks
              });
              return nextChunk(chunkNumber);
            });
          }
        } else {
          // handle buffer/blob data
          var start = chunkNumber * CHUNK_SIZE;
          var end = Math.min(start + CHUNK_SIZE, length);
          chunkData = body.slice(start, end);
        }
        var newChunkNumber = chunkNumber + 1;
        return uploadChunkToS3(chunkData, newChunkNumber).then(function () {
          return registerChunk(init, newChunkNumber);
        }).then(function () {
          progressCallback({
            action: 'Uploading file',
            completed: 'Initializing',
            chunksUploaded: chunkNumber,
            chunks: chunks
          });
          return nextChunk(newChunkNumber);
        });
      }
      return nextChunk(0);
    }

    /**
    * Callback for adding two numbers.
    *
    * @callback progressCallback
    * @param {Object} state={} - An object containing the progress state
    * @param {String} state.action - The next action
    * @param {String} [state.completed] - The last completed action
    * @param {Number} [state.chunks] - Total amount of chunks
    * @param {Number} state.chunksUploaded - Amount of chunks already uploaded
    */
    /**
     * Uploads an arbitrarily sized buffer or stream file and returns the uploaded asset information
     * @see {@link https://bynder.docs.apiary.io/#reference/upload-assets}
     * @param {Object} file={} - An object containing the id of the desired collection.
     * @param {String} file.filename - The file name of the file to be saved
     * @param {Buffer|Readable} file.body - The file to be uploaded. Can be either buffer or a read stream.
     * @param {Number} file.length - The length of the file to be uploaded
     * @param {Object} file.data={} - An object containing the assets' attributes
     * @param {Boolean} file.additional - Boolean that signals if the asset should be added as additional to an existing asset
     * @param {progressCallback} [progressCallback] - Function which is called anytime there is a progress update
     * @return {Promise} The information of the uploaded file, including IDs and all final file urls.
     */

  }, {
    key: "uploadFile",
    value: function uploadFile(file) {
      var progressCallback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function () {};
      var body = file.body,
          filename = file.filename,
          data = file.data,
          additional = file.additional;
      var brandId = data.brandId;

      var bodyType = bodyTypes.get(body);
      var length = getLength(file);

      if (!brandId) {
        return rejectValidation("upload", "brandId");
      }
      if (!filename) {
        return rejectValidation("upload", "filename");
      }
      if (!body || !bodyType) {
        return rejectValidation("upload", "body");
      }
      if (!length || typeof length !== "number") {
        return rejectValidation("upload", "length");
      }
      if (additional && !data.id) {
        return rejectValidation("upload", "id");
      }

      var getClosestUploadEndpoint = this.getClosestUploadEndpoint.bind(this);
      var initUpload = this.initUpload.bind(this);
      var uploadFileInChunks = this.uploadFileInChunks.bind(this);
      var finaliseUpload = this.finaliseUpload.bind(this);
      var saveAsset = this.saveAsset.bind(this);
      var waitForUploadDone = this.waitForUploadDone.bind(this);
      var totalChunks = void 0;

      progressCallback({
        action: 'Initializing',
        chunksUploaded: 0
      });
      return Promise.all([getClosestUploadEndpoint(), initUpload(filename)]).then(function (res) {
        var _res = (0, _slicedToArray3.default)(res, 2),
            endpoint = _res[0],
            init = _res[1];

        return uploadFileInChunks(file, endpoint, init, progressCallback);
      }).then(function (uploadResponse) {
        var init = uploadResponse.init,
            chunkNumber = uploadResponse.chunkNumber;

        totalChunks = chunkNumber;
        progressCallback({
          action: 'Finalizing upload',
          completed: 'Uploading file',
          chunksUploaded: chunkNumber,
          chunks: chunkNumber
        });
        return finaliseUpload(init, filename, chunkNumber, additional ? data.id : null);
      }).then(function (finalizeResponse) {
        if (additional) {
          return Promise.resolve(finalizeResponse);
        }
        var importId = finalizeResponse.importId;

        return waitForUploadDone([importId]);
      }).then(function (doneResponse) {
        if (additional) {
          return Promise.resolve(doneResponse);
        }
        var itemsDone = doneResponse.itemsDone;

        var importId = itemsDone[0];
        progressCallback({
          action: 'Saving asset',
          completed: 'Finalizing upload',
          chunksUploaded: totalChunks,
          chunks: totalChunks
        });
        return saveAsset(Object.assign(data, { importId: importId }));
      });
    }
  }]);
  return Bynder;
}();

module.exports = Bynder;