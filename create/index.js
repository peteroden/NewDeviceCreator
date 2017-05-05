// Copyright (c) Pete Roden. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

// Native node modules

// External dependencies
var msRestAzure = require('ms-rest-azure');
var yaml = require('js-yaml');
var async = require('async');
const express = require("express");
const createAzureFunctionHandler = require("azure-function-express").createAzureFunctionHandler;

// Local dependencies
//var getAuthToken = require('../lib/common.js').getAuthToken;
//var generateRandomId = require('../lib/common.js').generateRandomId;
var DeployIoTHub = require('../lib/iothub-maker-create.js').DeployIoTHub;
/*
var CreateDevice = require('../lib/iothub-maker-create.js').CreateDevice;
var CreateDeviceFirmware = require('../lib/iothub-maker-create.js').CreateDeviceFirmware;
var CreateMobileApp = require('../lib/iothub-maker-create.js').CreateMobileApp;
*/

// Create express app as usual
const app = express();

// Capture the service principal until bearer token code is fixed
var svcPrincipal = {
  "appId": process.env['APP_ID'],
  "secret": process.env['APP_SECRET'],
  "tenant": process.env['TENANT']
}

app.post("/api/test", (req, res) => {
  //let's log that we got a request and where it is from
  req.context.log('Node.js HTTP trigger function processed a request. RequestUri=%s', req.originalUrl);

  var subscriptionId = req.body.subscriptionId;
  var schemaString = req.body.schema;
  var schema = (schemaString.charAt(0) !== '{') ? yaml.safeLoad(schemaString) : JSON.parse(schemaString);
  req.context.log(schema);

  async.waterfall([
    function (callback) {
      if (req.body.build == "all") {
        //TODO need to replace the service principal login with Bearer token login as soon as I can get it working
        //getAuthToken(function (credentials) {
        msRestAzure.loginWithServicePrincipalSecret(svcPrincipal.appId, svcPrincipal.secret, svcPrincipal.tenant, function (err, credentials) {
          DeployIoTHub(credentials, subscriptionId, schema, callback);
          req.context.log('got here');
          //callback();
        });
      } else {
        callback();
      }
    },
    function (output, callback) {
      //var iotHubConnectionString = output.iotHubConnectionString.value;
      //CreateDevice(iotHubConnectionString, generateRandomId('FirstDevice-'), callback);
      req.context.log('got here too');
      callback();
    },
    function (callback) {
      //CreateDeviceFirmware(output, schema, callback);
      req.context.log('and here');
      callback();
    },
    function (callback) {
      //CreateMobileApp(callback);
      req.context.log('and here too');
      callback();
    },
    function (callback) {
      //now return stuff back to the originating caller
      res.json({
        foo  : "bar",
        bar  : "foo"
      });
      req.context.log('finally here');
      callback();
    }
  ]);

});

// Binds the express app to an Azure Function handler
module.exports = createAzureFunctionHandler(app);