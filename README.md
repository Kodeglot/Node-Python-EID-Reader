# Belgian eID Reader

[![npm version](https://img.shields.io/npm/v/@kodeglot/node-python-eid-reader.svg?logo=npm)](https://www.npmjs.com/package/@kodeglot/node-python-eid-reader)

A cross-platform Node.js package to read Belgian eID card public data using Python eidreader with automatic dependency checking. Perfect for Electron apps and Node.js applications.

## Features

- 🔍 **Cross-platform support**: macOS, Windows, and Linux
- 🐍 **Python integration**: Uses the reliable eidreader Python package
- 🔧 **Automatic setup**: Checks and installs missing dependencies
- 🛡️ **Error handling**: Comprehensive error handling with specific error codes
- ⚡ **Configurable**: Customizable retry logic and paths
- 📦 **npm package**: Easy to install and use in any Node.js project
- 🖥️ **Electron ready**: Works seamlessly in Electron applications

## Installation

```bash
npm install @kodeglot/node-python-eid-reader
```

## Prerequisites

Before using this package, you need to install:

1. **Python 3.x** - [Download from python.org](https://www.python.org/downloads/)
2. **Belgian eID middleware** - [Download from Belgian government](https://eid.belgium.be/en/using-your-eid/installing-eid-software)
3. **eidreader Python package** - Will be installed automatically

## Quick Start

### Basic Usage

```javascript
import { readEidData } from '@kodeglot/node-python-eid-reader';

try {
  const eidData = await readEidData();
  console.log('Card holder:', eidData.firstName, eidData.name);
  console.log('Card number:', eidData.cardNumber);
} catch (error) {
  console.error('Failed to read eID:', error.message);
}
```

### Advanced Usage with Options

```javascript
import { EidReader } from '@kodeglot/node-python-eid-reader';

const reader = new EidReader({
  verbose: true,           // Enable detailed logging
  maxRetries: 5,          // Custom retry attempts
  retryDelay: 500,        // Custom retry delay (ms)
  pythonPath: '/usr/bin/python3',  // Custom Python path
  pkcs11LibPath: '/custom/path/libbeidpkcs11.dylib'  // Custom PKCS#11 library
});

try {
  const eidData = await reader.readEidData();
  console.log('Success:', eidData);
} catch (error) {
  console.error('Error:', error.message, error.code);
}
```

### Requirements Management

```javascript
import { checkRequirements, installRequirements } from '@kodeglot/node-python-eid-reader';

// Check if all requirements are met
const result = await checkRequirements();
// NOTE: In Electron/Node.js integration, check result.data.passed, not result.passed
if (result.data && result.data.passed) {
  console.log('All requirements are met!');
} else {
  console.log('Missing requirements:', result.data?.results);
  // Attempt to install missing requirements
  const installResult = await installRequirements();
  if (installResult.success) {
    if (installResult.data && installResult.data.installed) {
      console.log('Requirements installed successfully!');
    } else {
      console.log('All requirements are already available!');
    }
  } else {
    console.log('Failed to install requirements:', installResult.info);
    if (installResult.error) {
      console.log('Error:', installResult.error.message);
    }
  }
}
```

## API Reference

### `readEidData(options?)`

Convenience function to read eID data with default options.

**Parameters:**
- `options` (optional): `EidReaderOptions` - Configuration options

**Returns:** `Promise<EidData>` - The eID card data

### `EidReader` Class

Main class for reading eID data with full control over options.

#### Constructor

```javascript
new EidReader(options?: EidReaderOptions)
```

**Options:**
- `verbose?: boolean` - Enable verbose logging (default: false)
- `maxRetries?: number` - Maximum retry attempts (default: 3)
- `retryDelay?: number` - Delay between retries in ms (default: 300)
- `pythonPath?: string` - Custom Python interpreter path
- `pkcs11LibPath?: string` - Custom PKCS#11 library path

#### Methods

- `readEidData(): Promise<EidData>` - Read eID data from the card
- `checkRequirements(): Promise<{passed: boolean, results: any}>` - Check if requirements are met
- `installRequirements(): Promise<ReaderResult<{installed: boolean}>>` - Install missing requirements

### `EidData` Interface

```typescript
interface EidData {
  cardNumber: string;           // Card number (unique identifier)
  chipNumber: string;           // Chip number
  validityDateBegin: string;    // Card validity start date
  validityDateEnd: string;      // Card validity end date
  municipality: string;         // Issuing municipality
  nationality: string;          // Nationality
  birthLocation: string;        // Birth location
  birthDate: string;            // Birth date
  name: string;                 // Last name
  firstName: string;            // First name(s)
  sex: string;                  // Gender
  documentType: string;         // Document type
  address: {
    streetAndNumber: string;    // Street and number
    zip: string;                // ZIP code
    municipality: string;       // Municipality
  };
  photo: string;                // Base64 encoded photo
}
```

### `EidReaderError` Class

Custom error class with error codes for better error handling.

**Error Codes:**
- `REQUIREMENTS_NOT_MET` - Missing dependencies
- `PYTHON_NOT_FOUND` - Python interpreter not found
- `EIDREADER_FAILED` - Python eidreader script failed
- `SPAWN_ERROR` - Failed to start Python process
- `MAX_RETRIES_EXCEEDED` - Max retry attempts exceeded
- `INVALID_OUTPUT` - Invalid output from eidreader
- `PARSE_ERROR` - Failed to parse eID data

## Electron Integration

This package works seamlessly in Electron applications with built-in enable/disable functionality. Here's an example:

```javascript
// main.js (Electron main process)
import { readEidData } from '@kodeglot/node-python-eid-reader';

let eidReaderEnabled = true; // Default to enabled

// Handle eID reading with enable/disable check
ipcMain.handle('read-eid', async (event) => {
  if (!eidReaderEnabled) {
    return { success: false, error: 'eID reader is disabled', code: 'DISABLED' };
  }
  
  try {
    const eidData = await readEidData({ verbose: true });
    return { success: true, data: eidData };
  } catch (error) {
    return { success: false, error: error.message, code: error.code };
  }
});

// Handle enable/disable eID reader
ipcMain.handle('set-eid-enabled', async (event, enabled) => {
  eidReaderEnabled = enabled;
  return { success: true, enabled: eidReaderEnabled };
});

// Handle get eID reader status
ipcMain.handle('get-eid-status', async () => {
  return { success: true, enabled: eidReaderEnabled };
});
```

```javascript
// renderer.js (Electron renderer process)
const { ipcRenderer } = require('electron');

async function readEID() {
  try {
    const result = await ipcRenderer.invoke('read-eid');
    if (result.success) {
      console.log('eID data:', result.data);
    } else if (result.code === 'DISABLED') {
      console.log('eID reader is disabled');
    } else {
      console.error('Failed:', result.error);
    }
  } catch (error) {
    console.error('IPC error:', error);
  }
}

async function toggleEidReader(enabled) {
  try {
    const result = await ipcRenderer.invoke('set-eid-enabled', enabled);
    if (result.success) {
      console.log(`eID reader ${enabled ? 'enabled' : 'disabled'}`);
    }
  } catch (error) {
    console.error('Toggle error:', error);
  }
}

async function getEidStatus() {
  try {
    const result = await ipcRenderer.invoke('get-eid-status');
    if (result.success) {
      console.log(`eID reader is ${result.enabled ? 'enabled' : 'disabled'}`);
    }
  } catch (error) {
    console.error('Status error:', error);
  }
}
```

### Enable/Disable Features

The Electron integration includes:

- **Toggle Switch**: Visual toggle to enable/disable the eID reader
- **Status Indicator**: Shows current enabled/disabled state
- **Automatic Blocking**: Reading operations are blocked when disabled
- **State Persistence**: Status is maintained during the app session
- **Error Handling**: Proper error codes for disabled state

### Robust Requirements Check in Electron UI

- The requirements check result is an object with a `data` property.
- To check if all requirements are met, use `result.data.passed` in your UI code.
- Example:

```js
if (result.success) {
  if (result.data && result.data.passed) {
    // All requirements are met
  } else {
    // Some requirements are missing
  }
}
```

- This ensures your UI accurately reflects the backend requirements check result.

### Improved Requirements Installation

The `installRequirements()` function now provides better feedback:

- **All requirements available**: Returns success with "All requirements are already available!"
- **Requirements installed**: Returns success with "Requirements installed successfully!"
- **Installation failed**: Returns failure with detailed info and error messages

Example handling in your UI:

```js
const result = await installRequirements();
if (result.success) {
  if (result.data && result.data.installed) {
    console.log('Requirements installed successfully!');
  } else {
    console.log('All requirements are already available!');
  }
} else {
  console.log('Failed to install requirements:', result.info);
  if (result.error) {
    console.log('Error:', result.error.message);
  }
}
```

## Examples

The package includes TypeScript examples demonstrating different usage patterns:

### Node.js Example
```bash
npm run example:node
```

### Electron Example
```bash
npm run example:electron
```

The examples are written in TypeScript and show:
- Basic usage with the convenience function
- Advanced usage with the `EidReader` class
- Error handling and requirements management
- Electron integration with IPC handlers



## Troubleshooting

### Common Issues

1. **"Python not found"**
   - Ensure Python 3.x is installed and in your PATH
   - Use the `pythonPath` option to specify a custom Python path

2. **"eidreader not found"**
   - The package will attempt to install it automatically
   - Manual installation: `pip install eidreader`

3. **"Middleware not properly installed"**
   - Install Belgian eID middleware from [eid.belgium.be](https://eid.belgium.be)
   - On macOS, ensure the middleware is in `/Library/Belgium Identity Card/`
   - On Windows, ensure the middleware is in `C:\Program Files\Belgium Identity Card\` or `C:\Program Files (x86)\Belgium Identity Card\`

4. **"Device error"**
   - Ensure the eID card is properly inserted
   - Try removing and reinserting the card
   - Check if the card reader is working

5. **"Permission denied"**
   - On macOS/Linux, you may need to run with sudo for middleware access
   - The package will prompt for password when needed

### Debug Mode

Enable verbose logging to see detailed information:

```javascript
const reader = new EidReader({ verbose: true });
const eidData = await reader.readEidData();
```

### Environment Variables

You can set these environment variables to customize behavior:

- `PYKCS11LIB` - Path to PKCS#11 library
- `DYLD_LIBRARY_PATH` - Library path (macOS)
- `PYTHONPATH` - Python module search path

## Platform-Specific Notes

### macOS
- Middleware typically installed in `/Library/Belgium Identity Card/`
- May require sudo for first-time access
- DYLD_LIBRARY_PATH is automatically configured

### Windows
- Middleware typically installed in `C:\Program Files\Belgium Identity Card\`
- Ensure the middleware is properly registered
- May require running as administrator

### Linux
- Middleware typically installed in `/usr/lib/`
- May need to install additional packages: `sudo apt-get install libbeidpkcs11-0`

## Development

```bash
# Clone the repository
git clone https://github.com/Kodeglot/Node-Python-EID-Reader.git
cd Node-Python-EID-Reader

# Install dependencies
npm install

# Build the package
npm run build

# Run tests
npm start

# Check requirements
npm run check

# Run examples
npm run example:node
npm run example:electron
```

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you encounter any issues:

1. Check the [troubleshooting section](#troubleshooting)
2. Search existing [issues](https://github.com/Kodeglot/Node-Python-EID-Reader/issues)
3. Create a new issue with detailed information about your problem

## Changelog

### 1.0.0
- Initial release
- Cross-platform support
- Automatic dependency checking
- Electron integration
- Comprehensive error handling 