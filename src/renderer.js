const fs = require('fs');
const path = require('path');
const util = require('util');
const watch = require('watch');
const commonmark = require('commonmark');
const hljs = require('highlight.js');
const { ipcRenderer, webFrame } = require('electron');

let _fileName = null;
let _markdown = null;
let _code = null;
let _monitor = null;
let _autorun = true;

document.body.classList.add(`platform-${process.platform}`);

document.querySelector('.js-openFile').addEventListener('click', () => {
  ipcRenderer.send('open-markdown-file');
}, false);
document.querySelector('.js-saveCode').addEventListener('click', () => {
  if (_code.trim()) {
    const code = `!async function () {\n\n${_code.trim()}\n\n}();`;
    ipcRenderer.send('save-code', { origFileName: _fileName, code });
  }
}, false);
document.querySelector('.js-showMarkdown').addEventListener('click', showMarkdown);
document.querySelector('.js-showCode').addEventListener('click', showCode);
document.querySelector('.js-reload').addEventListener('click', () => {
  if (_fileName) {
    loadMarkdown(null, _fileName);
  }
});
document.querySelector('.js-toggleAutorun').addEventListener('click', (event) => {
  _autorun = event.target.checked;
  toggleAutorun();
  // TODO: Re-run when autorun is enabled
});

ipcRenderer.on('load-markdown', loadMarkdown);

function loadMarkdown (event, fileName, options) {
  console.debug('load-markdown', fileName);

  if (options != null) {
    _autorun = options.autorun;
    document.querySelector('.js-toggleAutorun input').checked = _autorun;
  }

  const reader = new commonmark.Parser();
  const writer = new commonmark.HtmlRenderer();

  readFileAsync(fileName, 'utf8')
    .then(text => ({ fileName, text }))
    .then(({ fileName, text }) => {
      const parsed = reader.parse(text);
      const body = document.querySelector('.markdown-body');

      _markdown = writer.render(parsed);
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

      _fileName = fileName;
      _code = chunks.join('\n');
      return { fileName, code: _code };
    })
    .then(args => {
      if (_autorun) {
        evalScript(args);
      }
    })
    .then(toggleAutorun)
    .catch(err => console.error(err));
}

function showMarkdown () {
  if (_markdown) {
    const body = document.querySelector('.markdown-body');
    body.innerHTML = _markdown;
    Array.from(body.querySelectorAll('pre code')).forEach(block => {
      hljs.highlightBlock(block);
    });
  }
}

function showCode () {
  if (_code) {
    const body = document.querySelector('.markdown-body');
    body.innerHTML = `<pre><code class="language-js">${_code}</code></pre>`;
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

let scriptEl = null;
let modulePath = null;

function evalScript ({ fileName, code }) {
  if (code) {
    if (modulePath) {
      require.main.paths.splice(0, 1);
    }
    modulePath = path.join(path.dirname(fileName), 'node_modules');
    require.main.paths.unshift(modulePath);

    if (document.body.contains(scriptEl)) {
      document.body.removeChild(scriptEl);
    }
    scriptEl = document.createElement('script');
    scriptEl.textContent = `
      !async function (__filename) {
        ${code}
      }('${fileName}');
    `;
    document.body.appendChild(scriptEl);
  }
}

function startMonitoring (dir) {
  if (_monitor) {
    stopMonitoring();
  }

  watch.createMonitor(dir, function (mon) {
    _monitor = mon;
    mon.on('changed', (f) => {
      if (_fileName && _fileName === f) {
        console.debug('reloading file...');
        loadMarkdown(null, _fileName);
      }
    });
    mon.on('removed', (f) => {
      if (_fileName && _fileName === f) {
        stopMonitoring();
      }
    });
  });
}

function stopMonitoring () {
  if (_monitor) {
    _monitor.stop();
  }
}

function toggleAutorun () {
  if (_autorun && _fileName) {
    startMonitoring(path.dirname(_fileName));
  } else {
    stopMonitoring();
  }
}