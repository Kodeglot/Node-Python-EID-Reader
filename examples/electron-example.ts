// Example: Using @kodeglot/node-python-eid-reader in an Electron app
// This file demonstrates how to integrate the package with Electron

import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent } from 'electron';
import { readEidData, EidReader, EidReaderError, EidReaderOptions, checkRequirements, installRequirements, ReaderResult, EidData } from '@kodeglot/node-python-eid-reader';
import * as path from 'path';

let mainWindow: BrowserWindow | null = null;
let eidReaderEnabled = true; // Default to enabled

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile(path.resolve(__dirname, '../../../examples/index.html'));
}

// Handle eID reading from renderer process
ipcMain.handle('read-eid', async (_event: IpcMainInvokeEvent, options: EidReaderOptions = {}) => {
  if (!eidReaderEnabled) {
    return {
      success: false,
      error: 'eID reader is disabled',
      code: 'DISABLED'
    };
  }

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

// Handle enable/disable eID reader
ipcMain.handle('set-eid-enabled', async (_event: IpcMainInvokeEvent, enabled: boolean) => {
  eidReaderEnabled = enabled;
  return { success: true, enabled: eidReaderEnabled };
});

// Handle get eID reader status
ipcMain.handle('get-eid-status', async () => {
  return { success: true, enabled: eidReaderEnabled };
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