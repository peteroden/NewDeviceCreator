// Native node modules
var fs = require('fs');
var path = require('path');
var util = require('util');

// External dependencies
var _  = require('lodash');
var yaml = require('js-yaml');
var async = require('async');

var getAuthToken = require('../lib/common.js').getAuthToken;
var generateRandomId = require('../lib/common.js').generateRandomId;
var DeployIoTHub = require('../lib/iothub-maker-create.js').DeployIoTHub;
var CreateDevice = require('../lib/iothub-maker-create.js').CreateDevice;
var CreateDeviceFirmware = require('../lib/iothub-maker-create.js').CreateDeviceFirmware;
var CreateMobileApp = require('../lib/iothub-maker-create.js').CreateMobileApp;


module.exports = function (context, req) {
  context.log('Node.js HTTP trigger function processed a request. RequestUri=%s', req.originalUrl);

  var schemaString = req.body.schema;
  var schema = (schemaString.charAt(0) !== '{') ? yaml.safeLoad(schemaString) : JSON.parse(schemaString);

  async.waterfall([
    function (callback) {
      if (program.all || program.cloud) {
        getAuthToken(function (credentials) {
          DeployIoTHub(credentials, program.subscription, schema, callback);
        });
      } else {
        callback();
      }
    },
    function (output, callback) {
      var iotHubConnectionString = output.iotHubConnectionString.value;
      CreateDevice(iotHubConnectionString, generateRandomId('FirstDevice-'), callback);
    },
    function (output, callback) {
      CreateDeviceFirmware(output, schema, callback);
    },
    function (callback) {
      CreateMobileApp(callback);
      if ((req.body && req.body.schema)) {
        context.res = {
          // status: 200, /* Defaults to 200 */
          body: "Hello schema"
        };
      } else {
        context.res = {
          status: 400,
          body: "Please pass a name on the query string or in the request body"
        };
      }
      context.done();
    }
  ]);



  if (req.query.name || (req.body && req.body.name)) {
    context.res = {
      // status: 200, /* Defaults to 200 */
      body: "Hello " + (req.query.name || req.body.name)
    };
  } else {
    context.res = {
      status: 400,
      body: "Please pass a name on the query string or in the request body"
    };
  }
  context.done();
};