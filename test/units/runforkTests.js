'use strict';

const path = require('path');

const assert = require('assertthat'),
      knock = require('knockat'),
      measureTime = require('measure-time'),
      request = require('superagent');

const runfork = require('../../lib/runfork');

const sampleApp = path.join(__dirname, '..', 'sample', 'app.js');

suite('runfork', () => {
  teardown(done => {
    // Delay each test so that the operating system has enough time to clear
    // any ports being used.
    setTimeout(done, 0.5 * 1000);
  });

  test('is a function.', done => {
    assert.that(runfork).is.ofType('function');
    done();
  });

  test('throws an error if path is missing.', done => {
    assert.that(() => {
      runfork({});
    }).is.throwing('Path is missing.');
    done();
  });

  test('runs the given script.', done => {
    runfork({ path: sampleApp });

    done();
  });

  suite('onMessage', () => {
    test('gets called when the script sends a message.', done => {
      let wasOnMessageCalled = false;

      runfork({
        path: sampleApp,
        env: {
          TIMEOUT: 1.5 * 1000
        },
        onMessage (message) {
          wasOnMessageCalled = true;
          assert.that(message).is.equalTo({ ping: 'pong' });
        },
        onExit () {
          assert.that(wasOnMessageCalled).is.true();
          done();
        }
      });
    });
  });

  suite('onExit', () => {
    test('gets called once the script ends.', done => {
      runfork({
        path: sampleApp,
        onExit () {
          done();
        }
      });
    });

    test('gets called even when the scripts fails ungracefully.', done => {
      runfork({
        path: sampleApp,
        env: {
          EXIT_CODE: 'foobar'
        },
        onExit (exitCode) {
          assert.that(exitCode).is.equalTo(1);
          done();
        }
      });
    });

    test('passes the exit code to onExit.', done => {
      runfork({
        path: sampleApp,
        env: {
          EXIT_CODE: 1
        },
        onExit (exitCode) {
          assert.that(exitCode).is.equalTo(1);
          done();
        }
      });
    });

    test('passes the stdout and stderr streams.', done => {
      runfork({
        path: sampleApp,
        env: {
          TIMEOUT: 1.5 * 1000
        },
        onExit (exitCode, stdout, stderr) {
          assert.that(stdout).is.matching(/Sample application started/m);
          assert.that(stderr).is.equalTo('');
          done();
        }
      });
    });
  });

  suite('environment variables', () => {
    test('passes environment variables to the script.', done => {
      const getElapsed = measureTime();

      runfork({
        path: sampleApp,
        env: {
          TIMEOUT: 1 * 1000
        },
        onExit () {
          const elapsed = getElapsed();

          assert.that(elapsed.seconds).is.equalTo(1);
          done();
        }
      });
    });
  });

  suite('arguments', () => {
    test('passes arguments to the script.', done => {
      runfork({
        path: sampleApp,
        args: [ '--type', 'test' ],
        onExit (exitCode, stdout) {
          assert.that(stdout).is.matching(/"Process arguments[^"]*,--type,test"/);
          done();
        }
      });
    });
  });

  suite('stop', function () {
    this.timeout(4000);

    test('stops the script.', async () => {
      const stop = runfork({
        path: sampleApp,
        env: {
          TIMEOUT: 10 * 1000
        }
      });

      // Wait until the http server is up and running.
      await knock.at('localhost', 3000);

      await new Promise(resolve => {
        request.
          get('http://localhost:3000/').
          end((errRequest, res) => {
            assert.that(errRequest).is.null();
            assert.that(res.statusCode).is.equalTo(200);

            stop();

            request.
              get('http://localhost:3000/').
              end(err => {
                assert.that(err).is.not.null();
                resolve();
              });
          });
      });
    });

    test('stops the script, even if the shutdown takes longer.', async () => {
      const stop = runfork({
        path: sampleApp,
        env: {
          TIMEOUT: 10 * 1000,
          SHUTDOWN_TIMEOUT: 500
        }
      });

      // Wait until the http server is up and running.
      await knock.at('localhost', 3000);

      await new Promise(resolve => {
        request.
          get('http://localhost:3000/').
          end(async (errRequest, res) => {
            assert.that(errRequest).is.null();
            assert.that(res.statusCode).is.equalTo(200);

            await stop();

            request.
              get('http://localhost:3000/').
              end(err => {
                assert.that(err).is.not.null();
                resolve();
              });
          });
      });
    });
  });
});
