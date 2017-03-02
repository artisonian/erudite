const path = require('path');
const url = require('url');
const { BrowserWindow, app, dialog, ipcMain } = require('electron');
const storage = require('electron-json-storage');

require('electron-debug')({ showDevTools: true });

let mainWindow = null;

ipcMain.on('open-markdown-file', () => {
  if (mainWindow) {
    requestMarkdownFile().then(([fileName]) => {
      mainWindow.webContents.send('load-markdown', fileName);
    });
  }
});

app.on('ready', function () {
  storage.get('last-opened', function (err, data) {
    if (err) return console.error(err);

    if (data.fileName) {
      createWindow([data.fileName]);
    } else {
      requestMarkdownFile().then(createWindow);
    }
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow == null) {
    storage.get('last-opened', function (err, data) {
      if (err) return console.error(err);

      if (data.fileName) {
        createWindow([data.fileName]);
      } else {
        requestMarkdownFile().then(createWindow);
      }
    });
  }
});

function requestMarkdownFile () {
  const dialogOptions = {
    properties: ['openFile'],
    filters: [
      { name: 'Markdown', extensions: ['md', 'markdown', 'txt'] }
    ]
  };
  return showOpenDialogAsync(dialogOptions).then(([fileName]) => new Promise((resolve, reject) => {
    storage.set('last-opened', { fileName }, function (err) {
      if (err) return reject(err);
      resolve([fileName]);
    });
  }));
}

function createWindow ([fileName]) {
  const windowOptions = {
    width: 960,
    minWidth: 640,
    height: 800,
    backgroundColor: '#f2f2f2',
    titleBarStyle: 'hidden-inset'
  };

  mainWindow = new BrowserWindow(windowOptions);
  mainWindow.loadURL(path.join('file://', __dirname, 'index.html'));

  mainWindow.webContents.openDevTools();

  mainWindow.webContents.on('did-finish-load', function () {
    mainWindow.webContents.send('load-markdown', fileName);
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