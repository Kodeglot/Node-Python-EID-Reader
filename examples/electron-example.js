"use strict";
// Example: Using @kodeglot/belgian-eid-reader in an Electron app
// This file demonstrates how to integrate the package with Electron
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const index_js_1 = require("../dist/index.js");
let mainWindow = null;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
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
electron_1.ipcMain.handle('read-eid', async (event, options = {}) => {
    try {
        console.log('Reading eID data...');
        const eidData = await (0, index_js_1.readEidData)(options);
        console.log('eID data read successfully');
        return { success: true, data: eidData };
    }
    catch (error) {
        console.error('Failed to read eID:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
            code: error instanceof index_js_1.EidReaderError ? error.code : 'UNKNOWN_ERROR'
        };
    }
});
// Handle requirements check
electron_1.ipcMain.handle('check-requirements', async () => {
    try {
        const reader = new index_js_1.EidReader();
        const result = await reader.checkRequirements();
        return { success: true, ...result };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
        };
    }
});
// Handle requirements installation
electron_1.ipcMain.handle('install-requirements', async () => {
    try {
        const reader = new index_js_1.EidReader();
        const result = await reader.installRequirements();
        return { success: true, installed: result };
    }
    catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
        };
    }
});
electron_1.app.whenReady().then(createWindow);
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
