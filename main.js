const { app, BrowserWindow, dialog, session } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  // Set up Content Security Policy (CSP) for maximum offline security
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["default-src 'self' http://localhost:3001; script-src 'self' 'unsafe-inline' http://localhost:3001; style-src 'self' 'unsafe-inline' http://localhost:3001; img-src 'self' data: http://localhost:3001; connect-src 'self' http://localhost:3001; font-src 'self' http://localhost:3001 data:"]
      }
    });
  });

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Workshop Manager',
    icon: path.join(__dirname, 'server', 'public', 'vite.svg'),
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true, // Crucial for security
      disableBlinkFeatures: 'Auxclick' // Prevent middle-click vulnerabilities
    }
  });

  // Security: Block any external popup windows
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });

  // Security: Prevent navigation away from the local app
  mainWindow.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('http://localhost:3001')) {
      e.preventDefault();
      console.log('Blocked unauthorized navigation to:', url);
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
