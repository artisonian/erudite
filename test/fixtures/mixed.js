'use strict';
var fs = require('fs');
var stream = require('stream');

var readStream = fs.createReadStream(__filename);
var upcaseStream = new stream.Transform();
upcaseStream._transform = function (chunk, encoding, done) {
  this.push(chunk.toString().toUpperCase());
  done();
};
var stdoutStream = new stream.Writable();
stdoutStream._write = function (chunk, encoding, done) {
  console.log(chunk.toString());
  done();
};

readStream
  .pipe(upcaseStream)
  .pipe(stdoutStream);