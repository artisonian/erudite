const fs = require('fs');
const path = require('path');
const url = require('url');
const { BrowserWindow, app, dialog, ipcMain } = require('electron');
const Configstore = require('configstore');
const pkg = require('./package.json');
const conf = new Configstore(pkg.name);
const argv = require('minimist')(process.argv.slice(2), {
  alias: {
    c: 'clear',
    o: 'open'
  },
  boolean: ['c', 'clear', 'auto-run'],
  default: {
    'auto-run': true
  }
});

require('electron-debug')({ showDevTools: true });

let mainWindow = null;

ipcMain.on('open-markdown-file', () => {
  if (mainWindow) {
    requestMarkdownFile().then(([fileName] = []) => {
      if (!fileName) {
        console.log('open cancelled');
        return Promise.resolve();
      }
      mainWindow.webContents.send('load-markdown', fileName);
      conf.set('file.lastOpened', fileName);
    })
    .catch(err => console.error(err));
  }
});

ipcMain.on('save-code', (event, { origFileName, code }) => {
  if (code) {
    showSaveDialogAsync({ defaultPath: origFileName.replace(/(md|markdown|txt)$/, 'js') })
      .then(fileName => {
        if (fileName == null) {
          console.log('save cancelled');
          return Promise.resolve();
        }
        return writeFileAsync(fileName, code);
      })
      .catch(err => console.error(err));
  }
});

app.on('ready', init);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow == null) {
    init();
  }
});

function requestMarkdownFile () {
  const dialogOptions = {
    properties: ['openFile'],
    filters: [
      { name: 'Markdown', extensions: ['md', 'markdown', 'txt'] }
    ]
  };
  return showOpenDialogAsync(dialogOptions);
}

function init () {
  console.log('argv', process.argv);

  if (argv.clear) {
    conf.delete('file.lastOpened');
  }

  const fileName = argv.open || conf.get('file.lastOpened');

  if (fileName) {
    createWindow([fileName]);
  } else {
    requestMarkdownFile()
      .then(createWindow)
      .catch(err => console.error(err));
  }
}

function createWindow ([fileName]) {
  const windowOptions = {
    width: 960,
    minWidth: 640,
    height: 800,
    backgroundColor: '#fff'
  };

  mainWindow = new BrowserWindow(windowOptions);
  mainWindow.loadURL(path.join('file://', __dirname, 'index.html'));

  mainWindow.webContents.openDevTools();

  mainWindow.webContents.on('did-finish-load', function () {
    mainWindow.webContents.send('load-markdown', fileName, { autorun: argv['auto-run'] });
    conf.set('file.lastOpened', fileName);
  });

  mainWindow.on('closes', function () {
    mainWindow = null;
  });
}

function showOpenDialogAsync (...args) {
  return new Promise(function (resolve, reject) {
    dialog.showOpenDialog(...args.concat(resolve));
  });
}

function showSaveDialogAsync (...args) {
  return new Promise(function (resolve, reject) {
    dialog.showSaveDialog(...args.concat(resolve));
  });
}

function writeFileAsync (...args) {
  return new Promise(function (resolve, reject) {
    fs.writeFile(...args, function (err) {
      if (err) return reject(err);
      resolve();
    });
  });
}