#!/usr/bin/env node

'use strict';

//# vulgar init

//** Import dependencies
var program = require('commander'),
      utils = require('../lib/generate.js');

program
  .description('Generate scaffolding for a MEAN component')
  .parse(process.argv);

var options = {
  name: program.args.length ? program.args[0] : 'doohickey'
};

utils.generateNgRoute(options);
