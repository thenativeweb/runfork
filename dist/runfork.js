'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

require('babel-polyfill');

var process = require('process');

var _require = require('child_process'),
    fork = _require.fork;

var retry = require('async-retry'),
    toString = require('stream-to-string');

var runfork = function runfork(_ref) {
  var _this = this;

  var path = _ref.path,
      _ref$args = _ref.args,
      args = _ref$args === undefined ? [] : _ref$args,
      _ref$env = _ref.env,
      env = _ref$env === undefined ? {} : _ref$env,
      _ref$onMessage = _ref.onMessage,
      onMessage = _ref$onMessage === undefined ? function () {
    // Intentionally left blank.
  } : _ref$onMessage,
      _ref$onExit = _ref.onExit,
      onExit = _ref$onExit === undefined ? function () {
    // Intentionally left blank.
  } : _ref$onExit;

  if (!path) {
    throw new Error('Path is missing.');
  }

  var subProcess = void 0;

  var cleanUpAndExit = function cleanUpAndExit() {
    subProcess.kill('SIGINT');
  };

  process.on('SIGINT', cleanUpAndExit);
  process.on('SIGTERM', cleanUpAndExit);
  process.on('exit', cleanUpAndExit);

  subProcess = fork(path, args, { env: env, silent: true });

  subProcess.on('message', function (message) {
    onMessage(message);
  });

  subProcess.once('exit', _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
    var stderr, stdout;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            stderr = '', stdout = '';

            if (!subProcess.stdout.readable) {
              _context.next = 5;
              break;
            }

            _context.next = 4;
            return toString(subProcess.stdout);

          case 4:
            stdout = _context.sent;

          case 5:
            if (!subProcess.stderr.readable) {
              _context.next = 9;
              break;
            }

            _context.next = 8;
            return toString(subProcess.stderr);

          case 8:
            stderr = _context.sent;

          case 9:

            onExit(subProcess.exitCode, stdout, stderr);

          case 10:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, _this);
  })));

  var stop = function () {
    var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
      var _this2 = this;

      return regeneratorRuntime.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              process.removeListener('SIGINT', cleanUpAndExit);
              process.removeListener('SIGTERM', cleanUpAndExit);
              process.removeListener('exit', cleanUpAndExit);

              _context3.prev = 3;
              _context3.next = 6;
              return retry(_asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
                return regeneratorRuntime.wrap(function _callee2$(_context2) {
                  while (1) {
                    switch (_context2.prev = _context2.next) {
                      case 0:
                        _context2.prev = 0;

                        process.kill(subProcess.pid, 'SIGINT');
                        _context2.next = 7;
                        break;

                      case 4:
                        _context2.prev = 4;
                        _context2.t0 = _context2['catch'](0);
                        return _context2.abrupt('return');

                      case 7:
                        throw new Error('Process maybe is still running...');

                      case 8:
                      case 'end':
                        return _context2.stop();
                    }
                  }
                }, _callee2, _this2, [[0, 4]]);
              })), {
                retries: 10,
                minTimeout: 10,
                maxTimeout: 10,
                factor: 1
              });

            case 6:
              _context3.next = 11;
              break;

            case 8:
              _context3.prev = 8;
              _context3.t0 = _context3['catch'](3);

              // If the process could not be stopped gracefully, force it to shut down
              // immediately.
              subProcess.kill('SIGKILL');

            case 11:
            case 'end':
              return _context3.stop();
          }
        }
      }, _callee3, this, [[3, 8]]);
    }));

    return function stop() {
      return _ref3.apply(this, arguments);
    };
  }();

  return stop;
};

module.exports = runfork;