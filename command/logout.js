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
var printErrorAndExit = require('./common.js').printErrorAndExit;
var configLoc = require('./common.js').configLoc;


program
  .description('Log out of Azure')
  .parse(process.argv);

var loc = configLoc();
var path = path.join(loc.dir, loc.file);

try {
  fs.unlinkSync(path);
  printSuccess('Login successfully terminated.');
}
catch (err) {
  if (err.code === 'ENOENT') {
    printErrorAndExit('No login information found.');
  } else {
    throw err;
  }
}




