var child_process = require('child_process'),
  ConnectionInfo = require('./connectioninfo');

/******************************************************************************
 * SSHFS client
 ******************************************************************************/
var SSHFSClient = (function () {
  'use strict';

  var itself = {},
    defaultOptions = ['-o', 'PasswordAuthentication=no',
                      '-o', 'StrictHostKeyChecking=no',
                      '-o', 'UserKnownHostsFile=/dev/null'];

  itself.mount = function (connection_string, mountpoint, callback) {
    var cinfo = new ConnectionInfo(connection_string);
    var mountsource = cinfo.username + '@' + cinfo.hostname + ':/';
    var args = [mountsource, mountpoint].concat(defaultOptions);

    // add port if specified
    if (cinfo.port !== undefined) {
      args = args.concat(['-p', cinfo.port]);
    }

    // add user identity path if running from sudo
    if (process.env.SUDO_USER !== undefined) {
      args = args.concat(['-o', 'IdentityFile=/home/' + process.env.SUDO_USER + '/.ssh/id_rsa']);
    }

    child_process.execFile('sshfs', args, function (err, stdout, stderr) {
      if (err !== null && err.code !== 0) {
        callback(new Error('Failed to mount sshfs from \'' + mountsource + '\' to \'' + mountpoint + '\' (code ' + err.code + ').'));
        return;
      }

      callback(null);
    });
  };

  itself.unmount = function (mountpoint, callback) {
    child_process.execFile('fusermount', ['-u', mountpoint], function (err, stdout, stderr) {
      if (err !== null && err.code !== 0) {
        callback(new Error('Failed to unmount \'' + mountpoint + '\' (code ' + err.code + ').'));
        return;
      }

      callback(null);
    });
  };

  return itself;
}());

module.exports = SSHFSClient;