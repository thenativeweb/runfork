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

Then to run a Node.js script, run `runfork` and provide the path to the script using an `options` object. Additionally, you have to provide a callback. In case the script can not be started, you are being handed over the appropriate error.

```javascript
runfork({ path: './app.js' }, (err, stop) => {
  // ...
});
```

### Passing environment variables to the fork

From time to time you need to set environment variables for the script being called. To do so provide an `env` property in the `options` object that contains the environment variables as key-value pairs.

```javascript
runfork({
  path: './app.js',
  env: {
    PORT: 3000
  }
}, (err, stop) => {
  // ...
});
```

### Stopping the fork

If you start a long-running task and you want to stop this task, call the `stop` function that is being provided by the callback.

```javascript
runfork({ path: './app.js' }, (err, stop) => {
  // ...
  stop();
});
```

### Detecting when the fork exits

To get notified when the script exits, provide a `onExit` property in the `options` object. This function will get called with the exit code.

```javascript
runfork({
  path: './app.js',
  onExit (exitCode) {
    // ...
  }
}, (err, stop) => {
  // ...
});
```

## Running the build

To build this module use [roboter](https://www.npmjs.com/package/roboter).

```bash
$ bot
```

## License

The MIT License (MIT)
Copyright (c) 2016 the native web.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
