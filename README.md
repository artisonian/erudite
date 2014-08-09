# Erudite

A tool that parses and executes JavaScript from Markdown, akin to [Literate CoffeeScript](http://coffeescript.org/#literate). Check out the [annotated source](http://artisonian.github.io/erudite/docs/) or the docs below.

## Getting Started

```sh
npm install -g erudite
```

## CLI Usage

```
Usage: erudite [options] /path/to/filename

  -h, --help     show this help text
      --jsx      preprocess with JSX (harmony)
  -o, --outfile  write to the given file path
      --stdout   write to stdout (ignores -o)
```

## API Usage

`erudite` exports a single function which parses and executes a given buffer of
[Markdown](http://daringfireball.net/projects/markdown) text:

```js
var fs = require('fs');
var erudite = require('erudite');

var filename = './literate-javascript.md';
var text = fs.readFileSync(filename, 'utf8');

erudite(text, {
  filename: filename
});
```

You can also parse and execute separately:

```js
var source = erudite.parse(buf);
erudite.exec(source, opts);
```

### `erudite.parse(text, opts)`

- `text` A string of Markdown text to process
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
