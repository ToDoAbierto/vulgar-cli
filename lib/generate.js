'use strict';

var inquirer = require('inquirer'),
       chalk = require('chalk'),
      series = require('async-series'),
      prompt = require('prompt'),
      yeoman = require('yeoman-environment'),
         env = yeoman.createEnv(),
           s = require('underscore.string');

// Import our angular routable component generator and register
// it for use later
var GeneratorNgRoute = require('./generators/ng-route/index.js');
env.registerStub(GeneratorNgRoute, 'vulgar:ng-route');

exports.generateNgRoute = function(options) {

  var cachedName = '',
      cachedPath = '';

  series([

    function(done){

      var questions = [{
        type: 'input',
        name: 'name',
        message: 'What would you like to name this routable component?',
        default: options.name
      },{
        type: 'input',
        name: 'path',
        message: 'What would you like the path to this component to be?',
        default: options.name
      }];

      inquirer.prompt(questions, function(results) {

        console.log();

        if(results.name.length > 0 ||
           results.path.length > 0) {

               cachedName = results.name;
               cachedPath = results.path;

               env.lookup(function () {
                 env.run('vulgar:ng-route', { 'vulgarcli': true, 'name': results.name, 'path': results.path }, done);
               });
           }

        else done();
      });
    }
  ], function(err) {

    if (err)
      throw err;

    console.log();
    console.log(chalk.green('  Generation of routable Angular component successful!'));
    console.log();
    console.log('  To utilize the ' + cachedName + ' component, open your main application')
    console.log('  component, import ' + cachedName + '-root.component.ts, and add')
    console.log('  it into the router config:');
    console.log();
    console.log('    @RouteConfig([');
    console.log('      { path: \'' + s(cachedName).camelize().value() + '/...\', name: \'' + s(cachedName).classify().value() + 'Root\', component: ' + s(cachedName).classify().value() + 'Root }');
    console.log('    ])');
    console.log('');

    terminateGracefully(options);
  });
}

function terminateGracefully(options) {

  console.log(
    chalk.green('Generation complete. ') +
    chalk.red('Process self-destructing...')
  );
  console.log('...');

  process.exit(0);
}
