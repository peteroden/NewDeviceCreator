#!/usr/bin/env node
// Copyright (c) Pete Roden. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

// Native node modules
var fs = require('fs');
var path = require('path');

// External dependencies
var program = require('commander');

// Local dependencies
var printSuccess = require('./common.js').printSuccess;
var configLoc = require('./common.js').configLoc;
var newLogin = require('./common.js').newLogin;

// SDK dependencies
var ConnectionString = require('azure-iothub').ConnectionString;
var SharedAccessSignature = require('azure-iothub').SharedAccessSignature;

var info;

program
  .description('Log into Azure to create and manage IoT Hub services')
  .parse(process.argv);

newLogin(true);




