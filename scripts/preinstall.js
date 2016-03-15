'use strict';

var args = process.argv;

if(process.env_config_argv) {
  try {
    args = JSON.parse(process.env.npm_config_argv).cooked;
  } catch (e) {

  }
}

if(~args.indexOf('vulgar') && ~args.indexOf('--global')) {

  console.log('Please install \'vulgar-cli\' globally instead '
    + 'of \'vulgario\' as: ');
  console.log('');
  console.log('$ npm install -g vulgar-cli');
  console.log('');
  process.exit(1);
} else if (~args.indexOf('vulgar-cli')) {

  var spawn = require('child_process').spawn,
        npm = process.platform === 'win32' ? 'npm.cmd' : 'npm',
      npmls = spawn(npm, ['ls', '--global', '--json', '--depth', '0']);

  var data = {};

  npmls.stdout.on('data', function(d) {

    data = d;
  });

  npmls.on('close', function() {

    try {
      data = JSON.parse(data);
    } catch (e) {

    }

    if(data && data.dependencies && data.dependencies.vulgario) {

      console.log('Please run \'npm uninstall -g vulgario\' prior to '
        + 'installing vulgar-cli');
      console.log('');
      process.exit(1);
    }
  });
}
