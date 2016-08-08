'use strict';

const path = require('path');

const assert = require('assertthat'),
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

  test('throws an error if options are missing.', done => {
    assert.that(() => {
      runfork();
    }).is.throwing('Options are missing.');
    done();
  });

  test('throws an error if path is missing.', done => {
    assert.that(() => {
      runfork({});
    }).is.throwing('Path is missing.');
    done();
  });

  test('throws an error if callback is missing.', done => {
    assert.that(() => {
      runfork({ path: sampleApp });
    }).is.throwing('Callback is missing.');
    done();
  });

  test('runs the given script.', done => {
    runfork({ path: sampleApp }, err => {
      assert.that(err).is.null();
      done();
    });
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
      }, err => {
        assert.that(err).is.null();
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
      }, err => {
        assert.that(err).is.null();
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
      }, err => {
        assert.that(err).is.null();
      });
    });

    test('is passed the exit code to onExit.', done => {
      runfork({
        path: sampleApp,
        env: {
          EXIT_CODE: 1
        },
        onExit (exitCode) {
          assert.that(exitCode).is.equalTo(1);
          done();
        }
      }, err => {
        assert.that(err).is.null();
      });
    });

    test('is passed the stdout and stderr streams.', done => {
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
      }, err => {
        assert.that(err).is.null();
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
      }, err => {
        assert.that(err).is.null();
      });
    });
  });

  suite('stop', () => {
    test('stops the script.', done => {
      runfork({
        path: sampleApp,
        env: {
          TIMEOUT: 10 * 1000
        }
      }, (errRunfork, stop) => {
        assert.that(errRunfork).is.null();

        // Wait until the http server is up and running.
        setTimeout(() => {
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
                  done();
                });
            });
        }, 0.5 * 1000);
      });
    });
  });
});
