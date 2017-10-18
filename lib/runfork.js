'use strict';

const process = require('process');

const fork = require('child_process').fork;

const async = require('async'),
      toString = require('stream-to-string');

const runfork = function (options, callback) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.path) {
    throw new Error('Path is missing.');
  }
  if (!callback) {
    throw new Error('Callback is missing.');
  }

  options.args = options.args || [];
  options.env = options.env || {};
  options.onMessage = options.onMessage || function () {
    // Intentionally left blank.
  };
  options.onExit = options.onExit || function () {
    // Intentionally left blank.
  };

  let subProcess;

  const cleanUpAndExit = function () {
    subProcess.kill('SIGINT');
  };

  const stop = async function () {
    process.removeListener('SIGINT', cleanUpAndExit);
    process.removeListener('SIGTERM', cleanUpAndExit);
    process.removeListener('exit', cleanUpAndExit);

    let retries = 10;
    let killed = false;

    await new Promise(resolve => {
      async.doUntil(done => {
        try {
          process.kill(subProcess.pid, 'SIGINT');
        } catch (err) {
          killed = true;
        }
        setTimeout(() => {
          done();
        }, 10);
      }, () => {
        if (killed) {
          return true;
        }

        retries -= 1;

        return retries === 0;
      }, err => {
        if (err) {
          throw err;
        }

        if (!subProcess.killed) {
          subProcess.kill('SIGKILL');
        }

        resolve();
      });
    });
  };

  process.on('SIGINT', cleanUpAndExit);
  process.on('SIGTERM', cleanUpAndExit);
  process.on('exit', cleanUpAndExit);

  subProcess = fork(options.path, options.args, {
    env: options.env,
    silent: true
  });

  subProcess.on('message', message => {
    options.onMessage(message);
  });

  subProcess.once('exit', () => {
    async.parallel({
      stdout (done) {
        if (!subProcess.stdout.readable) {
          return done(null, '');
        }
        toString(subProcess.stdout, done);
      },
      stderr (done) {
        if (!subProcess.stderr.readable) {
          return done(null, '');
        }
        toString(subProcess.stderr, done);
      }
    }, (err, results) => {
      if (err) {
        throw err;
      }

      options.onExit(subProcess.exitCode, results.stdout, results.stderr);
    });
  });

  callback(null, stop);
};

module.exports = runfork;
