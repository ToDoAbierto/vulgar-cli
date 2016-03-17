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
    prompt = require('prompt'),
    yeoman = require('yeoman-environment'),
       env = yeoman.createEnv();

//** Register `yeoman` generators with the `env` instance
//env.register(require.resolve('generator-vulgar'), 'vulgar');

// TODO: Implement utils.Progress()
var progress = new utils.Progress();

exports.init = function(options) {

  progress.start();

  series([

    checkPermissions,

    function(done) {

      cloneVulgar(options, done);
    },

    function(done) {
      generateConfigObject(options, done);
    },

    function(done) {
      updateSettings(options, done);
    },

    function(done) {
      createVulgarJson(options, done);
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
      installDependencies(options, done);
    },

    function(done) {
      nextSteps(options, done);
    }

    /*function(done) {
      createNetworkUser(options, done);
    },*/
  ],

  function(err) {

    if(err)
      throw err;

    terminateGracefully(options);
  });

  progress.stop();
};

function generateConfigObject(options, done) {

  env.lookup(function () {
    env.run('vulgar:config',{ 'vulgarcli': true, 'dest': (options.name + '/config/config.json')}, done);
  });
}

function updateSettings(options, done) {

  console.log('Updating settings...');
  console.log('');

  var data = {
    name: options.name
  };

  var path = process.cwd() + '/' + options.name + '/vulgar.json';

  utils.updateVulgarJson(path, data, function() {
    done();
  });
}

function createVulgarJson(options, done) {

  console.log('Updating global settings...');
  console.log('');

  utils.updateGlobalVulgarJson(
    {anonymizedData:  options.privacy === 'Y'},
    function() { done(); }
  );
}

function checkPermissions(done) {

  console.log('Checking permissions...');
  console.log('');

  if(utils.isWin) {

    console.log('  On Windows platform -- Please check permissions '
      + 'independently.');
    console.log('  All permissions should be run with the local users '
      + 'permissions');

    console.log('');

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

function cloneVulgar(options, done) {

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
  var gitCommand = 'git clone ' + shallow + ' -b ' + source;
  console.log(chalk.green('Cloning branch %s into destination folder: '),
                options.branch,
                name);
  console.log('');
  console.log(chalk.green(gitCommand));
  console.log('');

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

  console.log('Before we move on to dependencies and fire up the server, ');
  console.log('let\'s setup the first local admin user.');
  console.log('');

  var questions = [{
    type: 'input',
    name: 'createUser',
    message: 'Cool, bring it on!',
    default: 'N'
  }];

  inquirer.prompt(questions, function(results) {

    if(results.createUser === 'Y' ||
       results.createUser === 'y') {
         console.log('');
         userWizard(options, done);
       }

    else done();
  });
}

function userWizard(options, done) {

  console.log('Summoning the User Wizard...');
  console.log('');

  var User,
      DB;

  function required(value) {
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
        console.log('Error: ');
        console.log(err);
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

  console.log('-----------------------------------8<-------------[ cut here ]------------------');
  console.log('');

  console.log('  Adding git remote...');

  shell.exec('cd ' + name + ' && git remote rename origin upstream',
    function(status, error) {

      if(!status) {

        console.log('   Added the `remote` upstream origin!');
        console.log();

        console.log(chalk.green.bold(' Congratulations on successfully '
          + 'installing a fresh instance'));
        console.log('  of the MEAN stack courtesy of `vulgar-cli`!');
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

          utils.updateVulgarJson(path, {

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

function installDependencies(options, done) {

	var name = options.name;

	//** Show the next step after the person has seen the start/help
  //** text so sleep for one second
	setTimeout(function() {

    var border = fs.readFileSync(__dirname + '/../img/border.txt');
    console.log(border.toString());

    console.log('Would you like to install stack dependencies now or '
      + 'perform the installation');
    console.log('manually via `$ npm install`?');
    console.log('');

    var questions = [{
      type: 'input',
      name: 'installNow',
      message: 'Install dependencies now?',
      default: 'N'
    }];

    inquirer.prompt(questions, function(results) {

      if(results.installNow === 'Y' ||
         results.installNow === 'y') {

           console.log('');

           var command = 'cd ' + options.name + '/ && npm install';

           console.log(chalk.green('  Attempting to install local stack '
             + 'dependencies for you automatically.'));
           console.log(chalk.yellow('  If this fails for whatever reason, '
             + 'attempt installation manually via:'));
           console.log('');
           console.log(chalk.yellow('    $ npm install'));
           console.log('');

           console.log(chalk.green(command));

           //** Run the `npm install` command
           shell.exec(command, function(status, output) {

             if(status) {

               console.log(output);
               return done(status);
             }

             console.log();
             done();
           });
         } else {

           console.log('');
           console.log(chalk.yellow('  You have elected for manual dependency '
             + 'installation.'));
           console.log('');
           console.log(chalk.green('  After this installation concludes, run'));
           console.log('');
           console.log(chalk.green('    $ npm install'));
           console.log('');
           console.log(chalk.green('  to install the required dependencies.'));

           done();
         }
    });
	},1000);
}

function nextSteps(options, done) {

	var name = options.name;

	// show the next steps after 1 second.
	setTimeout(function() {

    console.log('');
    console.log('  The next step is to build your front-end code with Webpack');
    console.log('  for the first time with: ');
    console.log('');
    console.log(chalk.green('    $ npm run build'));
    console.log('');
    console.log('  After that it is time to fire up the stack for a test run.');
    console.log('  This is best accomplished using two terminals: one for the');
    console.log('  server and one for the front-end.');
    console.log('');
    console.log('  Fire up the front-end with Webpack and Hot Module');
		console.log('  Reloading via:');
    console.log('');
		console.log(chalk.green('    $ npm start'));
    console.log('');
    console.log('  Start up the `Express` server responsible for our');
		console.log('  back-end via:');
    console.log('');
		console.log(chalk.green('    $ gulp serve'));
    console.log('');

    /*var command = 'yo vulgar:config';
    //** Run the `yo vulgar:config` command
    shell.exec(command, function(status, output) {

      if(status) {

        console.log(output);
        return done(status);
      }

      console.log();
      done();
    });*/

    done();
	},1000);
}

function terminateGracefully(options) {

  console.log(
    chalk.green('Installation complete. ') +
    chalk.red('Process self-destructing...')
  );
  console.log('...');

  process.exit(0);
}
