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
      --jsx      preprocess with JSX (harmony)
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

### `erudite.parse(str, opts)`

- `str` A string of Markdown text to process
- `opts` A configuration object
  - `jsx` (Optional) A boolean to toggle [JSX][] pre-processing (defaults to `false`)
  - `eol` (Optional) The string to use to concatenate code blocks (defaults to `os.EOL`)

### `erudite.exec(src, opts)`

- `src` A string of JavaScript source code
- `opts` A configuration object
  - `filename` (Optional) The name of the source file (defaults to `erudite`)

[jsx]: http://facebook.github.io/react/docs/jsx-in-depth.html

## License

MIT
