import process from 'process';
import { retry } from 'retry-ignore-abort';
import toString from 'stream-to-string';
import { ChildProcess, fork } from 'child_process';

const runfork = function ({
  path,
  nodeArgs = [],
  args = [],
  env = {},
  onMessage = (): void => {
    // Intentionally left blank.
  },
  onExit = (): void => {
    // Intentionally left blank.
  },
  silent = true
}: {
  path: string;
  nodeArgs?: string[];
  args?: string[];
  env?: NodeJS.ProcessEnv;
  onMessage? (message: string): void;
  onExit? (exitCode: number, stdout: string, stderr: string): void;
  silent?: boolean;
}): () => Promise<void> {
  let subProcess: ChildProcess;

  const cleanUpAndExit = function (): void {
    subProcess.kill('SIGINT');
  };

  process.on('SIGINT', cleanUpAndExit);
  process.on('SIGTERM', cleanUpAndExit);
  process.on('exit', cleanUpAndExit);

  subProcess = fork(path, args, { env, silent, execArgv: nodeArgs });

  subProcess.on('message', (message: string): void => {
    onMessage(message);
  });

  subProcess.once('exit', async (code: number): Promise<void> => {
    let stderr = '',
        stdout = '';

    if (subProcess.stdout && subProcess.stdout.readable) {
      stdout = await toString(subProcess.stdout);
    }
    if (subProcess.stderr && subProcess.stderr.readable) {
      stderr = await toString(subProcess.stderr);
    }

    onExit(code, stdout, stderr);
  });

  const stop = async function (): Promise<void> {
    process.removeListener('SIGINT', cleanUpAndExit);
    process.removeListener('SIGTERM', cleanUpAndExit);
    process.removeListener('exit', cleanUpAndExit);

    try {
      await retry(async (): Promise<void> => {
        try {
          process.kill(subProcess.pid, 'SIGINT');
        } catch (ex) {
          // `process.kill` throws an exception if the PID could not be found.
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

export { runfork };
