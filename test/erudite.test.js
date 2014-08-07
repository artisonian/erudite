'use strict';

var test = require('tape');
var multiline = require('multiline');
var erudite = require('..');

var m = multiline.stripIndent;

test('parses indented code blocks', function (t) {
  t.plan(1);

  var src = m(function () {/*
    # Indented Example

    Let's try indented code.

        var text = 'Lorem ipsum dolor, sit amet...';

    Now, print it.

        console.log(text);
  */});

  var expected = m(function () {/*
    var text = 'Lorem ipsum dolor, sit amet...';

    console.log(text);
  */});

  t.equals(erudite.parse(src).toString(), expected);
});

test('parses fenced code blocks', function (t) {
  t.plan(1);

  var src = m(function () {/*
    # Fenced Example

    Let's try fenced code.

    ```js
    function add (a, b) {
      return a + b;
    }
    ```

    Now, print it.

    ```js
    console.log(add(2, 3));
    ```
  */});

  var expected = m(function () {/*
    function add (a, b) {
      return a + b;
    }

    console.log(add(2, 3));
  */});

  t.equals(erudite.parse(src).toString(), expected);
});

test('parses mixed code blocks', function (t) {
  t.plan(1);

  var src = m(function () {/*
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
  */});

  var expected = m(function () {/*
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
  */});

  t.equals(erudite.parse(src).toString(), expected);
});

test('parses jsx code blocks', function (t) {
  t.plan(1);

  // NOTE: can't use `multiline` here because of the `@jsx` pragma
  var src = '# Erudite and JSX\n' +
    '\n' +
    '[React][] is a library by Facebook for building UIs. It features an optional\n' +
    'HTML-like syntax called **JSX**. To use it, first declare the appropriate\n' +
    'pragma in comments at the top of your file:\n' +
    '\n' +
    '    /** @jsx React.DOM */\n' +
    '    var React = require("react");\n' +
    '\n' +
    'Then, declare a _component_:\n' +
    '\n' +
    '    var Panel = module.exports = React.createClass({\n' +
    '      render: function () {\n' +
    '        return (\n' +
    '          <div className="panel panel-default">\n' +
    '            <div className="panel-heading">\n' +
    '              <h3 className="panel-title">{this.props.title}</h3>\n' +
    '            </div>\n' +
    '            <div className="panel-body">\n' +
    '              {this.props.children}\n' +
    '            </div>\n' +
    '          </div>\n' +
    '        )\n' +
    '      }\n' +
    '    });\n' +
    '\n' +
    '**That\'s it!** It\'s just that simple.\n' +
    '\n' +
    '[react]: http://facebook.github.io/react';

  var expected = '/** @jsx React.DOM */\n' +
    'var React = require("react");\n' +
    '\n' +
    'var Panel = module.exports = React.createClass({displayName: \'exports\',\n' +
    '  render: function () {\n' +
    '    return (\n' +
    '      React.DOM.div({className: "panel panel-default"}, \n' +
    '        React.DOM.div({className: "panel-heading"}, \n' +
    '          React.DOM.h3({className: "panel-title"}, this.props.title)\n' +
    '        ), \n' +
    '        React.DOM.div({className: "panel-body"}, \n' +
    '          this.props.children\n' +
    '        )\n' +
    '      )\n' +
    '    )\n' +
    '  }\n' +
    '});';

  t.equals(erudite.parse(src, { jsx: true }).toString(), expected);
});

test('executes parsed code', function (t) {
  t.plan(2);

  var src = m(function () {/*
    # Hello World

    ```js
    var foo = "bar";
    baz = foo.toUpperCase();
    ```
  */});
  var ctx = erudite(src);
  t.equals(ctx.foo, 'bar');
  t.equals(ctx.baz, 'BAR');
});
