#!/usr/bin/env node
// Copyright (c) Pete Roden. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

'use strict';

var program = require('commander');

var info;

program
  .description('Deploy iothub-make to an Azure Function and Storage')

  .usage('-s [subscription-id] -rg [resourcegroup-name]')
  .option('-r, --resourcegroup <resourcegroup>', 'Name of Resource Group to deploy into')
  .option('-s, --subscrptionid', 'Subscription ID of the subscription to deploy into')
  .parse(process.argv);

  