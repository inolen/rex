#!/usr/bin/env node

var optimist = require('optimist'),
  rex = require('../lib/rex');

/*
 * Rex is invoked two ways:
 * A. user1@client invokes rex like so:
 *    rex --proc_host=user2@server --command=somelongtask
 * B. The above command opens an SSH session for user2@server and runs:
 *    rex --file_host=user1@client --command=somelongtask
 */
var main = function () {
  'use strict';
  var opts = optimist(process.argv)
    .usage('Execute a command on a remote host, using the local filesystem.\nUsage: $0')
    // Don't describe this as the end-user should never specify it.
    //.describe('file_host', 'Remote host to mount file system from')
    .describe('proc_host', 'Remote host to offload process execution to')
    .describe('port', 'Port to open reverse tunnel on').default('port', 7265)
    .describe('command', 'Command to execute').argv;

  if (opts.proc_host !== undefined && opts.file_host !== undefined) {
    console.error('Process host and file host options are mutually exclusive.');
  } else if (opts.proc_host !== undefined && opts.command !== undefined) {
    rex.relay(opts.command, opts.proc_host, opts.port, function (err) {
      process.exit(err !== null ? 0 : 1);
    });
  } else if (opts.file_host !== undefined && opts.command !== undefined) {
    rex.exec(opts.command, {}, opts.file_host, function (err, stdout, stderr) {
      if (stdout) {
        console.log(stdout);
      }
      if (stderr) {
        console.error(stderr);
      }
      process.exit(err !== null ? err.code : 1);
    });
  } else {
    opts.showHelp();
  }
};

// Don't call main if we're being require()d.
if (module.parent === null) {
  main();
}

module.exports = main;