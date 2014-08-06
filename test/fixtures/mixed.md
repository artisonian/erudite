# Literate JavaScript

I've been inspired by [Literate CoffeeScript](http://coffeescript.org/#literate) to create a literate JavaScript parser. I like the idea of writing [Markdown](http://daringfireball.net/projects/markdown), but having executable JavaScript code blocks.

    'use strict';
    var fs = require('fs');
    var stream = require('stream');

Let's read this file, and transform all characters to uppercase.

```js
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
```

Take it to the bank.

    readStream
      .pipe(upcaseStream)
      .pipe(stdoutStream);
