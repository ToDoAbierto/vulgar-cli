'use strict';

var utils = require('../utils'),
    chalk = require('chalk');

exports.connect = function(env, callback, appName) {

  var packageJsonPath = (appName)
                          ? process.cwd() + '/' + appName + '/package.json'
                          : './package.json';

  utils.loadPackageJson(packageJsonPath, function(err,  data) {

    if(err)
      return callback(err);

    var path = '/config/env/' + env + '.js';

    var config = (appName)
                   ? require(process.cwd() + '/' + appName + path)
                   : require(process.cwd() + path);

    var db = require('mongoose').createConnection(config.db, config.dbOptions);

    db.on('error',
      console.error.bind(
        console,
        chalk.red('Error connecting to database: ')
     ));

    db.once('open', function() {
      console.log(chalk.green('Connection to database successful!'));
      console.log();
      db.options.url = config.db;
      callback(null, db);
    });
  });
};
