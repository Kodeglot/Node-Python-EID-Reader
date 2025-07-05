import { spawn } from 'child_process';
import * as os from 'os';

interface EidData {
  cardNumber: string;
  chipNumber: string;
  validityDateBegin: string;
  validityDateEnd: string;
  municipality: string;
  nationality: string;
  birthLocation: string;
  birthDate: string;
  name: string;
  firstName: string;
  sex: string;
  documentType: string;
  address: {
    streetAndNumber: string;
    zip: string;
    municipality: string;
  };
  photo: string;
}

function tryPythonCommand(pythonCmd: string): Promise<string | null> {
  return new Promise((resolve) => {
    const proc = spawn(pythonCmd, ['-m', 'eidreader', '--help']);
    let output = '';
    let error = '';
    proc.stdout.on('data', (data) => (output += data.toString()));
    proc.stderr.on('data', (data) => (error += data.toString()));
    proc.on('close', (code) => {
      if (code === 0 && output.includes('eidreader')) {
        resolve(pythonCmd);
      } else {
        resolve(null);
      }
    });
    proc.on('error', () => resolve(null));
  });
}

async function findPythonWithEidreader(): Promise<string> {
  // Try specific Python paths first, then fallback to PATH
  const candidates = os.platform() === 'win32' 
    ? ['python', 'python3'] 
    : ['/usr/bin/python3', '/opt/homebrew/bin/python3', 'python3', 'python'];
  
  for (const cmd of candidates) {
    const found = await tryPythonCommand(cmd);
    if (found) return found;
  }
  throw new Error(
    'Could not find a Python interpreter with eidreader installed.\n' +
      'Please install Python 3.x and eidreader:\n' +
      '  pip install eidreader\n' +
      'and ensure it is available in your PATH.'
  );
}

async function runEidReader(): Promise<string> {
  const pythonCmd = await findPythonWithEidreader();
  console.log(`🔍 Using Python: ${pythonCmd}`);

  // Set DYLD_LIBRARY_PATH on macOS for Belgian eID middleware
  const env = { ...process.env };
  if (os.platform() === 'darwin') {
    // Set multiple possible library paths for the Belgian eID middleware
    const libraryPaths = [
      '/Library/Belgium Identity Card/Pkcs11',
      '/Library/Belgium Identity Card/Pkcs11/beid-pkcs11.bundle/Contents/MacOS',
      '/usr/local/lib',
      '/usr/lib'
    ];
    
    const existingPath = env.DYLD_LIBRARY_PATH || '';
    env.DYLD_LIBRARY_PATH = [...libraryPaths, existingPath].filter(Boolean).join(':');
    console.log(`🔧 Set DYLD_LIBRARY_PATH: ${env.DYLD_LIBRARY_PATH}`);
  }

  // Add retry logic for device errors
  const maxRetries = 3;
  const retryDelay = 1000; // 1 second

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔍 Running Python eidreader script (attempt ${attempt}/${maxRetries})...`);
      
      const result = await new Promise<string>((resolve, reject) => {
        const eidReader = spawn(pythonCmd, ['-m', 'eidreader'], {
          stdio: ['pipe', 'pipe', 'pipe'],
          env,
        });
        let stdout = '';
        let stderr = '';
        eidReader.stdout.on('data', (data) => {
          stdout += data.toString();
        });
        eidReader.stderr.on('data', (data) => {
          stderr += data.toString();
        });
        eidReader.on('close', (code) => {
          if (code === 0) {
            console.log('✅ Python eidreader completed successfully');
            resolve(stdout);
          } else {
            console.error('❌ Python eidreader failed with code:', code);
            console.error('Error output:', stderr);
            reject(new Error(`eidreader failed with code ${code}: ${stderr}`));
          }
        });
        eidReader.on('error', (error) => {
          console.error('❌ Failed to start eidreader:', error);
          reject(error);
        });
      });

      return result;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // If it's a device error and we have retries left, wait and try again
      if (errorMessage.includes('CKR_DEVICE_ERROR') && attempt < maxRetries) {
        console.log(`⚠️  Device error detected, retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }
      
      // If it's the last attempt or a different error, throw
      throw error;
    }
  }

  throw new Error('Max retries exceeded');
}

