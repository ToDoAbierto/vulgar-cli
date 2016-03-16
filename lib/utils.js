'use strict';

var fs = require('fs'),
 shell = require('shelljs'),
 chalk = require('chalk');

var isWin = (process.platform === 'win32');

exports.isWin = isWin;

exports.Progress = function() {

  var interval,
      counter;

  function printMessage() {

    switch(counter) {

      case 0:
        console.log('Use `vulgar --help` from command line for all CLI '
          +  'options');
        break;

      case 1:
        console.log('Be sure to checkout out all of the docs on the Github '
          +  'repo');
        break;

      case 2:
        console.log('This installation may take a little while depending '
          +  'on your connection speed');
        break;

      case 15:
        console.log('Seems a bit laggy to me. Check your internet connection');
        break;

      default:
        console.log('Still cloning source repository. Please stand by... ');
        break;
    }
    counter++;
  }

  return {
    start: function() {
      counter = 0;
      interval = setInterval(printMessage, 3000);
    },
    stop: function() {
      clearInterval(interval);
    }
  };
};

exports.loadPackageJson = function(path, callback) {
  fs.readFile(path, function(err, data) {

    if(err)
      return callback(err);

    try {

      var pack = JSON.parse(data.toString());
      pack.meanVersion = pack.mean || pack.version;
      callback(null, pack);
    } catch (err) {
      return callback(err);
    }
  });
};

exports.checkNpmPermission = function (callback) {

  // DEBUG
  console.log('checkNpmPermission entered');

  var homeDir = process.env[isWin ? 'USERPROFILE' : 'HOME'];
  var findCmd = 'find ' + homeDir + './npm' + '-user root';
  shell.exec(findCmd, function( status, output){
    var hasRootFiles = output.split(/\r\n|\r|\n/).length;
    if (hasRootFiles > 1){
      console.log (chalk.red('There are ' + hasRootFiles + ' files in your ~/.npm owned by root'));
      console.log(chalk.green('Please change the permissions by running -'), 'chown -R `whoami` ~/.npm ');
	    return callback('Root permissions in ~/.npm');
    }
  });

  callback();
}

var meanJsonPath = exports.meanJsonPath = function() {

  // DEBUG
  console.log('entered meanJsonPath ');

  // DEBUG
  console.log('process.platform: ');
  console.log(process.platform);

  // DEBUG
  console.log('setting file: ');
  var file = (process.platform === 'win32') ? '_vulgar' : '.vulgar';
  // DEBUG
  console.log(file);
  var path = getUserHome() + '/' + file;
  // DEBUG
  console.log('path: ');
  console.log(path);
  return path;
}

var readToken = exports.readToken = function() {

  // DEBUG
  console.log('readToken entered');

  var token;

  var path = meanJsonPath();

  // DEBUG
  console.log('path: ');
  console.log(path);

  if(!shell.test('-e', path))
    return null;

  var data = fs.readFileSync(path);
  // DEBUG
  console.log('data:');
  console.log(data);

  try {
    // DEBUG
    console.log('try block entered');

    // DEBUG
    console.log('try to set json: ');
    console.log('JSON.parse(data.toString()):');
    console.log(JSON.parse(data.toString()));
    var json = JSON.parse(data.toString());
    token = json.token;
    // DEBUG
    console.log('token: ');
    console.log(token);
  } catch (err) {
    // DEBUG
    console.log('catch block entered');
    console.log('err: ');
    console.log(err);
    // DEBUG
    console.log('path:');
    console.log(path);
    console.log('try to set token: ');
    console.log('shell.cat(path):');
    console.log(shell.cat(path));
    token = shell.cat(path);
    // DEBUG
    console.log('token: ');
    console.log(token);
    token = token.replace(/(\r\n|\n|\r)/gm,'');
    // DEBUG
    console.log('token: ');
    console.log(token);
  }

  return token;
};

exports.readMeanSync = function(param) {

  var value;

  var path = meanJsonPath();

  if(!shell.test('-e', path))
    return null;

  var data = fs.readFileSync(path);

  try {
    var json = JSON.parse(data.toString());
    value = json[param];
  } catch(err) {
    value = null;
  }

  return value;
};

function getUserHome() {
  return process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
}

exports.updateGlobalMeanJson = function(values, callback) {

  // DEBUG
  console.log('updateGlobalMeanJson entered: ');

  var path = meanJsonPath();

  // DEBUG
  console.log('path set: ');
  console.log(path);

  fs.lstat(path, function(err, stat) {

    if(err || !stat) {

      // DEBUG
      console.log('err or !stat: ');
      console.log(err);
      console.log(stat);

      writeMeanJson(path, values, function() {

        callback();
      });
    } else {

      fs.readFile(path, function(err, file) {

        // DEBUG
        console.log('fs.readFile: ');
        console.log(file);

        if(err) {
          // DEBUG
          console.log('err: ');
          console.log(err);
          return callback(err);
        }

        try {

          // DEBUG
          console.log('enter try');

          // DEBUG
          console.log('try to set json: ');
          console.log('JSON.parse(file.toString()):');
          console.log(JSON.parse(file.toString()));
          var json = JSON.parse(file.toString());
          // DEBUG
          console.log(json);

          // DEBUG
          if (!json)
            console.log('json not set!')

          for(var index in values) {
            // DEBUG
            consol.log(index);
            console.log(json);
            console.log(json[index]);
            console.log(values[index]);
            json[index] = values[index];
          }

          // DEBUG
          console.log(err);
          writeMeanJson(path, json, function(err) {

            // DEBUG
            console.log(err);
            callback(err);
          });
        } catch(err) {

          // DEBUG
          console.log('catch block entered. error:');
          console.log(err);

          var data = {};
          // DEBUG
          console.log('data set: ');
          console.log(data);
          data = values;
          data.token = readToken();

          // DEBUG
          console.log('data token: ');
          console.log(data.token);

          writeMeanJson(path, data, function(err) {
            callback(err);
          });
        }
      });
    }
  });
};

function writeMeanJson(path, data, callback) {

  fs.writeFile(path, JSON.stringify(data, null, 4), function(err) {

    callback(err);
  });
}

exports.updateMeanJson = function(path, values, callback) {

  // DEBUG
  console.log('updateMeanJson entered ');
  console.log('received: ');
  console.log('path: ');
  console.log(path);
  console.log('values: ');
  console.log(values);

  fs.readFile(path, function(err, file) {

    // DEBUG
    console.log('fs.readFile: ');
    console.log(file);

    if (err) {
      // DEBUG
      console.log('err: ');
      console.log(err);
      return callback(err);
    }

    // DEBUG
    console.log('JSON.parse(file.toString()):');
    console.log(JSON.parse(file.toString()));

    var json = JSON.parse(file.toString());

    // DEBUG
    console.log('json set: ');
    console.log(json);

    // DEBUG
    if (!json)
      console.log('json not set!')

    for(var index in values) {
      // DEBUG
      console.log(index);
      console.log(json);
      console.log(json[index]);
      console.log(values[index]);
      json[index] = values[index];
    }

    writeMeanJson(path, json, function(err) {
      callback(err);
    });
  });
}
