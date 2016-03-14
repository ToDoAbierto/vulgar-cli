#!/usr/bin/env node

'use strict';

//# vulgar init

//** Import dependencies
var wizard = require('../lib/wizard'),
    program = require('commander');

program
  .description('Create a MEAN application in the current working directory')
  .option('-b, --branch <branch>', 'git branch')
  .option('-g, --git', 'clone using git:// instead of https://')
  .option('--repo <repo>', 'Specify which repository to install')
  .option('-f, --full', 'Clone the full project including all commit history')
  .option('-m, --mail <mail>', 'Assign/Create admin user to specified email')
  .option('-u, --username <username>', 'Assign/Create admin user to the '
    + 'specified username')
  .option('-q, --quick', 'Jump right into the project directory and run '
    + '`npm install`')
  .parse(process.argv);

var options = {
  name: program.args.length ? program.args[0] : 'mean',
  branch: program.branch || 'master',
  git: program.git,
  full: program.full,
  repo: program.repo,
  email: program.mail,
  username: program.username,
  quick: program.quick
};

// Pass the mighty wizard our options
wizard(options);