function parseEidreaderOutput(output: string): EidData {
  // Split output into lines and find the first line that looks like JSON
  const jsonLine = output.split('\n').find(line => line.trim().startsWith('{'));
  if (!jsonLine) throw new Error('No JSON output from eidreader');
  const data = JSON.parse(jsonLine);

  // Map the fields from the eidreader output to your EidData structure
  return {
    cardNumber: data.card_number || "",
    chipNumber: data.chip_number || "",
    validityDateBegin: data.validity_begin_date || "",
    validityDateEnd: data.validity_end_date || "",
    municipality: data.issuing_municipality || "",
    nationality: data.nationality || "",
    birthLocation: data.location_of_birth || "",
    birthDate: data.date_of_birth || "",
    name: data.surname || "",
    firstName: data.firstnames || "",
    sex: data.gender || "",
    documentType: data.document_type || "",
    address: {
      streetAndNumber: data.address_street_and_number || "",
      zip: data.address_zip || "",
      municipality: data.address_municipality || ""
    },
    photo: data.PHOTO_FILE || ""
  };
}

async function readEidData(): Promise<EidData> {
  console.log('🚀 Reading Belgian eID data using Python eidreader...\n');

  // Detect Python interpreter
  const pythonPath = await findPythonWithEidreader();
  console.log(`🔍 Using Python: ${pythonPath}`);

  // Set environment variables for macOS
  const env = { ...process.env };
  
  // Set DYLD_LIBRARY_PATH for macOS
  const middlewarePaths = [
    '/Library/Belgium Identity Card/Pkcs11',
    '/Library/Belgium Identity Card/Pkcs11/beid-pkcs11.bundle/Contents/MacOS',
    '/usr/local/lib',
    '/usr/lib'
  ];
  
  const dyldLibraryPath = middlewarePaths.join(':');
  env.DYLD_LIBRARY_PATH = dyldLibraryPath;
  console.log(`🔧 Set DYLD_LIBRARY_PATH: ${dyldLibraryPath}`);

  // Set PKCS#11 library path cross-platform
  let pkcs11Path = '';
  if (process.env.PYKCS11LIB) {
    pkcs11Path = process.env.PYKCS11LIB;
  } else if (process.platform === 'darwin') {
    pkcs11Path = '/Library/Belgium Identity Card/Pkcs11/libbeidpkcs11.dylib';
  } else if (process.platform === 'win32') {
    pkcs11Path = 'C:\\Program Files\\Belgium Identity Card\\pkcs11\\beidpkcs11.dll';
  } else if (process.platform === 'linux') {
    pkcs11Path = 'libbeidpkcs11.so.0';
  }
  env.PYKCS11LIB = pkcs11Path;
  console.log(`🔧 Set PYKCS11LIB: ${env.PYKCS11LIB}`);

  // Debug: Print all environment variables
  console.log('\n🔍 Environment variables in Node.js:');
  console.log('DYLD_LIBRARY_PATH:', env.DYLD_LIBRARY_PATH);
  console.log('PATH:', env.PATH);
  console.log('PYTHONPATH:', env.PYTHONPATH);
  console.log('PYKCS11LIB:', env.PYKCS11LIB);
  console.log('HOME:', env.HOME);
  console.log('USER:', env.USER);
  console.log('SHELL:', env.SHELL);
  console.log('TERM:', env.TERM);
  console.log('TMPDIR:', env.TMPDIR);
  console.log('LANG:', env.LANG);
  console.log('LC_ALL:', env.LC_ALL);
  console.log('');

  try {
    const output = await runEidReader();
    console.log('✅ Python eidreader completed successfully');
    
    // Debug: Show raw output
    console.log('🔍 Raw Python output:');
    console.log(output);
    console.log('');
    
    console.log('🔍 Parsing eidreader output...');
    const eidData = parseEidreaderOutput(output);
    console.log('✅ Successfully parsed eidreader output');
    return eidData;
  } catch (error) {
    console.error('❌ Error reading eID data:', error);
    throw error;
  }
}

async function main() {
  try {
    const eidData = await readEidData();
    console.log('\n--- Public eID Data ---');
    console.log(JSON.stringify(eidData, null, 2));
    if (eidData.photo) {
      console.log('\n📸 Photo data is base64-encoded.');
    }
    console.log('\n🎉 Successfully read real eID data using Python eidreader!');
  } catch (error) {
    console.error('❌ Failed to read eID data:', error);
    if (error instanceof Error && error.message.includes('ENOENT')) {
      console.log('\n💡 Python eidreader is not installed. Please:');
      console.log('   1. Install Python 3.x');
      console.log('   2. Install eidreader: pip install eidreader');
      console.log('   3. Ensure Belgian eID middleware is installed');
      console.log('   4. Insert your eID card');
    }
    process.exit(1);
  }
}

// Main execution
if (require.main === module) {
  main().catch(console.error);
}

export { readEidData, EidData }; 