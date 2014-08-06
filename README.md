# Erudite

A JavaScript equivalent to [Literate CoffeeScript](http://coffeescript.org/#literate).

## Getting Started

```sh
npm install -g erudite
```

## CLI Usage

```
Usage: erudite [options] /path/to/filename

  -h, --help     show this help text
  -o, --outfile  write to the given file path
```

## Module Usage

`erudite` exports a single function which parses and executes a given buffer of
[Markdown](http://daringfireball.net/projects/markdown) text:

```js
var fs = require('fs');
var erudite = require('erudite');

var filename = './literate-javascript.md';
var src = fs.readFileSync(filename, 'utf8');

erudite(src, {
  filename: filename
});
```

You can also parse and execute separately:

```js
var source = erudite.parse(buf);
erudite.exec(source, opts);
```

## License

MIT
