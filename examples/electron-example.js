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
electron_1.ipcMain.handle('read-eid', async (_event, options = {}) => {
    const result = await (0, index_js_1.readEidData)(options);
    return result;
});
// Handle requirements check
electron_1.ipcMain.handle('check-requirements', async () => {
    const result = await (0, index_js_1.checkRequirements)();
    return result;
});
// Handle requirements installation
electron_1.ipcMain.handle('install-requirements', async () => {
    const result = await (0, index_js_1.installRequirements)();
    return result;
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
