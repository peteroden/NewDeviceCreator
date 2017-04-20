#!/usr/bin/env node
// Copyright (c) Pete Roden. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

var program = require('commander');
var packageJson = require('./package.json');

program
  .version(packageJson.version)
  .usage('[options] <command> [command-options] [command-args]')
  .command('login', 'start a session with your Azure user')
  .command('logout', 'terminate the current session with your Azure user')
  .command('list', '(coming soon) list the IoT hub environments you have deployed')
  .command('deploy', 'deploy iothub-maker web interface on public Azure Storage and Azure Function backend')
  .command('create <schema-json> <device|cloud> ', 'create an IoT hub environment from a schema file')
  .parse(process.argv);



