const fs = require('fs');
const path = require('path');
const util = require('util');
const watch = require('watch');
const commonmark = require('commonmark');
const hljs = require('highlight.js');
const { ipcRenderer, webFrame } = require('electron');

let file = null;
let markdownBody = null;
let codeBody = null;
let monitor = null;
let shouldWatch = true;

document.body.classList.add(`platform-${process.platform}`);

document.querySelector('.js-openFile').addEventListener('click', () => {
  ipcRenderer.send('open-markdown-file');
}, false);

document.querySelector('.js-showMarkdown').addEventListener('click', showMarkdown);
document.querySelector('.js-showCode').addEventListener('click', showCode);
document.querySelector('.js-reload').addEventListener('click', () => {
  if (file) {
    loadMarkdown(null, file);
  }
});
document.querySelector('.js-toggleWatch').addEventListener('click', (event) => {
  shouldWatch = event.target.checked;
  toggleWatch();
});

ipcRenderer.on('script-output', function (event, result) {
  const output = typeof result === 'object' ? util.inspect(result, { depth: null }) : result;
  const el = document.querySelector('.script-output');
  console.debug('script-output', output);
  el.innerHTML = `<pre><code>${output}</code></pre>`;
});

ipcRenderer.on('load-markdown', loadMarkdown);

function loadMarkdown (event, fileName) {
  console.debug('load-markdown', fileName);

  const reader = new commonmark.Parser();
  const writer = new commonmark.HtmlRenderer();

  readFileAsync(fileName, 'utf8')
    .then(text => ({ fileName, text }))
    .then(({ fileName, text }) => {
      const parsed = reader.parse(text);
      const body = document.querySelector('.markdown-body');

      markdownBody = writer.render(parsed);
      showMarkdown();

      return { fileName, parsed };
    })
    .then(({ fileName, parsed }) => {
      const walker = parsed.walker();
      const chunks = [];

      let event = null;
      let node = null;

      while ((event = walker.next())) {
        node = event.node;
        if (event.entering && node.type === 'code_block') {
          chunks.push(node.literal);
        }
      }

      file = fileName;
      codeBody = chunks.join('\n');
      return { fileName, code: codeBody };
    })
    .then(evalScript)
    .then(toggleWatch)
    .catch(err => console.error(err));
}

function showMarkdown () {
  if (markdownBody) {
    const body = document.querySelector('.markdown-body');
    body.innerHTML = markdownBody;
    Array.from(body.querySelectorAll('pre code')).forEach(block => {
      hljs.highlightBlock(block);
    });
  }
}

function showCode () {
  if (codeBody) {
    const body = document.querySelector('.markdown-body');
    body.innerHTML = `<pre><code class="language-js">${codeBody}</code></pre>`;
    Array.from(body.querySelectorAll('pre code')).forEach(block => {
      hljs.highlightBlock(block);
    });
  }
}

function updateRequirePath (fileName) {
  if (modulePath) {
    require.main.paths.splice(0, 1);
  }

  modulePath = path.join(path.dirname(fileName), 'node_modules');
  require.main.paths.unshift(modulePath);
}

function readFileAsync (...args) {
  return new Promise(function (resolve, reject) {
    args.push(function (err, result) {
      if (err) return reject(err);
      resolve(result);
    });
    fs.readFile(...args);
  });
}

function evalScript ({ fileName, code }) {
  if (code) {
    ipcRenderer.send('evaluate-script', { fileName, code });
  }
}

function startMonitoring (dir) {
  if (monitor) {
    stopMonitoring();
  }

  watch.createMonitor(dir, function (mon) {
    monitor = mon;
    mon.on('changed', (f) => {
      if (file && file === f) {
        console.debug('reloading file...');
        loadMarkdown(null, file);
      }
    });
    mon.on('removed', (f) => {
      if (file && file === f) {
        stopMonitoring();
      }
    });
  });
}

function stopMonitoring () {
  if (monitor) {
    monitor.stop();
  }
}

function toggleWatch () {
  if (shouldWatch && file) {
    startMonitoring(path.dirname(file));
  } else {
    stopMonitoring();
  }
}