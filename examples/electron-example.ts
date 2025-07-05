// Example: Using @kodeglot/belgian-eid-reader in an Electron app
// This file demonstrates how to integrate the package with Electron

import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent } from 'electron';
import { readEidData, EidReader, EidReaderError, EidReaderOptions, checkRequirements, installRequirements, ReaderResult, EidData } from '../dist/index.js';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: __dirname + '/preload.js'
    }
  });

  mainWindow.loadFile('examples/index.html');
}

// Handle eID reading from renderer process
ipcMain.handle('read-eid', async (_event: IpcMainInvokeEvent, options: EidReaderOptions = {}) => {
  const result: ReaderResult<EidData> = await readEidData(options);
  return result;
});

// Handle requirements check
ipcMain.handle('check-requirements', async () => {
  const result = await checkRequirements();
  return result;
});

// Handle requirements installation
ipcMain.handle('install-requirements', async () => {
  const result = await installRequirements();
  return result;
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
}); 