# runfork

runfork runs a Node.js script isolated as a process.

## Status

| Category         | Status                                                                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Version          | [![npm](https://img.shields.io/npm/v/runfork)](https://www.npmjs.com/package/runfork)                                                      |
| Dependencies     | ![David](https://img.shields.io/david/thenativeweb/runfork)                                                                                |
| Dev dependencies | ![David](https://img.shields.io/david/dev/thenativeweb/runfork)                                                                            |
| Build            | [![CircleCI](https://img.shields.io/circleci/build/github/thenativeweb/runfork)](https://circleci.com/gh/thenativeweb/runfork/tree/master) |
| License          | ![GitHub](https://img.shields.io/github/license/thenativeweb/runfork)                                                                      |

## Installation

```shell
$ npm install runfork
```

## Quick start

To use runfork first you need to add a reference to your application:

```javascript
const runfork = require('runfork').default;
```

If you use TypeScript, use the following code instead:

```typescript
import runFork from 'runfork';
```

Then to run a Node.js script, run `runfork` and provide the path to the script using an `options` object. In case the script can not be started, an exception is thrown:

```javascript
const stop = runfork({ path: './app.js' });
```

### Passing arguments to the fork

You can also pass arguments to the fork:

```javascript
const stop = runfork({
  path: './app.js',
  args: ['--type', 'test'],
});
```

### Passing environment variables to the fork

From time to time you need to set environment variables for the script being called. To do so provide an `env` property in the `options` object that contains the environment variables as key-value pairs:

```javascript
const stop = runfork({
  path: './app.js',
  env: {
    PORT: 3000
  }
});
```

### Sending messages from the fork to the parent

To send messages from the fork to the parent use the [`process.send`](https://nodejs.org/api/process.html#process_process_send_message_sendhandle_options_callback) function from within your fork. In the parent provide an `onMessage` function to receive the messages:

```javascript
const stop = runfork({
  path: './app.js',
  onMessage (message) {
    // ...
  }
});
```

### Stopping the fork

Sometimes, e.g. when executing a long-running task, it may be necessary to stop the fork. For this, call the `stop` function that is returned.

This function will send 10 `SIGINT` signals with 10ms breaks in between. If the process does not respond to this, it finally sends a `SIGKILL` signal to kill the process.

As the `stop` function returns a promise, you can wait for the process to terminate:

```javascript
const stop = runfork({ path: './app.js' });

// ...

await stop();
```

### Detecting when the fork exits

To get notified when the script exits, provide the `onExit` property in the `options` object. This function will get called with the exit code as well as the stdout and the stderr streams:

```javascript
const stop = runfork({
  path: './app.js',
  onExit (exitCode, stdout, stderr) {
    // ...
  }
});
```

### Passing through output

For debugging purposes, it may make sense from time to time to simply pass through the original output. For this, provide the `silent` property in the `options` object and set it to `false`:

```javascript
const stop = runfork({
  path: './app.js',
  silent: false
});
```

## Running the build

To build this module use [roboter](https://www.npmjs.com/package/roboter).

```shell
$ npx roboter
```
