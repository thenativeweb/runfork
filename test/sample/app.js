'use strict';

const http = require('http');

const flaschenpost = require('flaschenpost'),
      processenv = require('processenv');

const logger = flaschenpost.getLogger();

const exitCode = processenv('EXIT_CODE') || 0,
      port = processenv('PORT') || 3000,
      timeout = processenv('TIMEOUT') || 0;

const exit = function () {
  if (typeof exitCode !== 'number') {
    throw new Error(exitCode);
  }

  logger.info('Exiting sample application...');

  /* eslint-disable no-process-exit */
  process.exit(exitCode);
  /* eslint-enable no-process-exit */
};

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

if (timeout) {
  setTimeout(exit, timeout);
} else {
  exit();
}
