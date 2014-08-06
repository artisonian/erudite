var os = require('os');
var vm = require('vm');
var marked = require('marked');

module.exports = erudite;

function parse (text) {
  var tokens = marked.lexer(text);
  var SEPARATOR = os.EOL + os.EOL;
  var codeBlocks = [];
  var buf;

  for (var i = 0; i < tokens.length; i++) {
    if (tokens[i].type === 'code') {
      codeBlocks.push(new Buffer(tokens[i].text));
      codeBlocks.push(new Buffer(SEPARATOR));
    }
  }

  codeBlocks.pop(); // remove trailing EOL adding from the while loop
  buf = Buffer.concat(codeBlocks);

  return buf;
}

function exec (src, argv) {
  var ctx = vm.createContext(global);
  ctx.__filename = argv._[0] || 'erudite';
  ctx.__dirname =  process.cwd();
  ctx.global = ctx.root = ctx.GLOBAL = ctx;

  var Module = require('module');
  var _module = ctx.module = new Module('eval');
  var _require = ctx.require = function (path) {
    return Module._load(path, _module, true);
  };
  _module.filename = ctx.__filename;
  Object.getOwnPropertyNames(require).forEach(function (r) {
    if (['paths', 'caller', 'callee', 'arguments'].indexOf(r) === -1) {
      _require[r] = require[r];
    }
  });
  _require.paths = _module.paths = Module._nodeModulePaths(process.cwd());
  _require.resolve = function (request) {
    Module._resolveFilename(request, _module);
  };

  vm.runInContext(src, ctx);
}

function erudite (text, argv) {
  exec(parse(text), argv);
}

erudite.parse = parse;
erudite.exec = exec;
