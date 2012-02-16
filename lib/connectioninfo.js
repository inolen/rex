/******************************************************************************
 * Small connection string helper class
 ******************************************************************************/
var ConnectionInfo = function (connection_string) {
  'use strict';
  var match = connection_string.match(/^([A-Za-z][A-Za-z0-9_]*)@([A-Za-z][A-Za-z0-9_\-.]*)(?:\:([0-9]*))?$/);

  if (match === null || match[1] === undefined || match[2] === undefined) {
    throw new Error('"' + connection_string + '" is not a valid connection string.');
  }

  this.username = match[1];
  this.hostname = match[2];
  this.port = match[3] !== undefined ? parseInt(match[3], 10) : undefined;

  if (this.port !== undefined && isNaN(this.port)) {
    throw new Error('"' + match[3] + '" is not a valid port.');
  }
};

module.exports = ConnectionInfo;