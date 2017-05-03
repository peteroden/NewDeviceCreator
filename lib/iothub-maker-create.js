// Copyright (c) Pete Roden. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

// Native node modules
var fs = require('fs');
var path = require('path');
var util = require('util');

// External dependencies
var program = require('commander');
var  _  =  require('lodash');
var yaml  =  require('js-yaml');
var fse = require('fs-extra');
var path = require('path');
var async = require('async');

// Local dependencies
var inputError = require('./common.js').inputError;
var printSuccess = require('./common.js').printSuccess;
var configLoc = require('./common.js').configLoc;
var getAuthToken = require('./common.js').getAuthToken;
var generateRandomId = require('./common.js').generateRandomId;

// SDK dependencies
var  msRestAzure  =  require('ms-rest-azure');
var azureARMClient = require('azure-arm-resource');
var iothub = require('azure-iothub');
var ConnectionString = require('azure-iothub').ConnectionString;
var SharedAccessSignature = require('azure-iothub').SharedAccessSignature;

/**
 * Create device registration in IoT Hub
 * @param {*} iotHubConnectionString connection string for IoT Hub to use for device registry
 * @param {*} deviceId deviceId for device to be created
 * @param {*} callback 
 */
function CreateDevice(iotHubConnectionString, deviceId, callback) {
  var registry = iothub.Registry.fromConnectionString(iotHubConnectionString);

  // Create a new device
  var device = {
    "deviceId": deviceId
  };

  registry.create(device, function (err, deviceInfo, res) {
    if (err) console.log('error: ' + err.toString());
    //if (res) console.log('status: ' + res.statusCode + ' ' + res.statusMessage);
    if (deviceInfo) console.log('device info: ' + JSON.stringify(deviceInfo));
    var deviceConnectionString = 'HostName=' + res.client._host + ';DeviceId=' + deviceInfo.deviceId + ';SharedAccessKey=' + deviceInfo.authentication.symmetricKey.primaryKey;
    callback(null, deviceConnectionString);
  });
}

/**
 * Create Source Code scaffolding for IoT device
 * @param {string} deviceConnectionString connection string the device will use to connect
 * @param {object} schema schema object forthe IoT Hub environment
 * @param {*} callback 
 */
function CreateDeviceFirmware(deviceConnectionString, schema, callback) {
  var declaration = '';
  var definition = '';
  var defaultModelName;

  declaration += 'BEGIN_NAMESPACE(' + schema.namespace.name + ');\n';

  _.forEach(schema.namespace.models, function (model, modelname) {
    declaration += 'DECLARE_MODEL(' + modelname + ',\n';
    defaultModelName = modelname;

    _.forEach(model.data, function (data, dataname) {
      declaration += 'WITH_DATA(' + data + ', ' + dataname + '),\n';
    });

    _.forEach(model.actions, function (action, actionname) {
      if (!_.isNil(action) && _.size(action.parameters) > 0) {
        declaration += 'WITH_ACTION(' + actionname + '';
        _.forEach(action.parameters, function (parameter, parametername) {
          declaration += ', ' + parameter + ', ' + parametername;
        });
        declaration += '),\n';
        definition += 'EXECUTE_COMMAND_RESULT ' + actionname + '(' + modelname + '* device';
        _.forEach(action.parameters, function (parameter, parametername) {
          definition += ', ' + parameter + ' ' + parametername;
        });
        definition += ') {\n';
      } else {
        declaration += 'WITH_ACTION(' + actionname + '),\n';
        definition += 'EXECUTE_COMMAND_RESULT ' + actionname + '(' + modelname + '* device) {\n';
      }

      definition += '    (void)device;\n'
      definition += '    (void)printf("' + actionname + '.\\r\\n");\n';
      definition += '    return EXECUTE_COMMAND_SUCCESS;\n';
      definition += '}\n\n';
    });
    declaration = declaration.substring(0, declaration.length - 2) + '\n';
    declaration += ');\n';
  });

  declaration += 'END_NAMESPACE(' + schema.namespace.name + ');\n\n';

  fse.remove('DeviceFirmware', function (err) {
    if (err) {
      console.error(err);
      callback();
    }

    fse.copy('templates/device/ESP8266', 'DeviceFirmware', function (err) {
      if (err) {
        console.error(err);
        callback();
      }

      fse.removeSync('DeviceFirmware/src/snippets');
      var top = fse.readFileSync('./templates/device/ESP8266/src/snippets/top.c').toString()
        .replace(/%%CONNECTIONSTRING%%/g, deviceConnectionString);

      var bottom = fse.readFileSync('./templates/device/ESP8266/src/snippets/bottom.c').toString()
        .replace(/%%NAMESPACE%%/g, schema.namespace.name)
        .replace(/%%MODEL%%/g, defaultModelName);

      fse.writeFileSync('DeviceFirmware/src/simplesample_http.c', top + declaration + definition + bottom);
      //console.log(top+declaration+definition+bottom);

      console.log('DeviceFirmwareCreated!');
      callback();
    });
  });

}

function CreateMobileApp(callback) {
  callback();
}

/**
 * Create IoT Hub environment based on schema description
 * @param {DeviceTokenCredentials} credentials Token to use for authentication
 * @param {string} subscriptionId subscription in which to create the IoT Hub environment
 * @param {object} schema schema defining the methods, data, etc. to be used in the environment
 * @param {*} callback 
 */
function DeployIoTHub(credentials, subscriptionId, schema, callback) {
  var armClient =  new  azureARMClient.ResourceManagementClient(credentials,  subscriptionId);
  var groupParameters = {
    location: schema.location,
    tags: {
      "IoTNamespace": schema.namespace.name
    }
  };
  armClient.resourceGroups.createOrUpdate(schema.namespace.name, groupParameters, function (rg) {
    var templateFilePath = path.join(__dirname, "..", "templates", "ARM", "IoT.json");
    var template = JSON.parse(fse.readFileSync(templateFilePath, 'utf8'));
    var parameters = {
      "namespace": {
        "value": schema.namespace.name
      }
    };
    var deploymentParameters = {
      "properties": {
        "parameters": parameters,
        "template": template,
        "mode": "Incremental"
      }
    };
    armClient.deployments.createOrUpdate(
      schema.namespace.name,
      generateRandomId(schema.namespace.name + 'deployment'),
      deploymentParameters,
      function (error, result) {
        console.log(result);
        //cs = result.properties.outputs.iotHubConnectionString.value;
        callback(null, result.properties.outputs);
      }
    );
  });
}

module.exports = {
  CreateDevice: CreateDevice,
  CreateDeviceFirmware: CreateDeviceFirmware,
  CreateMobileApp: CreateMobileApp,
  DeployIoTHub: DeployIoTHub
};