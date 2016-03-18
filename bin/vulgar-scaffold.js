#!/usr/bin/env node

'use strict';

//# vulgar init

//** Import dependencies
var program = require('commander'),
      utils = require('../lib/generate.js');

program
  .description('Generate scaffolding for a MEAN component')
  .option('-r, --ng-route <name>', 'Create a new routable Angular component for the front-end')
  .parse(process.argv);

var options = {
  name: program.ngRoute || 'component'
};

utils.generateNgRoute(options);
