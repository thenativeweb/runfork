'use strict';

const process = require('process');

const { fork } = require('child_process');

const retry = require('async-retry'),
      toString = require('stream-to-string');

const runfork = function ({
  path,
  args = [],
  env = {},
  onMessage = () => {
    // Intentionally left blank.
  },
  onExit = () => {
    // Intentionally left blank.
  },
  silent = true
}) {
  if (!path) {
    throw new Error('Path is missing.');
  }

  let subProcess;

  const cleanUpAndExit = function () {
    subProcess.kill('SIGINT');
  };

  process.on('SIGINT', cleanUpAndExit);
  process.on('SIGTERM', cleanUpAndExit);
  process.on('exit', cleanUpAndExit);

  subProcess = fork(path, args, { env, silent });

  subProcess.on('message', message => {
    onMessage(message);
  });

  subProcess.once('exit', async () => {
    let stderr = '',
        stdout = '';

    if (subProcess.stdout && subProcess.stdout.readable) {
      stdout = await toString(subProcess.stdout);
    }
    if (subProcess.stderr && subProcess.stderr.readable) {
      stderr = await toString(subProcess.stderr);
    }

    onExit(subProcess.exitCode, stdout, stderr);
  });

  const stop = async function () {
    process.removeListener('SIGINT', cleanUpAndExit);
    process.removeListener('SIGTERM', cleanUpAndExit);
    process.removeListener('exit', cleanUpAndExit);

    try {
      await retry(async () => {
        try {
          process.kill(subProcess.pid, 'SIGINT');
        } catch (ex) {
          // process.kill throws an exception if the PID could not be found.
          // So, this means that the process has gone, so we are fine.
          return;
        }

        // If the process is still there, we need to retry things.
        throw new Error('Process maybe is still running...');
      }, {
        retries: 10,
        minTimeout: 10,
        maxTimeout: 10,
        factor: 1
      });
    } catch (ex) {
      // If the process could not be stopped gracefully, force it to shut down
      // immediately.
      subProcess.kill('SIGKILL');
    }
  };

  return stop;
};

module.exports = runfork;
