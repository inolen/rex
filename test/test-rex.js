var assert = require('assert'),
  child_process = require('child_process'),
  rex = require('../lib/rex'),
  sinon = require('sinon'),
  SSHFSClient = require('../lib/sshfsclient'),
  temp = require('temp');

suite('rex', function () {
  var log;

  setup(function() {
    log = console.log;
    console.log = function () {};
  });

  teardown(function() {
    console.log = log;
  });

  suite('relay()', function () {
    test('Return null on successful SSH', sinon.test(function () {
      var stub_execfile = this.stub(child_process, 'execFile').yields(null);

      rex.relay(undefined, 'user@server', 7265, function (err) {
        assert.equal(err, null);
      });

      assert(stub_execfile.calledOnce);
    }));

    test('Return error on unsuccessful SSH', sinon.test(function () {
      var stub_execfile = this.stub(child_process, 'execFile').yields(Error);

      rex.relay(undefined, 'user@server', 7265, function (err) {
        assert.equal(err, Error);
      });

      assert(stub_execfile.calledOnce);
    }));
  });

  suite('execFile()', function () {
    var mountpoint = '/tmp/mountpoint',
      connection_string = 'user@localhost';

    test('Validate async logic flow and exit code', sinon.test(function () {
      var exit_code = 13,
        stub_mkdir = this.stub(temp, 'mkdir').yields(null, mountpoint),
        stub_mount = this.stub(SSHFSClient, 'mount').yields(null),
        stub_unmount = this.stub(SSHFSClient, 'unmount').yields(null),
        stub_fork_on = this.stub(),
        stub_fork_on_message = stub_fork_on.withArgs('message').yields({err: {code: exit_code}}),
        stub_fork = this.stub(child_process, 'fork').returns({
          send: function () {},
          on: stub_fork_on
        });

      rex.execFile(undefined, undefined, undefined, connection_string, function (err, stdout, stderr) {
        assert.equal(err.code, 13);
      });

      assert(stub_mkdir.calledBefore(stub_mount));
      assert(stub_mount.calledWith(connection_string, mountpoint));
      assert(stub_mount.calledAfter(stub_mkdir));
      assert(stub_fork.calledAfter(stub_mount));
      assert(stub_fork_on_message.calledAfter(stub_fork));
      assert(stub_unmount.calledWith(mountpoint));
      assert(stub_unmount.calledAfter(stub_fork_on_message));
    }));

    test('Return error on unsuccessful mkdir', sinon.test(function () {
      var stub_mkdir = this.stub(temp, 'mkdir').yields(Error),
        stub_mount = this.stub(SSHFSClient, 'mount').yields(null),
        stub_unmount = this.stub(SSHFSClient, 'unmount').yields(null);

      rex.execFile(undefined, undefined, undefined, connection_string, function (err, stdout, stderr) {
        assert.equal(err, Error);
      });

      assert(stub_mkdir.calledOnce);
      assert(!stub_mount.called);
      // this shouldn't be called as a valid mountpoint is never created
      assert(!stub_unmount.called);
    }));

    test('Return error on unsuccessful mount', sinon.test(function () {
      var stub_mkdir = this.stub(temp, 'mkdir').yields(null, mountpoint),
        stub_mount = this.stub(SSHFSClient, 'mount').yields(Error),
        stub_unmount = this.stub(SSHFSClient, 'unmount').yields(null);

      rex.execFile(undefined, undefined, undefined, connection_string, function (err, stdout, stderr) {
        assert.equal(err, Error);
      });

      assert(stub_mkdir.calledBefore(stub_mount));
      assert(stub_mount.calledWith(connection_string, mountpoint));
      assert(stub_unmount.calledWith(mountpoint));
      assert(stub_unmount.calledAfter(stub_mount));
    }));

    test('Return error on unsuccessful fork', sinon.test(function () {
      var stub_mkdir = this.stub(temp, 'mkdir').yields(null, mountpoint),
        stub_mount = this.stub(SSHFSClient, 'mount').yields(null),
        stub_unmount = this.stub(SSHFSClient, 'unmount').yields(null),
        stub_fork_on = this.stub(),
        stub_fork_on_error = stub_fork_on.withArgs('error').yields(Error),
        stub_fork = this.stub(child_process, 'fork').returns({
          send: function () {},
          on: stub_fork_on
        });

      rex.execFile(undefined, undefined, undefined, connection_string, function (err, stdout, stderr) {
        assert.equal(err, Error);
      });

      assert(stub_mkdir.calledBefore(stub_mount));
      assert(stub_mount.calledWith(connection_string, mountpoint));
      assert(stub_fork.calledAfter(stub_mount));
      assert(stub_fork_on_error.calledAfter(stub_fork));
      assert(stub_unmount.calledWith(mountpoint));
      assert(stub_unmount.calledAfter(stub_fork_on_error));
    }));
  });
});