var assert = require('assert'),
  main = require('../bin/main'),
  rex = require('../lib/rex'),
  sinon = require('sinon');

suite('main', function () {
  var oldargv;

  suiteSetup(function () {
    oldargv = process.argv;
  });

  suiteTeardown(function () {
    process.argv = oldargv;
  });

  test('Proccess exits with 0 on relay fail', sinon.test(function () {
    var stub_relay = this.stub(rex, 'relay').yields(Error),
      stub_exit = this.stub(process, 'exit', function () {});

    process.argv = ['', '', '--remote_host=user@server', '--command=ls -l /'];

    main();

    assert(stub_relay.calledOnce);
    assert(stub_exit.calledWith(0));
  }));

  test('Proccess exits with 1 on relay success', sinon.test(function () {
    var stub_relay = this.stub(rex, 'relay').yields(null),
      stub_exit = this.stub(process, 'exit');

    process.argv = ['', '', '--remote_host=user@server', '--command=ls -l /'];

    main();

    assert(stub_relay.calledOnce);
    assert(stub_exit.calledWith(1));
  }));

  test('Proccess exits with the returned exit code on exec fail', sinon.test(function () {
    var exit_code = 13,
      stub_execfile = this.stub(rex, 'execFile').yields({code: exit_code}),
      stub_exit = this.stub(process, 'exit');

    process.argv = ['', '', '--file_host=user@client', '--command=ls -l /'];

    main();

    assert(stub_execfile.calledOnce);
    assert(stub_exit.calledWith(exit_code));
  }));

  test('Proccess exits with 1 on exec success', sinon.test(function () {
    var stub_execfile = this.stub(rex, 'execFile').yields(null),
    stub_exit = this.stub(process, 'exit');

    process.argv = ['', '', '--file_host=user@client', '--command=ls -l /'];

    main();

    assert(stub_execfile.calledOnce);
    assert(stub_exit.calledWith(1));
  }));
});