// Native node modules
var fs = require('fs');
var path = require('path');
var util = require('util');

// External dependencies
var _  = require('lodash');
var yaml = require('js-yaml');
var async = require('async');
var msRestAzure = require('ms-rest-azure');

// Local dependencies
var getAuthToken = require('../lib/common.js').getAuthToken;
var generateRandomId = require('../lib/common.js').generateRandomId;
var DeployIoTHub = require('../lib/iothub-maker-create.js').DeployIoTHub;
var CreateDevice = require('../lib/iothub-maker-create.js').CreateDevice;
var CreateDeviceFirmware = require('../lib/iothub-maker-create.js').CreateDeviceFirmware;
var CreateMobileApp = require('../lib/iothub-maker-create.js').CreateMobileApp;


var svcPrincipal = {
  "clientId" : process.env['CLIENT_ID'],
  "domain": process.env['DOMAIN'],
  "secret": process.env['APPLICATION_SECRET'],
  "subscriptionId": process.env['AZURE_SUBSCRIPTION_ID']
}

module.exports = function (context, req) {
  context.log('Node.js HTTP trigger function processed a request. RequestUri=%s', req.originalUrl);

  var schemaString = req.body.schema;
  var subscriptionId = req.body.subscriptionId;
  var schema = (schemaString.charAt(0) !== '{') ? yaml.safeLoad(schemaString) : JSON.parse(schemaString);

  async.waterfall([
    function (callback) {
      if (program.all || program.cloud) {
        //TODO: need to replace the service pricipal login with Bearer token login as soon as I can get it working
        //getAuthToken(function (credentials) {
        msRestAzure.loginWithServicePrincipalSecret(svcPrincipal.clientId, svcPrincipal.secret, svcPrincipal.domain, function (err, credentials) {
          DeployIoTHub(credentials, subscriptionId, schema, callback);
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
    },
    function (callback) {
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
        context.done();
      }
    }
  ]);
};