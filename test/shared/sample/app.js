'use strict';

// This file is in JavaScript so that it can be run directly by runfork in the
// tests.

const http = require('http');

const { flaschenpost } = require('flaschenpost'),
      { processenv } = require('processenv');

const logger = flaschenpost.getLogger();

const exitCode = processenv('EXIT_CODE') || 0,
      port = processenv('PORT') || 3000,
      sigintTimeout = processenv('SIGINT_TIMEOUT') || 0,
      timeout = processenv('TIMEOUT') || 0;

const exit = function () {
  if (typeof exitCode !== 'number') {
    throw new Error(exitCode);
  }

  logger.info('Exiting sample application...');

  /* eslint-disable unicorn/no-process-exit */
  process.exit(exitCode);
  /* eslint-enable unicorn/no-process-exit */
};

process.on('SIGINT', () => {
  setTimeout(exit, sigintTimeout);
});

setInterval(() => {
  process.send({ ping: 'pong' });
}, 1 * 1000);

http.createServer((req, res) => {
  res.write('ok');
  res.end();
}).listen(port, () => {
  logger.info('Server listening...', { port });
});

logger.info('Sample application started.');

if (process.argv.length > 1) {
  logger.info(`Process arguments: ${process.argv.join(',')}`);
}

if (timeout) {
  setTimeout(exit, timeout);
} else {
  exit();
}
