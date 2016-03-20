#!/usr/bin/env node

'use strict';

//# vulgar init

//** Import dependencies
var program = require('commander'),
      utils = require('../lib/generate.js'),
          _ = require('lodash');

program
  .description('Generate scaffolding for a MEAN component')
  .parse(process.argv);

var options = {
  name: program.args.length ? program.args[1] : 'thingamajig',
  type: program.args.length ? program.args[0] : 'doohickey'
};

// TODO: print help with no args
if(program.args.length < 1) {
  //program.help();
}

//** If there are arguments, check their validity
var validArgs = ['ngr', 'ngc'];

//** If there is no valid argument, prompt the user to get help
if (!_.contains(validArgs, program.args[0])) {
  console.log('vulgar: `' + program.rawArgs[2] + '` is not a valid '
    + 'argument for `vulgar scaffold`. Please see `vulgar --help`.');
  console.log();
  process.exit(1);
}

utils.generationWizard(options);
