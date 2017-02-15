const path = require('path');
const url = require('url');
const { BrowserWindow, app, dialog, ipcMain } = require('electron');

let mainWindow = null;

ipcMain.on('open-markdown-file', () => {
  if (mainWindow) {
    requestMarkdownFile().then(([fileName]) => {
      mainWindow.webContents.send('load-markdown', fileName);
    });
  }
});

ipcMain.on('evaluate-script', (event, { fileName, code }) => {
  if (mainWindow) {
    const win = new BrowserWindow({ show: false });
    const evalUrl = url.format({
      protocol: 'file',
      slashes: true,
      pathname: path.join(__dirname, 'evaluate.html'),
      hash: encodeURIComponent(JSON.stringify({ fileName }))
    });

    win.webContents.on('did-finish-load', () => {
      console.log('eval window loaded');
      win.webContents.openDevTools();
      win.webContents.executeJavaScript(code, false, result => {
        console.log('eval result', result);
        mainWindow.webContents.send('script-output', result);
        console.log('closing eval window');
        win.close();
      });
    });
    win.loadURL(evalUrl);
  }
});

app.on('ready', function () {
  requestMarkdownFile().then(createWindow)
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow == null) {
    requestMarkdownFile().then(createWindow);
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
  require('devtron').install();

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