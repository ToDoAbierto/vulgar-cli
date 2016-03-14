#!/usr/bin/env node

'use strict';

//# Vulgar CLI

//** Import dependencies
var program = require('commander'),
          _ = require('lodash');

//** Set program version
var version = require('../package').version;

program.version(version,
                '-v, --version');

program
  .command('init <name> [options]',
           'Create a new MEAN application in the current working directory')
  .option('--env [env]', 'MEAN environment defaults to `development`')

  .parse(process.argv);

// TODO: print help with no args
if(program.args.length < 1) {
  //program.help();
}

//** If there is a command, check its validity
var commands = program.commands.map(function(command) {
  return command._name;
});

//** If there is no valid command, prompt the user to get help
if (!_.contains(commands, program.args[0])) {
  console.log('vulgar: `' + program.rawArgs[2] + '` is not a vulgar '
    + 'command. Please see `vulgar --help`.');
  console.log();
  process.exit(1);
}
