# runfork

runfork runs a Node.js script isolated as a process.

## Installation

```bash
$ npm install runfork
```

## Quick start

To use runfork first you need to add a reference to your application.

```javascript
const runfork = require('runfork');
```

Then to run a Node.js script, run `runfork` and provide the path to the script using an `options` object. In case the script can not be started, an exception is thrown.

```javascript
const stop = runfork({ path: './app.js' });
```

### Passing arguments to the fork

You can pass arguments to the fork.

```javascript
const stop = runfork({
  path: './app.js',
  args: ['--type', 'test'],
});
```

### Passing environment variables to the fork

From time to time you need to set environment variables for the script being called. To do so provide an `env` property in the `options` object that contains the environment variables as key-value pairs.

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

If you start a long-running task and you want to stop this task, call the `stop` function that is returned.

The `stop` function will send up to 10 `SIGINT` signals with 10ms timeout, and - if the process didn't stop - finally a `SIGKILL` signal.

The `stop` function returns a promise and resolves after the process actually terminated. So you can wait for the process to terminate.

```javascript
const stop = runfork({ path: './app.js' });

// ...

await stop();
```

### Detecting when the fork exits

To get notified when the script exits, provide the `onExit` property in the `options` object. This function will get called with the exit code as well as the stdout and the stderr streams.

```javascript
const stop = runfork({
  path: './app.js',
  onExit (exitCode, stdout, stderr) {
    // ...
  }
});
```

## Running the build

To build this module use [roboter](https://www.npmjs.com/package/roboter).

```bash
$ bot
```

## Breaking change

### 0.4.0

- The interface has changed, so that the `stop()` function is returned and not given in a callback.
- The `stop()` function returns a promise and resolves only after the child process has actually terminated.

## License

The MIT License (MIT)
Copyright (c) 2016 the native web.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
