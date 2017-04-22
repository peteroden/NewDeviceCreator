// Copyright (c) Pete Roden. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

// node native modules
var fs = require('fs');
var path = require('path');

// external dependencies
var _ = require('lodash');
var colorsTmpl = require('colors-tmpl');

// sdk dependencies
var msRestAzure = require('ms-rest-azure');
var errors = require('azure-iot-common').errors;
var Message = require('azure-iot-common').Message;
var ConnectionString = require('azure-iothub').ConnectionString;
var SharedAccessSignature = require('azure-iothub').SharedAccessSignature;

var randomIds = {};

function inputError(message) {
  printErrorAndExit(message, 'Input Error:');
}

function printErrorAndExit(message, prefix) {
  if (!prefix) {
    prefix = 'Error:';
  }

  console.error(colorsTmpl('\n{bold}{red}' + prefix + '{/red}{/bold} ' + message));
  process.exit(1);
}

function printSuccess(message) {
  console.log(colorsTmpl('{green}' + message + '{/green}'));
}

function configLoc() {
  if (process.platform === 'darwin') {
    return {
      dir: process.env.HOME + '/Library/Application Support/iothub-maker',
      file: 'config'
    };
  }
  else if (process.platform === 'linux') {
    return {
      dir: process.env.HOME,
      file: '.iothub-maker'
    };
  }
  else if (process.platform === 'win32') {
    return {
      dir: process.env.LOCALAPPDATA + '/iothub-maker',
      file: 'config'
    };
  }
  else {
    inputError('\'login\' not supported on this platform');
  }
}

/**
 * get a new authentication token
 * @param {boolean} persist determines if the token should be cached
 * @param {*} callback 
 */
function newLogin(persist = false, callback) {
  msRestAzure.interactiveLogin(function(err, credentials) {
    if (err) {
      inputError(err);
      callback(false);
    }

    printSuccess('Login successful.');

    if(persist == true) {
      var loc = configLoc();
      fs.mkdir(loc.dir, function () {
        var sessionFilePath = path.join(loc.dir, loc.file);
        fs.writeFile(sessionFilePath, JSON.stringify(credentials), function (err) {
          if (err) {
            inputError(err.toString());
            callback(false);
          } else {
            callback(credentials);
          }
        });
      });
    } else {
      callback(credentials);
    }
  });
}

/**
 * Gets authtoken from cache or gets a new one
 */
function getAuthToken(callback){
  //check if saved token exists && if token is still valid
  var tokenCache = loadTokenFromUserFile();
  if (tokenCache != false) { //need to add a test to make sure token not expired
    callback(new msRestAzure.DeviceTokenCredentials(tokenCache));
  } else {
    newLogin(false, callback);
  }
}

function loadTokenFromUserFile() {
  var sas;
  var loc = configLoc();

  try {
    var token = JSON.parse(fs.readFileSync(loc.dir + '/' + loc.file, 'utf8'));
  } catch (err) { // swallow file not found exception
    return false;
  }

  return token;
}

function generateRandomId(prefix) {
  var newNumber;
  while (true) {
    newNumber = prefix + Math.floor(Math.random() * 10000);
    if (!randomIds || !(newNumber in randomIds)) {
      break;
    }
  }
  return newNumber;
}

module.exports = {
  inputError: inputError,
  printErrorAndExit: printErrorAndExit,
  printSuccess: printSuccess,
  newLogin: newLogin,
  getAuthToken: getAuthToken,
  configLoc: configLoc,
  generateRandomId: generateRandomId
};