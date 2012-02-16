var assert = require('assert'),
  ConnectionInfo = require('../lib/connectioninfo');

suite('ConnectionInfo', function () {
  test('Validate good connection string', function () {
    var cinfo = new ConnectionInfo('foo@bar:22');
    assert.equal(cinfo.username, 'foo');
    assert.equal(cinfo.hostname, 'bar');
    assert.equal(cinfo.port, 22);
  });

  test('Missing username should throw exception', function () {
    assert.throws(
      function() {
        var cinfo = new ConnectionInfo('bar:foobar');
      },
      Error
    );
  });

  test('Missing hostname should throw exception', function () {
    assert.throws(
      function() {
        var cinfo = new ConnectionInfo('foo@:foobar');
      },
      Error
    );
  });

  test('Empty string should throw exception', function () {
    assert.throws(
      function() {
        var cinfo = new ConnectionInfo('');
      },
      Error
    );
  });

  test('Invalid port should throw exception', function () {
    assert.throws(
      function() {
        var cinfo = new ConnectionInfo('foo@bar:foobar');
      },
      Error
    );
  });

  test('No port should be undefined', function () {
    var cinfo = new ConnectionInfo('foo@bar');
    assert.equal(cinfo.username, 'foo');
    assert.equal(cinfo.hostname, 'bar');
    assert.equal(cinfo.port, undefined);
  });
});