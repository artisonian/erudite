// erudite
// =======
//
// A tool that parses and executes JavaScript from Markdown, akin to
// [Literate CoffeeScript](http://coffeescript.org/#literate).
'use strict';

var os = require('os');
var vm = require('vm');
var assign = require('object-assign');
var marked = require('marked');
var babel = require('babel-core');

// API
// ---

// **erudite** both parses and executes Markdown `text`. It is the single API exposed
// by the module, but the plumbing functions are attached to it for convenience.
function erudite (text, opts) {
  return exec(parse(text, opts), opts);
}

erudite.parse = parse;
erudite.exec = exec;

module.exports = erudite;

// Plumbing
// --------

// **parse** takes in Markdown `text`, extracts all indented and fenced code blocks,
// returns the code blocks (concatenated; transpiled using [Babel](https://babeljs.io)).
// Pass desired presets, plugins, and other [Babel options](https://babeljs.io/docs/core-packages/#options) in `opts`. No default presets etc are defined.
 function parse (text, opts) {
  opts = assign({ eol: os.EOL }, opts);

  var SEPARATOR = opts.eol + opts.eol;
  // remove so that babel doesn't complain
  delete opts.eol;

  var buf;

  // Break the Markdown `text` into tokens.
  var tokens = marked.lexer(text);
  // Check each token, and push it unto an array if it is a code block.
  var codeBlocks = tokens.reduce(function (blocks, token) {
    if (token.type === 'code') {
      blocks.push(new Buffer(token.text));
      blocks.push(new Buffer(SEPARATOR));
    }

    return blocks;
  }, []);

  codeBlocks.pop(); // remove trailing EOL adding from the while loop

  // Concatentate the code blocks.
  buf = Buffer.concat(codeBlocks);

  // Return the concatenated code blocks as a `Buffer`.
  return new Buffer(babel.transform(buf.toString(), opts).code);
}

// **exec** takes a string of JavaScript as `src`, and runs it through a new
// [virtual machine context](http://nodejs.org/api/vm.html).
//
// This was lifted almost verbatim from CoffeeScript's
// [source](http://coffeescript.org/documentation/docs/coffee-script.html).
function exec (src, opts) {
  opts = assign({ filename: 'erudite' }, opts);

  // Load Babel polyfill
  require('babel-polyfill');

  // Create a new execution context, using `global` for seed values.
  var ctx = vm.createContext(global);

  // Set up a few expected global variables.
  ctx.__filename = opts.filename;
  ctx.__dirname =  process.cwd();
  ctx.global = ctx.root = ctx.GLOBAL = ctx;

  // Since `require` is undefined in the new context, re-create it to allow
  // the evaluated `src` to import modules.
  var Module = require('module');
  var _module = ctx.module = new Module('eval');
  var _require = ctx.require = function (path) {
    return Module._load(path, _module, true);
  };
  _module.filename = ctx.__filename;
  Object.getOwnPropertyNames(require).forEach(function (r) {
    if (['paths', 'caller', 'callee',
         'arguments', 'name', 'length'].indexOf(r) === -1) {
      _require[r] = require[r];
    }
  });
  _require.paths = _module.paths = Module._nodeModulePaths(process.cwd());
  _require.resolve = function (request) {
    Module._resolveFilename(request, _module);
  };

  // Evalute `src` in the new context.
  vm.runInContext(src, ctx);

  // Return the modified context (useful for testing).
  return ctx;
}
