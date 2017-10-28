'use strict';

const roboter = require('roboter');

roboter.
  workOn('server').
  equipWith(task => {
    task('universal/analyze', {
      src: [ '**/*.js', '!coverage/**/*.js', '!dist/**/*.js', '!node_modules/**/*.js' ]
    });
  }).
  start();
