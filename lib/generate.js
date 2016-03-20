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

var modulesSource = 'src/';

exports.generationWizard = function(options) {

  console.log();

  switch (options.type) {

    // routable `Angular 2` component
    case 'ngr':

      // Set extra prompts to be displayed before generation
      options.extraPrompts = [{
        type: 'input',
        name: 'path',
        message: 'What would you like the path to this component to be?',
        default: ''
      }];

      // Specify which options will be passed to the `yeoman` generator
      // Some of these may be `null`, but they must be set before they
      // are passed into the generator hook
      options.opts = {
        'vulgarcli': true,
        'name': null,
        'module': null,
        'path': null,
        'dest': null
      };

      // Specify a success function if you need extra logic post generation
      options.functions = {
        success: function(options) {
          ngRouteGenerationSuccess(options);
        }
      }

      // Specify the subgenerator that this component should
      // interface with
      options.subgenerator = 'ng-route';

      // Call the generation function
      generate(options);

      break;

    // `Angular 2` component
    case 'ngc':

      // Specify which options will be passed to the `yeoman` generator
      // Some of these may be `null`, but they must be set before they
      // are passed into the generator hook
      options.opts = {
        'vulgarcli': true,
        'name': null,
        'module': null,
        'dest': null
      };

      // Specify the subgenerator that this component should
      // interface with
      options.subgenerator = 'ng-component';

      // Call the generation function
      generate(options);

      break;

    // `Angular 2` directive
    case 'ngd':
      // Specify which options will be passed to the `yeoman` generator
      // Some of these may be `null`, but they must be set before they
      // are passed into the generator hook
      options.opts = {
        'vulgarcli': true,
        'name': null,
        'module': null,
        'dest': null
      };

      // Specify the subgenerator that this component should
      // interface with
      options.subgenerator = 'ng-directive';

      // Call the generation function
      generate(options);

      break;

    // `Angular 2` pipe
    case 'ngp':
      // Specify which options will be passed to the `yeoman` generator
      // Some of these may be `null`, but they must be set before they
      // are passed into the generator hook
      options.opts = {
        'vulgarcli': true,
        'name': null,
        'module': null,
        'dest': null
      };

      // Specify the subgenerator that this component should
      // interface with
      options.subgenerator = 'ng-pipe';

      // Call the generation function
      generate(options);

      break;

    // `Angular 2` service
    case 'ngs':
      // Specify which options will be passed to the `yeoman` generator
      // Some of these may be `null`, but they must be set before they
      // are passed into the generator hook
      options.opts = {
        'vulgarcli': true,
        'name': null,
        'module': null,
        'dest': null
      };

      // Specify the subgenerator that this component should
      // interface with
      options.subgenerator = 'ng-service';

      // Call the generation function
      generate(options);

      break;

    default:
      console.log('Error: default switch case hit');
      break;
  }
}

var generate = exports.generate = function(options) {

  series([

    function(done) {
      askForDirectory(options, done);
    },

    function(done) {
      displayAdditionalPrompts(options, done);
    },

    function(done) {
      // If there are any auxillary functions defined, call them now
      if(options.functions) {

        if(options.functions.success) {
          options.functions.success(options);
        }
      }
      // Call `done()` to continue the series
      done();
    },
  ], function(err) {

    if (err)
      throw err;

    console.log();
    console.log(chalk.green('  Scaffold generation successful!'));
    console.log();

    terminateGracefully(options);
  })
}

function displayAdditionalPrompts(options, done) {

  var prompts = [{
    type: 'input',
    name: 'name',
    message: 'What would you like to name this scaffold?',
    // Either the value passed in from the console by the user
    // or the name set based on the `$ vulgar scaffold` argument
    default: options.name || options.subgenerator
  }];

  console.log(options.extraPrompts)

  var modifiedPrompts = options.extraPrompts
                      ? prompts.concat(options.extraPrompts)
                      : prompts;

  // Prompt the user for the name
  inquirer.prompt(modifiedPrompts, function(results) {

    // Parse the `name` value into various forms for specific
    // use cases such as slugs and paths
    var slugifiedName = s(results.name).humanize().slugify().value(),
       classifiedName = s(slugifiedName).classify().value(),
        humanizedName = s(slugifiedName).humanize().value(),
        camelizedName = s(slugifiedName).camelize().value(),
    decapitalizedName = s(results.name).humanize().decapitalize().value();

    // Spacer
    console.log();

    // As long as the user enters a value for `name` hook into
    // `generator-vulgar` to generate the appropriate scaffold
    if(results.name.length > 0) {

      // Create destination path
      var dest = modulesSource + '/' + slugifiedName + '/';

      // Set the `dest` value in our `options.opts` object to
      // the user supplied value
      options.opts.dest = dest;

      // Set the `name` value in our `options.opts` object to
      // the user supplied value
      options.opts.name = results.name;

      // Set the `path` value in our `options.opts` object to
      // the user supplied value, only if generating
      // a routable Angular component
      if(options.subgenerator === 'ng-route')
        options.opts.path = results.path;

      // Call the appropriate subgenerator based on the value detemined
      // earlier
      env.lookup(function () {
        env.run('vulgar:' + options.subgenerator, options.opts, done);
      });
    }

    // TODO: Use recursion to continue to prompt the user for a
    // valid name input if they input an invalid name
    else done();
  });
}

// Function using recursion to present the user with a terminal
// file browser for directory selection
function askForDirectory(options, done) {

  var prompts = [{
    type: 'list',
    name: 'module',
    message: 'Please specify where you would like to create this scaffold',
    // Define some default choices
    choices: [{
      value: '../',
      name: '../'
    },
    {
      value: '',
      name: 'Select this directory'
    }]
  }];

  // Add module choices
  if (fs.existsSync(modulesSource)) {

    fs.readdirSync(modulesSource).forEach(function (folder) {
      var stat = fs.statSync(modulesSource + '/' + folder);

      if (stat.isDirectory()
            // Exclude the `assets` and `sass` directories
            && folder !== 'assets'
            && folder !== 'sass') {

        prompts[0].choices.push({
          value: folder,
          name: folder
        });
      }
    });
  }

  inquirer.prompt(prompts, function(results) {

    modulesSource = modulesSource + '/' + results.module;

    // Continue to queue the user for a location
    // until no value is returned, which equates
    // to the `Select this directory` choice
    if(results.module) {
      askForDirectory(options, done);
    } else {
      options.opts.module = results.module;
      done();
    }
  });
}

var ngRouteGenerationSuccess = function(options) {

  console.log();
  console.log(chalk.green('  Generation of routable Angular component successful!'));
  console.log();
  console.log('  To utilize the ' + options.opts.name + ' component, open your main application')
  console.log('  component, import ' + s(options.opts.name).slugify().value() + '-root.component.ts, and add')
  console.log('  it into the router config:');
  console.log();
  console.log('    @RouteConfig([');
  console.log('      { path: \'' + s(options.opts.name).camelize().value() + '/...\', name: \'' + s(options.opts.name).classify().value() + 'Root\', component: ' + s(options.opts.name).classify().value() + 'Root }');
  console.log('    ])');
  console.log('');
}

function terminateGracefully(options) {

  console.log(
    chalk.green('Generation complete. ') +
    chalk.red('Process self-destructing...')
  );
  console.log('...');

  process.exit(0);
}
