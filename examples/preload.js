"use strict";
// Preload script for Electron example
// Safely exposes APIs to the renderer process
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
electron_1.contextBridge.exposeInMainWorld('eidAPI', {
    // Read eID data
    readEidData: (options = {}) => electron_1.ipcRenderer.invoke('read-eid', options),
    // Check requirements
    checkRequirements: () => electron_1.ipcRenderer.invoke('check-requirements'),
    // Install requirements
    installRequirements: () => electron_1.ipcRenderer.invoke('install-requirements')
});
