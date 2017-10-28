'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var process = require('process');

var fork = require('child_process').fork;

var async = require('async'),
    toString = require('stream-to-string');

var runfork = function runfork(options) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.path) {
    throw new Error('Path is missing.');
  }

  options.args = options.args || [];
  options.env = options.env || {};
  options.onMessage = options.onMessage || function () {
    // Intentionally left blank.
  };
  options.onExit = options.onExit || function () {
    // Intentionally left blank.
  };

  var subProcess = void 0;

  var cleanUpAndExit = function cleanUpAndExit() {
    subProcess.kill('SIGINT');
  };

  var stop = function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
      var retries, killed;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              process.removeListener('SIGINT', cleanUpAndExit);
              process.removeListener('SIGTERM', cleanUpAndExit);
              process.removeListener('exit', cleanUpAndExit);

              retries = 10;
              killed = false;
              _context.next = 7;
              return new Promise(function (resolve) {
                async.doUntil(function (done) {
                  try {
                    process.kill(subProcess.pid, 'SIGINT');
                  } catch (err) {
                    killed = true;
                  }
                  setTimeout(function () {
                    done();
                  }, 10);
                }, function () {
                  if (killed) {
                    return true;
                  }

                  retries -= 1;

                  return retries === 0;
                }, function (err) {
                  if (err) {
                    throw err;
                  }

                  if (!subProcess.killed) {
                    subProcess.kill('SIGKILL');
                  }

                  resolve();
                });
              });

            case 7:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    return function stop() {
      return _ref.apply(this, arguments);
    };
  }();

  process.on('SIGINT', cleanUpAndExit);
  process.on('SIGTERM', cleanUpAndExit);
  process.on('exit', cleanUpAndExit);

  subProcess = fork(options.path, options.args, {
    env: options.env,
    silent: true
  });

  subProcess.on('message', function (message) {
    options.onMessage(message);
  });

  subProcess.once('exit', function () {
    async.parallel({
      stdout: function stdout(done) {
        if (!subProcess.stdout.readable) {
          return done(null, '');
        }
        toString(subProcess.stdout, done);
      },
      stderr: function stderr(done) {
        if (!subProcess.stderr.readable) {
          return done(null, '');
        }
        toString(subProcess.stderr, done);
      }
    }, function (err, results) {
      if (err) {
        throw err;
      }

      options.onExit(subProcess.exitCode, results.stdout, results.stderr);
    });
  });

  return stop;
};

module.exports = runfork;