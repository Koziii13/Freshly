const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Workshop Manager',
    icon: path.join(__dirname, 'server', 'public', 'vite.svg'),
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  mainWindow.loadURL('http://localhost:3001').catch(err => {
    console.error("Failed to load URL:", err);
  });

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  process.on('uncaughtException', (err) => {
    dialog.showErrorBox('Fatal Error', err.stack || String(err));
  });
  process.on('unhandledRejection', (reason) => {
    dialog.showErrorBox('Fatal Rejection', (reason && reason.stack) || String(reason));
  });

  // Mock open so server doesn't launch default browser
  const mockOpen = require('module');
  const originalRequire = mockOpen.prototype.require;
  mockOpen.prototype.require = function(moduleName) {
    if (moduleName === 'open') return () => Promise.resolve();
    return originalRequire.apply(this, arguments);
  };

  createWindow();

  try {
    process.env.DATA_DIR = app.getPath('userData');
    require('./server/index.js');
  } catch(err) {
    dialog.showErrorBox('Server Crash', "Failed to start local server!\n\n" + (err.stack || String(err)));
  }

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
