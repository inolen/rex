var assert = require('assert'),
  child_process = require('child_process'),
  sinon = require('sinon'),
  SSHFSClient = require('../lib/sshfsclient');

suite('SSHFSClient', function () {
  var connection_string;

  suiteSetup(function () {
    connection_string = 'user1@localhost';
  });

  suite('mount()', function () {
    test('Validate port argument (no port specified)', sinon.test(function () {
      var stub_execfile = this.stub(child_process, 'execFile');

      SSHFSClient.mount(connection_string, undefined, undefined);

      assert(stub_execfile.calledOnce);
      assert.notEqual(stub_execfile.getCall(0).args[1][8], '-p');
    }));

    test('Validate port argument (port specified)', sinon.test(function () {
      var port = 5000,
        connection_string_with_port = 'user1@localhost:' + port;

      var stub_execfile = this.stub(child_process, 'execFile');

      SSHFSClient.mount(connection_string_with_port, undefined, undefined);

      assert(stub_execfile.calledOnce);
      assert.equal(stub_execfile.getCall(0).args[1][8], '-p');
      assert.equal(stub_execfile.getCall(0).args[1][9], port);
    }));

    test('Specify IdentityFile if running as sudo', sinon.test(function () {
      var stub_execfile = this.stub(child_process, 'execFile');

      process.env.SUDO_USER = 'originaluser';

      SSHFSClient.mount(connection_string, undefined, undefined);

      assert(stub_execfile.calledOnce);
      assert.equal(stub_execfile.getCall(0).args[1][8], '-o');
      assert.equal(stub_execfile.getCall(0).args[1][9], 'IdentityFile=/home/' + process.env.SUDO_USER + '/.ssh/id_rsa');
    }));

    test('Return null on success', sinon.test(function () {
      var stub_execfile = this.stub(child_process, 'execFile').yields(null);

      SSHFSClient.mount(connection_string, undefined, function (err, stdout, stderr) {
        assert.equal(err, null);
      });

      assert(stub_execfile.calledOnce);
    }));

    test('Return error if problem on mount', sinon.test(function () {
      var stub_execfile = this.stub(child_process, 'execFile').yields(Error);

      SSHFSClient.mount(connection_string, undefined, function (err, stdout, stderr) {
        assert.notEqual(err, null);
      });

      assert(stub_execfile.calledOnce);
    }));
  });

  suite('unmount()', function () {
    test('Return null on success', sinon.test(function () {
      var stub_execfile = this.stub(child_process, 'execFile').yields(null);

      SSHFSClient.unmount(undefined, function (err, stdout, stderr) {
        assert.equal(err, null);
      });

      assert(stub_execfile.calledOnce);
    }));

    test('Return error if problem on mount', sinon.test(function () {
      var stub_execfile = this.stub(child_process, 'execFile').yields(Error);

      SSHFSClient.unmount(undefined, function (err, stdout, stderr) {
        assert.notEqual(err, null);
      });

      assert(stub_execfile.calledOnce);
    }));
  });
});