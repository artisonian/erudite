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
    requestMarkdownFile().then(([fileName]) => {
      mainWindow.webContents.send('load-markdown', fileName);
      conf.set('file.lastOpened', fileName);
    });
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
  if (argv.clear) {
    conf.delete('file.lastOpened');
  }

  const fileName = argv.open || conf.get('file.lastOpened');

  if (fileName) {
    createWindow([fileName]);
  } else {
    requestMarkdownFile().then(createWindow);
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