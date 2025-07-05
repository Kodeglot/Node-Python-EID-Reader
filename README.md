# Belgian eID Public Data Reader

A cross-platform Node.js app to read Belgian eID card public data using the [eidreader](https://github.com/lino-framework/eidreader) Python package. Works on **macOS**, **Windows**, and **Linux** (with the official Belgian eID middleware).

## Features
- Reads all public data from Belgian eID cards
- Works on macOS, Windows, and Linux
- Uses Python's `eidreader` for robust card access
- Automatic detection of PKCS#11 library path (overridable)
- Clean, focused implementation

## Prerequisites

### 1. Belgian eID Middleware
- **macOS:** [Download & install](https://eid.belgium.be/en)
- **Windows:** [Download & install](https://eid.belgium.be/en)
- **Linux:** Install via your distribution's package manager

### 2. Python 3.x
- Install Python 3.x from [python.org](https://www.python.org/downloads/) or your OS package manager

### 3. Python `eidreader` package
- Install for the Python version you will use:
  ```bash
  python3 -m pip install eidreader
  ```

### 4. Node.js
- Install Node.js (v16+ recommended) from [nodejs.org](https://nodejs.org/)

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/Kodeglot/Node-Python-EID-Reader.git
   cd Node-Python-EID-Reader
   ```
2. Install Node.js dependencies:
   ```bash
   npm install
   ```

## Usage

1. Insert your Belgian eID card into the reader.
2. Run the reader:
   ```bash
   npm start
   ```
   or
   ```bash
   npm run dev
   ```
3. The app will:
   - Detect your OS
   - Set the correct PKCS#11 library path
   - Call the Python `eidreader` and print all public eID data as JSON

## Example Output

```json
{
  "cardNumber": "592843877651",
  "chipNumber": "534c4790810700012b7f1fd412928152",
  "validityDateBegin": "24.07.2018",
  "validityDateEnd": "24.07.2028",
  "municipality": "Gent",
  "nationality": "Belg",
  "birthLocation": "Gent",
  "birthDate": "21 JUN  1996",
  "name": "Olmez",
  "firstName": "Kadir",
  "sex": "M",
  "documentType": "01",
  "address": {
    "streetAndNumber": "Anjelierstraat 41",
    "zip": "9000",
    "municipality": "Gent"
  },
  "photo": "base64-encoded-photo-data"
}
```

## Customization

### Override PKCS#11 Library Path
If your middleware is installed in a non-standard location, set the `PYKCS11LIB` environment variable:

```bash
# Example for custom path
export PYKCS11LIB="/custom/path/to/libbeidpkcs11.dylib"
npm start
```

### Use a Specific Python Interpreter
If you have multiple Python versions, you can set the `PYTHON` environment variable to the path of the desired Python executable.

## Troubleshooting

- **No card detected / empty data:**
  - Ensure the middleware is installed and running
  - Try running from a terminal (not a GUI launcher)
  - Check that your Python environment has `eidreader` installed
  - Try setting `PYKCS11LIB` manually
- **Permission errors on macOS:**
  - Run from Terminal, not from Finder
  - System Integrity Protection (SIP) may block `DYLD_LIBRARY_PATH` for GUI apps
- **Windows path issues:**
  - Make sure the DLL path is correct and quoted if it contains spaces
- **Python not found:**
  - Ensure `python3` is in your PATH, or set the `PYTHON` env variable

## Development

This project uses TypeScript and compiles to JavaScript. To build:

```bash
npm run build
```

## License

MIT 