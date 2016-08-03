'use strict';

const fork = require('child_process').fork;

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

  options.env = options.env || {};
  options.onExit = options.onExit || function () {
    // Intentionally left blank.
  };

  let subProcess;

  const cleanUpAndExit = function () {
    subProcess.kill('SIGINT');
  };

  const stop = function () {
    process.removeListener('SIGINT', cleanUpAndExit);
    process.removeListener('SIGTERM', cleanUpAndExit);

    subProcess.kill('SIGINT');
  };

  process.on('SIGINT', cleanUpAndExit);
  process.on('SIGTERM', cleanUpAndExit);

  subProcess = fork(options.path, {
    env: options.env
  });

  subProcess.once('exit', () => {
    options.onExit(subProcess.exitCode);
  });

  callback(null, stop);
};

module.exports = runfork;
