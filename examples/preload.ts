// Preload script for Electron example
// Safely exposes APIs to the renderer process

import { contextBridge, ipcRenderer } from 'electron';
import type { EidReaderOptions, EidData } from '@kodeglot/node-python-eid-reader';

// Define the API interface for the renderer process
interface EidAPI {
  readEidData: (options?: EidReaderOptions) => Promise<{
    success: boolean;
    data?: EidData;
    error?: string;
    code?: string;
  }>;
  checkRequirements: () => Promise<{
    success: boolean;
    passed?: boolean;
    results?: any;
    error?: string;
  }>;
  installRequirements: () => Promise<{
    success: boolean;
    installed?: boolean;
    error?: string;
  }>;
  setEidEnabled: (enabled: boolean) => Promise<{
    success: boolean;
    enabled?: boolean;
    error?: string;
  }>;
  getEidStatus: () => Promise<{
    success: boolean;
    enabled?: boolean;
    error?: string;
  }>;
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('eidAPI', {
  // Read eID data
  readEidData: (options: EidReaderOptions = {}) => ipcRenderer.invoke('read-eid', options),
  
  // Check requirements
  checkRequirements: () => ipcRenderer.invoke('check-requirements'),
  
  // Install requirements
  installRequirements: () => ipcRenderer.invoke('install-requirements'),
  
  // Enable/disable eID reader
  setEidEnabled: (enabled: boolean) => ipcRenderer.invoke('set-eid-enabled', enabled),
  
  // Get eID reader status
  getEidStatus: () => ipcRenderer.invoke('get-eid-status')
} as EidAPI);

// Extend the global Window interface
declare global {
  interface Window {
    eidAPI: EidAPI;
  }
} 