// Copyright (c) Pete Roden. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

// Native node modules
var fs = require('fs');
var path = require('path');
var util = require('util');

// External dependencies
var program = require('commander');
var  _  = require('lodash');
var yaml = require('js-yaml');
var fse = require('fs-extra');
//var path = require('path');
var async = require('async');

// Local dependencies
//var inputError = require('./common.js').inputError;
//var printSuccess = require('./common.js').printSuccess;
//var configLoc = require('./common.js').configLoc;
var getAuthToken = require('./lib/common.js').getAuthToken;
var generateRandomId = require('./lib/common.js').generateRandomId;
var DeployIoTHub = require('./lib/iothub-maker-create.js').DeployIoTHub;
var CreateDevice = require('./lib/iothub-maker-create.js').CreateDevice;
var CreateDeviceFirmware = require('./lib/iothub-maker-create.js').CreateDeviceFirmware;
var CreateMobileApp = require('./lib/iothub-maker-create.js').CreateMobileApp;

// SDK dependencies
//var  msRestAzure  =  require('ms-rest-azure');
//var azureARMClient = require('azure-arm-resource');
//var iothub = require('azure-iothub');
//var ConnectionString = require('azure-iothub').ConnectionString;
//var SharedAccessSignature = require('azure-iothub').SharedAccessSignature;

module.exports = function (program) {
  program
    .command('create <schema-file>')
    .description('Create an Azure IoT Hub environment.')
    .usage('[options] <schema-file>')
    .option('-s, --subscription <subscriptionId>', 'subscriptionId to deploy into')
    .option('-a, --all', '(Default) Create the device, cloud, and mobile apps')
    .option('-d, --device <device-connection-string>', 'Create the device firmware')
    .option('-c, --cloud', 'Create the Azure services')
    .option('-m, --mobile', 'Create the mobile app')
    .action(function (schemaFile, program) {
      program.device = program.device || false;
      program.cloud = program.cloud || false;
      program.mobile = program.mobile || false;
      var allequal = ((program.device != false && program.cloud != false && program.mobile != false) 
                      || (program.device == false && program.cloud == false && program.mobile == false));
      program.all = ((program.all) || (allequal)) ? true : false;

      var schemaString = fse.readFileSync(schemaFile, 'utf8');
      var schema = (schemaString.charAt(0) !== '{') ? yaml.safeLoad(schemaString) : JSON.parse(schemaString);

      var armClient;
      var cs;

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
          if (program.all) {
            var iotHubConnectionString = output.iotHubConnectionString.value;
          } else if (program.device) {
            var iotHubConnectionString = program.device;
          }
          CreateDevice(iotHubConnectionString, generateRandomId('FirstDevice-'), callback);
        },
        function (output, callback) {
          CreateDeviceFirmware(output, schema, callback);
        },
        function (callback) {
          CreateMobileApp(callback);
        }
      ]);
    });
}