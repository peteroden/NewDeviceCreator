#!/usr/bin/env node
// Copyright (c) Pete Roden. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

var program = require('commander');
var packageJson = require('./package.json');


/* global process */
var program = require('commander');

program
  .version(packageJson.version)
  .usage('[options] <command> [command-options] [command-args]')

require('./command-create.js')(program);

program.parse(process.argv);


/*
program
  .version(packageJson.version)
  .usage('[options] <command> [command-options] [command-args]')
  .command('login', '(work in progress) start a session with your Azure user')
  .command('logout', '(work in progress) terminate the current session with your Azure user')
  .command('list', '(coming soon) list the IoT hub environments you have deployed')
  .command('deploy', '(comining soon) deploy iothub-maker web interface on public Azure Storage and Azure Function backend')
  .command('create [command-options] <schema-json|schema-yaml> <subscriptionId> ', 'create an IoT hub environment from a schema file')
  .parse(process.argv);
*/


