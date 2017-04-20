// Copyright (c) Microsoft. All rights reserved.
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

function newLogin(persist = false, callback) {
  msRestAzure.interactiveLogin(function(err, credentials) {
    if (err) {
      inputError(err);
      return false;
    }

    printSuccess('Login successful.');

    if(persist == true) {
      var loc = configLoc();
      fs.mkdir(loc.dir, function () {
        var sessionFilePath = path.join(loc.dir, loc.file);
        fs.writeFile(sessionFilePath, JSON.stringify(credentials), function (err) {
          if (err) {
            inputError(err.toString());
            return false;
          }
        });
      });
    }
    return credentials;
  });
}

function getAuthToken(){
  //check if saved token exists && if token is still valid
  var token = loadTokenFromUserFile();
  if (token != false && token.expiry> now()) {
    return token;
  } else {
    token = newLogin();
  }

  if (token != false) {
    return token;
  } else {
    return false;
  }
}

function loadTokenFromUserFile() {
  var sas;
  var loc = configLoc();

  try {
    token = JSON.parse(fs.readFileSync(loc.dir + '/' + loc.file, 'utf8'));
  } catch (err) { // swallow file not found exception
    return false;
  }

  return token;
}

module.exports = {
  inputError: inputError,
  printErrorAndExit: printErrorAndExit,
  printSuccess: printSuccess,
  newLogin: newLogin,
  getAuthToken: getAuthToken,
  configLoc: configLoc
};