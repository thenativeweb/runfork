import { assert } from 'assertthat';
import { knock } from 'knockat';
import { measureTime } from 'measure-time';
import path from 'path';
import request from 'superagent';
import { runfork } from '../../lib/runfork';

const sampleApp = path.join(__dirname, '..', 'shared', 'sample', 'app.js');

suite('runfork', function (): void {
  this.timeout(5 * 1000);

  teardown(async (): Promise<void> => {
    // Delay each test so that the operating system has enough time to clear
    // any ports being used.
    await new Promise((resolve): void => {
      setTimeout(resolve, 0.5 * 1000);
    });
  });

  test('runs the given script.', async (): Promise<void> => {
    runfork({ path: sampleApp });
  });

  suite('onMessage', (): void => {
    test('gets called when the script sends a message.', async (): Promise<void> => {
      let wasOnMessageCalled = false;

      await new Promise((resolve, reject): void => {
        try {
          runfork({
            path: sampleApp,
            env: {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              TIMEOUT: String(1.5 * 1000)
            },
            onMessage (message: string): void {
              try {
                wasOnMessageCalled = true;
                assert.that(message).is.equalTo({ ping: 'pong' });
              } catch (ex: unknown) {
                reject(ex);
              }
            },
            onExit (): void {
              try {
                assert.that(wasOnMessageCalled).is.true();
                resolve();
              } catch (ex: unknown) {
                reject(ex);
              }
            }
          });
        } catch (ex: unknown) {
          reject(ex);
        }
      });
    });
  });

  suite('onExit', (): void => {
    test('gets called once the script ends.', async (): Promise<void> => {
      await new Promise((resolve, reject): void => {
        try {
          runfork({
            path: sampleApp,
            onExit (): void {
              resolve();
            }
          });
        } catch (ex: unknown) {
          reject(ex);
        }
      });
    });

    test('gets called even when the scripts fails ungracefully.', async (): Promise<void> => {
      await new Promise((resolve, reject): void => {
        try {
          runfork({
            path: sampleApp,
            env: {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              EXIT_CODE: 'foobar'
            },
            onExit (exitCode: number): void {
              try {
                assert.that(exitCode).is.equalTo(1);
                resolve();
              } catch (ex: unknown) {
                reject(ex);
              }
            }
          });
        } catch (ex: unknown) {
          reject(ex);
        }
      });
    });

    test('passes the exit code to onExit.', async (): Promise<void> => {
      await new Promise((resolve, reject): void => {
        try {
          runfork({
            path: sampleApp,
            env: {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              EXIT_CODE: String(1)
            },
            onExit (exitCode: number): void {
              try {
                assert.that(exitCode).is.equalTo(1);
                resolve();
              } catch (ex: unknown) {
                reject(ex);
              }
            }
          });
        } catch (ex: unknown) {
          reject(ex);
        }
      });
    });

    test('passes the stdout and stderr streams.', async (): Promise<void> => {
      await new Promise((resolve, reject): void => {
        try {
          runfork({
            path: sampleApp,
            env: {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              TIMEOUT: String(1.5 * 1000)
            },
            onExit (exitCode: number, stdout: string, stderr: string): void {
              try {
                assert.that(stdout).is.matching(/Sample application started/mu);
                assert.that(stderr).is.equalTo('');
                resolve();
              } catch (ex: unknown) {
                reject(ex);
              }
            }
          });
        } catch (ex: unknown) {
          reject(ex);
        }
      });
    });
  });

  suite('environment variables', (): void => {
    test('passes environment variables to the script.', async (): Promise<void> => {
      const getElapsed = measureTime();

      await new Promise((resolve, reject): void => {
        try {
          runfork({
            path: sampleApp,
            env: {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              TIMEOUT: String(1 * 1000)
            },
            onExit (): void {
              try {
                const elapsed = getElapsed();

                assert.that(elapsed.seconds).is.equalTo(1);

                resolve();
              } catch (ex: unknown) {
                reject(ex);
              }
            }
          });
        } catch (ex: unknown) {
          reject(ex);
        }
      });
    });
  });

  suite('arguments', (): void => {
    test('passes arguments to the script.', async (): Promise<void> => {
      await new Promise((resolve, reject): void => {
        try {
          runfork({
            path: sampleApp,
            args: [ '--type', 'test' ],
            onExit (exitCode: number, stdout: string): void {
              try {
                assert.that(stdout).is.matching(/"Process arguments[^"]*,--type,test"/u);
                resolve();
              } catch (ex: unknown) {
                reject(ex);
              }
            }
          });
        } catch (ex: unknown) {
          reject(ex);
        }
      });
    });
  });

  suite('stop', (): void => {
    test('stops the script.', async (): Promise<void> => {
      const stop = runfork({
        path: sampleApp,
        env: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          TIMEOUT: String(10 * 1000)
        }
      });

      // Wait until the http server is up and running.
      await knock.at('localhost', 3000);

      await new Promise((resolve): void => {
        request.
          get('http://localhost:3000/').
          end(async (errRequest, res): Promise<void> => {
            assert.that(errRequest).is.null();
            assert.that(res.status).is.equalTo(200);

            await stop();

            request.
              get('http://localhost:3000/').
              end((err): void => {
                assert.that(err).is.not.null();
                resolve();
              });
          });
      });
    });

    test('stops the script, even if the shutdown takes longer.', async (): Promise<void> => {
      const stop = runfork({
        path: sampleApp,
        env: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          TIMEOUT: String(10 * 1000),

          // eslint-disable-next-line @typescript-eslint/naming-convention
          SHUTDOWN_TIMEOUT: String(500)
        }
      });

      // Wait until the http server is up and running.
      await knock.at('localhost', 3000);

      await new Promise((resolve): void => {
        request.
          get('http://localhost:3000/').
          end(async (errRequest, res): Promise<void> => {
            assert.that(errRequest).is.null();
            assert.that(res.status).is.equalTo(200);

            await stop();

            request.
              get('http://localhost:3000/').
              end((err): void => {
                assert.that(err).is.not.null();
                resolve();
              });
          });
      });
    });
  });
});
