import { spawn } from 'child_process';
import * as os from 'os';
import { RequirementsChecker } from './requirements-checker';

/**
 * Interface representing Belgian eID card data
 */
export interface EidData {
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

/**
 * Structured result for all API calls
 */
export interface ReaderResult<T> {
  success: boolean;
  info: string[];
  error?: { message: string; code?: string };
  data?: T;
}

export interface EidReaderOptions {
  verbose?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  pythonPath?: string;
  pkcs11LibPath?: string;
}

export class EidReaderError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'EidReaderError';
  }
}

export class EidReader {
  private options: Required<EidReaderOptions>;
  private requirementsChecker: RequirementsChecker;
  private info: string[] = [];

  constructor(options: EidReaderOptions = {}) {
    this.options = {
      verbose: options.verbose ?? false,
      maxRetries: options.maxRetries ?? 3,
      retryDelay: options.retryDelay ?? 300,
      pythonPath: options.pythonPath ?? '',
      pkcs11LibPath: options.pkcs11LibPath ?? ''
    };
    this.requirementsChecker = new RequirementsChecker();
  }

  private addInfo(msg: string) {
    this.info.push(msg);
    if (this.options.verbose) {
      // Optionally log for debugging
      // console.log(msg);
    }
  }

  async checkRequirements(): Promise<ReaderResult<{ passed: boolean; results: any }>> {
    this.info = [];
    try {
      this.addInfo('Checking system requirements...');
      const result = await this.requirementsChecker.checkAllRequirements();
      if (result.passed) {
        this.addInfo('All requirements are met!');
      } else {
        this.addInfo('Some requirements are missing.');
      }
      return { success: result.passed, info: [...this.info], data: result };
    } catch (error) {
      return { success: false, info: [...this.info], error: { message: (error as Error).message } };
    }
  }

  async installRequirements(): Promise<ReaderResult<{ installed: boolean }>> {
    this.info = [];
    try {
      this.addInfo('Checking for missing requirements...');
      const { results } = await this.requirementsChecker.checkAllRequirements();
      const installed = await this.requirementsChecker.installMissingRequirements(results);
      if (installed) {
        this.addInfo('Requirements installed successfully!');
      } else {
        this.addInfo('Some requirements could not be installed automatically.');
      }
      return { success: installed, info: [...this.info], data: { installed } };
    } catch (error) {
      return { success: false, info: [...this.info], error: { message: (error as Error).message } };
    }
  }

  async readEidData(): Promise<ReaderResult<EidData>> {
    this.info = [];
    try {
      this.addInfo('Checking requirements before reading eID data...');
      const reqResult = await this.checkRequirements();
      if (!reqResult.success) {
        return { success: false, info: [...this.info, ...reqResult.info], error: reqResult.error };
      }
      this.addInfo('Requirements OK. Starting eID read...');
      const pythonCmd = await this.findPythonWithEidreader();
      this.addInfo(`Using Python: ${pythonCmd}`);
      const env = this.setupEnvironment();
      this.addInfo(`Environment configured for ${os.platform()}`);
      const output = await this.runEidReader(pythonCmd, env);
      const eidData = this.parseEidreaderOutput(output);
      this.addInfo('Successfully read and parsed eID data.');
      return { success: true, info: [...this.info], data: eidData };
    } catch (error) {
      const err = error instanceof EidReaderError
        ? { message: error.message, code: error.code }
        : { message: (error as Error).message };
      return { success: false, info: [...this.info], error: err };
    }
  }

  private async findPythonWithEidreader(): Promise<string> {
    if (this.options.pythonPath) {
      const isValid = await this.tryPythonCommand(this.options.pythonPath);
      if (isValid) return this.options.pythonPath;
      throw new EidReaderError(`Invalid Python path: ${this.options.pythonPath}`);
    }
    const candidates = os.platform() === 'win32' 
      ? ['python', 'python3'] 
      : ['/usr/bin/python3', '/opt/homebrew/bin/python3', 'python3', 'python'];
    for (const cmd of candidates) {
      const found = await this.tryPythonCommand(cmd);
      if (found) return found;
    }
    throw new EidReaderError(
      'Could not find a Python interpreter with eidreader installed. Please install Python 3.x and eidreader package.',
      'PYTHON_NOT_FOUND'
    );
  }

