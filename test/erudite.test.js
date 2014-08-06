var fs = require('fs');
var path = require('path');
var test = require('tape');
var erudite = require('..');

var testSpecs = [
  { basename: 'indented', desc: 'parses indented code blocks' },
  { basename: 'fenced', desc: 'parsed fenced code blocks' },
  { basename: 'mixed', desc: 'parsed mixed code blocks' }
];

testSpecs.forEach(function (testSpec) {
  test(testSpec.desc, function (t) {
    t.plan(1);

    var expected = read(testSpec.basename + '.js');
    var actual = erudite.parse(read(testSpec.basename + '.md'));

    t.equals(actual.toString(), expected.trim());
  });
});

test('executes parsed code', function (t) {
  t.plan(2);

  var src = '# Hello World\n\n```js\nvar foo = "bar";\nbaz = foo.toUpperCase();\n```';
  var ctx = erudite(src);
  t.equals(ctx.foo, 'bar');
  t.equals(ctx.baz, 'BAR');
});

function resolve (filename) {
  return path.join(__dirname, 'fixtures', filename);
}

function read (filename) {
  return fs.readFileSync(resolve(filename), 'utf8');
}
