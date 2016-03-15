'use strict';

var config = require('../config')(), // TODO: config
      napi = config.napiUrl,
     shell = require('shelljs'),
        fs = require('fs'),
     chalk = require('chalk'),
     utils = require('./utils'),
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

  // DEBUG
  console.log('Series begin');

  series([

    checkPermissions,

    function(done) {

      cloneMean(options, done);
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
    }

    /*function(done) {
      createNetworkUser(options, done);
    },*/
  ],

  function(err) {

    if(err)
      throw err;

    nextSteps(options);
  });

  progress.stop();
};

function updateSettings(options, done) {

  // DEBUG
  console.log('update settings entered ');
  console.log('options: ');
  console.log(options);

  var data = {
    name: options.name
  };

  // DEBUG
  console.log('data set ');
  console.log(data);

  var path = process.cwd() + '/' + options.name + '/vulgar.json';

  // DEBUG
  console.log('path set ');
  console.log(path);

  // DEBUG
  console.log('calling utils.updateMeanJson with path and data ');
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

  // DEBUG
  console.log('checkPermissions entered');

  if(utils.isWin) {

    // DEBUG
    console.log('if(utils.isWin)');

    console.log('On Windows platform -- Please check permissions '
      + 'independently');

    console.log('All permissions should be run with the local users '
      + 'permissions');

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

  //** Install the specified branch or the stableTag -- no more MASTER!
  // var branch = options.branch ? options.branch : stableTag;
  var branch = options.branch;
  source = branch + ' ' + source + ' "' + name + '"';
  var gitCommand = 'git clone ' + shallow + ' -b' + source;
  console.log(chalk.green('Cloning branch %s into destination folder: '),
                options.branch,
                name);
  console.log(chalk.green(gitCommand));

  //** Run the `clone` command
  shell.exec(gitCommand, function(status, output) {

    if(status) {

      console.log(output);
      return done(status);
    }

    console.log();
    done();
  });
}

function createLocalUser(options, done) {

  console.log('Before you install the dependencies and fire up the server, '
    + 'let\'s setup the first admin user.');

  var questions = [{
    type: 'input',
    name: 'createUser',
    message: 'Cool, bring it on',
    default: 'N'
  }];

  inquirer.prompt(questions, function(results) {

    if(results.createUser === 'Y' ||
       results.createUser === 'y')
         userWizard(options, done);

    else done();
  });
}

function userWizard(options, done) {

  var User,
      DB;

  function require(value) {
    return !!value.trim() || 'Required';
  }

  var questions = [{

    type: 'input',
    name: 'email',
    message: 'Please provide an email address to link with your admin account',
    default: options.email,
    validate: function(input) {

      // Declare function as asynchronous, and save the `done` callback
      var callback = this.async();
      var regex = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
      var value = regex.test(input);

      if(value)
        return callback(true);

      callback('Invalid input for email');
    }
  }, {

    type: 'input',
    name: 'username',
    message: 'Please provide a username to link to your admin account',
    default: options.username,
    validate: required
  }];

  inquirer.prompt(questions, function(results) {
    mongoCtrl.connect('development', function(err, db) {

      DB = db;

      if(err) {

        console.error('Cannot create admin user');
        return done();
      }

      User = db.collection('users');

      find(results, function(user) {

        if (user)
          update(user);

        else
          create(results);
      });
    }, options.name);
  });

  function find(results, callback) {

    User.findOne({

      email: results.email
    }, function(err, user) {

      if (err) {

        console.error(err);
        return done();
      } else {
        callback(user);
      }
    });
  }

  function update(user) {
    if(user.roles.indexOf('admin') === -1) {

      User.update({

        email: user.email
      }, { $push: { roles: 'admin' } }, {

        w: 1,
        upsert: false,
        multi: false
      }, function(err) {

        if(err) {

          console.error(err);
          return done();
        } else {

          console.log(chalk.green('role admin added to your user'));
        }

        DB.close();

        done(null, user);
      });
    } else {

      console.log('User ' + user.username + ' found with an admin role');
      DB.close();
      done(null, user);
    }
  }

  function create(results) {

    console.log('Please provide a password to link to your '
      + 'initial admin user'  );

    require('./models/user')(DB);

    var User = DB.model('User');

    prompt.start();

    prompt.get({

      properties: {

        password: {

          minLength: 8,
          maxLength: 128,
          pattern: /^[A-Za-z0-9 _]*[A-Za-z0-9][A-Za-z0-9 _]*$/,
          message: 'Password must contain only alphanumeric characters, spaces, dashes, or underscores, with a maximum length of 128 characters long',
          hidden: true,
          required: true
        }
      }
    }, function (err, result) {

      var user = new User({

        email: results.email,
        password: result.password,
        name: results.username,
        username: results.username
      });

      user.roles.push('admin');

      user.save(function(err) {

        if (err)
          console.log(err);

        else
          console.log('Admin role added to your new user');
          DB.close();
          done(null, user);
      });
    });
  }
}

function addGitRemote(name, done) {

  shell.exec('cd ' + name + ' && git remote rename origin upstream',
    function(status, error) {

      if(!status) {

        console.log(' Added the `remote` upstream origin');
        console.log();
        console.log();
        console.log('#############################################');
        console.log();
        console.log(chalk.green.bold(' Congratulations on successfully '
          + 'installing a fresh MEAN stack courtesy of `vulgar-cli`'));
        console.log();

        done();
      } else {

        console.log(error);

        done(error);
      }
    });
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

  utils.loadPackageJson('./' + name + '/package.json', function(err, pack) {

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
