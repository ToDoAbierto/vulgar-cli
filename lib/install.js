'use strict';

var config = require('../config')(), // TODO: config
      napi = config.napiUrl;
     shell = require('shelljs'),
        fs = require('fs'),
     chalk = require('chalk'),
 mongoCtrl = require('./controllers/mongo'), // TODO: mongoCtrl
     users = require('./controllers/users'), // TODO: user
    series = require('async-series'),
   request = require('request'),
        qs = require('querystring'),
  inquirer = require('inquirer'),
    prompt = require('prompt');

// TODO: Implement utils.Progress()
var progress = new utils.Progress();

exports.init = function(options) {

  progress.start();

  series([

    checkPermissions,

    function(done) {
      cloneMothership(options, done);
    },

    function(done) {
      updateSettings(options, done);
    },

    function(done) {
      createMeanJson(options, done);
    },

    printIntro,

    function(done) {
      addGitRemote(options.name, done);
    },

    function(done) {

      createLocalUser(options, function(err, user) {

        console.log();

        if(user)
          options.email = user.email;

        if(err)
          return done(err);

        done();
      });
    },

    function(done) {
      createNetworkUser(options, done);
    },
  ],

  function(err) {

    if(err)
      throw err;

    nextSteps(options);
  });

  progress.stop();
};

function updateSettings(options, done) {

  var data = {
    name: options.name
  };

  var path = process.cwd() + '/' + options.name + '/mean.json';

  utils.updateMeanJson(path, data, function() {
    done();
  });
}

function createMeanJson(options, done) {
  utils.updateGlobalMeanJson(function() {
    done();
  })
}

function checkPermissions(done) {

  if(utils.isWin) {

    console.log('On Windows platform -- Please check permissions '
      + ' independently');

    console.log('All permissions should be run with the local users '
      + ' permissions');

    done();
  } else {

    if(process.getuid) {

      var uid = process.getuid();

      if(uid === 0) {

        console.log(chalk.red('Installation of the MEAN stack should not be '
          + 'performed as the root user! Terminating...'));

        throw('Running as Root User');
      }
    }

    utils.checkNpmPermission(done);
  }
}

function printIntro(done) {

  var logo = fs.readFileSync(__dirname + '/../img/logo.txt');

  console.log(logo.toString());

  done();
}

function cloneMean(options, done) {

  if(!shell.which('git'))
    return console.log(chalk.red('Prerequisite not installed: git'));

  var name = options.name,
    source = (options.git
               ? 'github.com:datatypevoid/ng2-mean-webpack.git'
               : 'https://github.com/datatypevoid/ng2-mean-webpack.git');

  //** Allow specifying the specific repo
  if(options.repo) {
    source = options.repo;
  }

  //** If full clone is specified do a normal clone
  //     - default is a shallow --depth 1 clone
  var shallow = (options.full
                  ? ''
                  : ' --depth 1 ');
}

function createNetworkUser(options, done) {

	if (options.anonymizedData) {

		var token = utils.readToken();

		if (!token) {

			registerOrLogin(options, done, function(token) {

				initApp(options.name, token,  done);
			});
    }
		else {

			initApp(options.name, token, done);
		}
	}
}

function initApp(name, token, done) {

  utils.loadPackageJson('./' + name '/package.json', function(err, pack) {

    if(err || !pack)
      return console.log('You must be in a package root directory');

    var body = {
      name: name,
      description: pack.description,
      version: pack.version,
      keywords: pack.keywords
    };

    var options = {
      uri: napi + '/app/init',
      method: 'POST',
      form: querystring.stringify(body),
      headers: {
        'Content-Type' : 'multipart/form-data',
        'Content-Length' : qs.stringify(body).length,
        'authorization': token
      }
    };

    var path = process.cwd() + '/' + name + '/mean.json';

      request(options, function(error, response, body) {

        if(!error &&
            (response.statusCode === 200 || response.statusCode === 201 )
          ) {

          var data = JSON.parse(body);

          utils.updateMeanJson(path, {

            id: data._id,
            name: data.name
          }, function(err) {

            if (err)
              console.log('Your app did not save to the network :(');
          });
        } else {
          console.log('Your app did not save to the network :(');
          done();
        }
      });
  });
}

function nextSteps(options) {

	var name = options.name;

	//** Show the next step after the person has seen the start/help
  //** text so sleep for one second
	setTimeout(function() {
		console.log('#############################################');
    console.log('');
    console.log(chalk.green('All Done! - Now lets install '
      + ' the required dependencies...'));
    console.log('');
		console.log('    $ ' + chalk.green('cd %s && npm install'), name);
		console.log('  If this fails, try running it manually...');
		console.log('  Run the app by running:');
		console.log('    $ ' + chalk.green('cd %s and then run..'), name);
		console.log('    $ '+ chalk.green('gulp'));
		console.log();
		console.log();
		console.log();
	},1000);
}
