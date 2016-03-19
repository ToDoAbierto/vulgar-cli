'use strict';

var inquirer = require('inquirer'),
       chalk = require('chalk'),
      series = require('async-series'),
      prompt = require('prompt'),
      yeoman = require('yeoman-environment'),
         env = yeoman.createEnv(),
           s = require('underscore.string'),
          fs = require('fs'),
           _ = require('lodash');

exports.generationWizard = function(options) {

  console.log();

  switch (options.type) {

    case 'ngr':
      generateNgRoute(options);
      break;

    default:
      console.log('Error: default switch case hit');
      break;
  }
}

var generateNgRoute = exports.generateNgRoute = function(options) {

  var cachedName = '',
      cachedPath = '',
   modulesSource = 'src/';

  series([

    function(done){

      var questions = [{
        type: 'list',
        name: 'moduleName',
        default: 'app',
        message: 'Which module does this route belongs to?',
        choices: []
      }, {
        type: 'input',
        name: 'name',
        message: 'What would you like to name this routable component?',
        default: options.name
      }, {
        type: 'input',
        name: 'path',
        message: 'What would you like the path to this component to be?',
        default: options.name
      }];

      // Add module choices
      if (fs.existsSync(modulesSource)) {

        fs.readdirSync(modulesSource).forEach(function (folder) {
          var stat = fs.statSync(modulesSource + '/' + folder);

          if (stat.isDirectory()
                // Exclude the `assets` and `sass` directories
                && folder !== 'assets'
                && folder !== 'sass') {

            questions[0].choices.push({
              value: folder,
              name: folder
            });
          }
        });
      }

      inquirer.prompt(questions, function(results) {

        var slugifiedName = s(results.name).humanize().slugify().value(),
           classifiedName = s(slugifiedName).classify().value(),
            humanizedName = s(slugifiedName).humanize().value(),
            camelizedName = s(slugifiedName).camelize().value(),
        decapitalizedName = s(results.name).humanize().decapitalize().value();

        var dest = modulesSource  + results.moduleName + '/' + decapitalizedName + '/';

        console.log();

        if(results.name.length > 0 ||
           results.path.length > 0) {

               cachedName = results.name;
               cachedPath = results.path;

               env.lookup(function () {
                 env.run('vulgar:ng-route', { 'vulgarcli': true, 'name': results.name, 'path': results.path, 'module': results.moduleName }, done);
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