  private async tryPythonCommand(pythonCmd: string): Promise<string | null> {
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

  private setupEnvironment(): NodeJS.ProcessEnv {
    const env = { ...process.env };
    if (os.platform() === 'darwin') {
      const libraryPaths = [
        '/Library/Belgium Identity Card/Pkcs11',
        '/Library/Belgium Identity Card/Pkcs11/beid-pkcs11.bundle/Contents/MacOS',
        '/usr/local/lib',
        '/usr/lib'
      ];
      const existingPath = env.DYLD_LIBRARY_PATH || '';
      env.DYLD_LIBRARY_PATH = [...libraryPaths, existingPath].filter(Boolean).join(':');
    }
    if (this.options.pkcs11LibPath) {
      env.PYKCS11LIB = this.options.pkcs11LibPath;
    } else if (process.env.PYKCS11LIB) {
      env.PYKCS11LIB = process.env.PYKCS11LIB;
    } else if (os.platform() === 'darwin') {
      env.PYKCS11LIB = '/Library/Belgium Identity Card/Pkcs11/libbeidpkcs11.dylib';
    } else if (os.platform() === 'win32') {
      env.PYKCS11LIB = 'C:\\Program Files\\Belgium Identity Card\\pkcs11\\beidpkcs11.dll';
    } else if (os.platform() === 'linux') {
      env.PYKCS11LIB = 'libbeidpkcs11.so.0';
    }
    return env;
  }

  private async runEidReader(pythonCmd: string, env: NodeJS.ProcessEnv): Promise<string> {
    for (let attempt = 1; attempt <= this.options.maxRetries; attempt++) {
      try {
        this.addInfo(`Running eID reader (attempt ${attempt}/${this.options.maxRetries})...`);
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
              resolve(stdout);
            } else {
              reject(new EidReaderError(`eidreader failed with code ${code}: ${stderr}`, 'EIDREADER_FAILED'));
            }
          });
          eidReader.on('error', (error) => {
            reject(new EidReaderError(`Failed to start eidreader: ${error.message}`, 'SPAWN_ERROR'));
          });
        });
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('CKR_DEVICE_ERROR') && attempt < this.options.maxRetries) {
          this.addInfo(`Device error detected, retrying in ${this.options.retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, this.options.retryDelay));
          continue;
        }
        throw error;
      }
    }
    throw new EidReaderError('Max retries exceeded', 'MAX_RETRIES_EXCEEDED');
  }

  private parseEidreaderOutput(output: string): EidData {
    const jsonLine = output.split('\n').find(line => line.trim().startsWith('{'));
    if (!jsonLine) {
      throw new EidReaderError('No JSON output from eidreader', 'INVALID_OUTPUT');
    }
    try {
      const data = JSON.parse(jsonLine);
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
    } catch (error) {
      throw new EidReaderError(`Failed to parse eID data: ${error instanceof Error ? error.message : String(error)}`, 'PARSE_ERROR');
    }
  }
}

export async function readEidData(options?: EidReaderOptions): Promise<ReaderResult<EidData>> {
  const reader = new EidReader(options);
  return await reader.readEidData();
}

export async function checkRequirements(): Promise<ReaderResult<{ passed: boolean; results: any }>> {
  const reader = new EidReader();
  return await reader.checkRequirements();
}

export async function installRequirements(): Promise<ReaderResult<{ installed: boolean }>> {
  const reader = new EidReader();
  return await reader.installRequirements();
}

export type { RequirementsChecker } from './requirements-checker'; 