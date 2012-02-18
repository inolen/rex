/*
 * Rex v1.0.0
 *
 * Rex is a command line utility to remotely execute commands
 * that are virtualized inside the local machine's file system.
 */

var async = require('async'),
  child_process = require('child_process'),
  ConnectionInfo = require('./connectioninfo'),
  fs = require('fs'),
  librex = require('../build/Release/librex'),
  SSHFSClient = require('./sshfsclient'),
  temp = require('temp');

/******************************************************************************
 * Rex API
 ******************************************************************************/
var rex = (function () {
  'use strict';
  var api = {};

  /*
   * Relay this command to the remote machine, along with info
   * about the localhost for them to connect back to via sshfs.
   */
  api.relay = function (command, proc_connection_string, tunnel_port, callback) {
    var fs_connection_string = process.env.USERNAME + '@localhost:' + tunnel_port;
    var file_cinfo = new ConnectionInfo(fs_connection_string);
    var proc_cinfo = new ConnectionInfo(proc_connection_string);
    var file = 'ssh';
    var args = [
      '-R', file_cinfo.port + ':' + file_cinfo.hostname + ':22',
      '-o', 'PasswordAuthentication=no',
      '-o', 'StrictHostKeyChecking=no',
      '-o', 'UserKnownHostsFile=/dev/null',
      proc_cinfo.username + '@' + proc_cinfo.hostname,
      'sudo rex "--file_host=' + fs_connection_string + '" "--command=' + command + '"'
    ];

    console.log('Forwarding "%s" to "%s" via SSH', command, proc_connection_string);

    child_process.execFile(file, args, undefined, function (err, stdout, stderr) {
      if (stdout) {
        console.log(stdout);
      }
      if (stderr) {
        console.error(stderr);
      }
      callback(err);
    });
  };

  /*
   * Execute a relayed command on the local machine, mounting the
   * remote file system from the machine that sent this to us.
   */
  api.execFile = function (file, args, options, fs_connection_string, callback) {
    var cinfo = new ConnectionInfo(fs_connection_string);
    var mountpoint;

    console.log('Executing "%s %s" using "%s" as the file system root', file, args ? args.join(' ') : '', fs_connection_string);

    async.series([
      // create mountpoint directory (the temp module will remove this upon exit)
      function (next) {
        temp.mkdir(cinfo.username, function (err, dirPath) {
          if (err !== null) {
            return next(err);
          }
          mountpoint = dirPath;
          next(null);
        });
      },
      // mount filesystem to mountpoint
      function (next) {
        SSHFSClient.mount(fs_connection_string, mountpoint, function (err) {
          if (err !== null) {
            return next(err);
          }

          next(null);
        });
      },
      // fork and spawn process so it can chroot safely
      function (next) {
        var child = child_process.fork(__filename);

        child.send({file: file, args: args, options: options, mountpoint: mountpoint});

        child.on('message', function (exit_message) {
          next(exit_message.err, {stdout: exit_message.stdout, stderr: exit_message.stderr});
        });

        child.on('error', function (err) {
          next(err);
        });
      }],
      function (err, results) {
        if (mountpoint !== undefined) {
          SSHFSClient.unmount(mountpoint, function () {
            callback(err !== undefined ? err : null,
                results[2] !== undefined ? results[2].stdout : undefined,
                results[2] !== undefined ? results[2].stderr : undefined);
          });
        } else {
          callback(err !== undefined ? err : null);
        }
      });
  };

  api.exec = function (command, options, fs_connection_string, callback) {
    api.execFile(command, undefined, options, fs_connection_string, callback);
  };

  return api;
}());

/******************************************************************************
 * This is a continuation of the Rex API, used for forking processes before
 * chroot'ing so we can clean up.
 ******************************************************************************/
var rexfork = function () {
  'use strict';
  var exec = function (file, args, options, mountpoint) {
    // chroot to new mounted filesystem
    librex.chroot(mountpoint);

    // run command
    if (args === undefined) {
      child_process.exec(file, options, function (err, stdout, stderr) {
        process.send({
          err: err,
          stdout: stdout,
          stderr: stderr
        });
        process.exit();
      });
    } else {
      child_process.execFile(file, args, options, function (err, stdout, stderr) {
        process.send({
          err: err,
          stdout: stdout,
          stderr: stderr
        });
        process.exit();
      });
    }
  };

  process.on('message', function (m) {
    exec(m.file, m.args, m.options, m.mountpoint);
  });
};

// If module.parent is null, then we're being executed directly (e.g. by the above fork()), not required
if (module.parent === null) {
  rexfork();
}

// Export the main API.
module.exports = rex;