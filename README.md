# runfork

runfork runs a Node.js script isolated as a process.

## Installation

```shell
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

You can also pass arguments to the fork.

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

Sometimes, e.g. when executing a long-running task, it may be necessary to stop the fork. For this, call the `stop` function that is returned.

This function will send 10 `SIGINT` signals with 10ms breaks in between. If the process does not respond to this, it finally sends a `SIGKILL` signal to kill the process.

As the `stop` function returns a promise, you can wait for the process to terminate.

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

```shell
$ bot
```

## License

The MIT License (MIT)
Copyright (c) 2016-2018 the native web.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
