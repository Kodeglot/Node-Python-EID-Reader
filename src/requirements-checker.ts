import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import * as sudoPrompt from 'sudo-prompt';

const execAsync = promisify(exec);

interface RequirementCheck {
  name: string;
  checkCommand: string;
  installCommand: string;
  description: string;
  isOptional?: boolean;
}

function getPlatformRequirements(): RequirementCheck[] {
  const platform = process.platform;
  if (platform === 'darwin') {
    return [
      {
        name: 'Python 3.x',
        checkCommand: 'python3 --version',
        installCommand: 'brew install python3',
        description: 'Python 3.x is required to run the eidreader package'
      },
      {
        name: 'eidreader Python package',
        checkCommand: 'python3 -c "import eidreader; print(eidreader.__version__)"',
        installCommand: 'python3 -m pip install eidreader',
        description: 'The eidreader package is required to read Belgian eID cards'
      },
      {
        name: 'Belgian eID Middleware',
        checkCommand:
          'ls "/Library/Belgium Identity Card/Pkcs11/libbeidpkcs11.dylib" 2>/dev/null || ' +
          'ls "/Library/Belgium Identity Card/Pkcs11/beid-pkcs11.bundle/Contents/MacOS/libbeidpkcs11.dylib" 2>/dev/null || ' +
          'ls "/usr/local/lib/libbeidpkcs11.dylib" 2>/dev/null',
        installCommand: 'echo "Please install Belgian eID middleware from https://eid.belgium.be/en"',
        description: 'Belgian eID middleware is required for card communication',
        isOptional: false
      }
    ];
  } else if (platform === 'win32') {
    return [
      {
        name: 'Python 3.x',
        checkCommand: 'python --version || python3 --version',
        installCommand: 'Download from https://www.python.org/downloads/',
        description: 'Python 3.x is required to run the eidreader package'
      },
      {
        name: 'eidreader Python package',
        checkCommand: 'python -c "import eidreader; print(eidreader.__version__)" || python3 -c "import eidreader; print(eidreader.__version__)"',
        installCommand: 'python -m pip install eidreader',
        description: 'The eidreader package is required to read Belgian eID cards'
      },
      {
        name: 'Belgian eID Middleware',
        checkCommand:
          'if exist "C:\\Program Files\\Belgium Identity Card\\pkcs11\\beidpkcs11.dll" (exit 0) else if exist "C:\\Program Files (x86)\\Belgium Identity Card\\pkcs11\\beidpkcs11.dll" (exit 0) else (exit 1)',
        installCommand: 'echo "Please install Belgian eID middleware from https://eid.belgium.be/en"',
        description: 'Belgian eID middleware is required for card communication',
        isOptional: false
      }
    ];
  } else if (platform === 'linux') {
    return [
      {
        name: 'Python 3.x',
        checkCommand: 'python3 --version',
        installCommand: 'sudo apt-get install python3 python3-pip',
        description: 'Python 3.x is required to run the eidreader package'
      },
      {
        name: 'eidreader Python package',
        checkCommand: 'python3 -c "import eidreader; print(eidreader.__version__)"',
        installCommand: 'python3 -m pip install eidreader',
        description: 'The eidreader package is required to read Belgian eID cards'
      },
      {
        name: 'Belgian eID Middleware',
        checkCommand: 'which beidpkcs11.so.0 2>/dev/null || ls /usr/lib/libbeidpkcs11.so.0 2>/dev/null',
        installCommand: 'sudo apt-get install beidpkcs11',
        description: 'Belgian eID middleware is required for card communication',
        isOptional: false
      }
    ];
  } else {
    // Fallback for unknown platforms
    return [
      {
        name: 'Python 3.x',
        checkCommand: 'python3 --version',
        installCommand: 'See your OS documentation',
        description: 'Python 3.x is required to run the eidreader package'
      },
      {
        name: 'eidreader Python package',
        checkCommand: 'python3 -c "import eidreader; print(eidreader.__version__)"',
        installCommand: 'python3 -m pip install eidreader',
        description: 'The eidreader package is required to read Belgian eID cards'
      },
      {
        name: 'Belgian eID Middleware',
        checkCommand: 'echo "Please manually check for Belgian eID middleware"',
        installCommand: 'See https://eid.belgium.be/en',
        description: 'Belgian eID middleware is required for card communication',
        isOptional: false
      }
    ];
  }
}

export class RequirementsChecker {
  private requirements: RequirementCheck[];

  constructor() {
    this.requirements = getPlatformRequirements();
  }

  async checkAllRequirements(): Promise<{ passed: boolean; results: any[] }> {
    console.log('🔍 Checking system requirements...\n');
    const results = [];
    let allPassed = true;
    for (const req of this.requirements) {
      const result = await this.checkRequirement(req);
      results.push(result);
      if (!result.available && !req.isOptional) {
        allPassed = false;
      }
    }
    return { passed: allPassed, results };
  }

  private async checkRequirement(req: RequirementCheck): Promise<any> {
    try {
      await execAsync(req.checkCommand);
      console.log(`✅ ${req.name} - Available`);
      return { name: req.name, available: true, error: null };
    } catch (error) {
      console.log(`❌ ${req.name} - Not found`);
      console.log(`   ${req.description}`);
      if (!req.isOptional) {
        console.log(`   💡 To install: ${req.installCommand}\n`);
      }
      return { 
        name: req.name, 
        available: false, 
        error: error instanceof Error ? error.message : String(error), 
        installCommand: req.installCommand 
      };
    }
  }

  private async runWithSudo(command: string): Promise<void> {
    return new Promise((resolve, reject) => {
      sudoPrompt.exec(command, { name: 'Node-Python-EID-Reader' }, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  async installMissingRequirements(results: any[]): Promise<boolean> {
    const missing = results.filter(r => !r.available && !r.isOptional);
    if (missing.length === 0) {
      console.log('✅ All required dependencies are available!');
      return true;
    }
    console.log(`\n🔧 Found ${missing.length} missing required dependency(ies):`);
    missing.forEach(r => console.log(`   - ${r.name}`));
    console.log('\n📋 Installation instructions:');
    console.log('1. Belgian eID Middleware: Download from https://eid.belgium.be/en');
    console.log('2. Python 3.x: Install from https://python.org/downloads/');
    console.log('3. eidreader package: Run "python3 -m pip install eidreader"');
    // Try to auto-install Python packages
    const pythonPackageMissing = missing.find(r => r.name === 'eidreader Python package');
    if (pythonPackageMissing) {
      console.log('\n🚀 Attempting to install eidreader package automatically...');
      try {
        await this.installEidreader();
        console.log('✅ eidreader package installed successfully!');
        return true;
      } catch (error) {
        console.log('❌ Failed to install eidreader automatically. Please install manually.');
        return false;
      }
    }
    // Try to auto-install system-level requirements if possible
    for (const req of missing) {
      if (req.installCommand.startsWith('sudo')) {
        console.log(`\n🔑 ${req.name} requires elevated privileges. Prompting for password...`);
        try {
          await this.runWithSudo(req.installCommand);
          console.log(`✅ ${req.name} installed successfully!`);
        } catch (error) {
          console.log(`❌ Failed to install ${req.name} with sudo. Please install manually.`);
          return false;
        }
      }
    }
    return false;
  }

  private async installEidreader(): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn('python3', ['-m', 'pip', 'install', 'eidreader'], {
        stdio: 'inherit'
      });
      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Installation failed with code ${code}`));
        }
      });
      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  async checkPythonVersion(): Promise<{ version: string; major: number; minor: number } | null> {
    try {
      const { stdout } = await execAsync('python3 --version');
      const match = stdout.match(/Python (\d+)\.(\d+)\.(\d+)/);
      if (match) {
        const major = parseInt(match[1]);
        const minor = parseInt(match[2]);
        return {
          version: stdout.trim(),
          major,
          minor
        };
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async checkEidreaderVersion(): Promise<string | null> {
    try {
      const { stdout } = await execAsync('python3 -c "import eidreader; print(eidreader.__version__)"');
      return stdout.trim();
    } catch (error) {
      return null;
    }
  }

  getPlatformSpecificInstallCommands(): { [key: string]: string } {
    const platform = process.platform;
    if (platform === 'darwin') {
      return {
        python: 'brew install python3',
        eidreader: 'python3 -m pip install eidreader',
        middleware: 'Download from https://eid.belgium.be/en'
      };
    } else if (platform === 'win32') {
      return {
        python: 'Download from https://python.org/downloads/',
        eidreader: 'python -m pip install eidreader',
        middleware: 'Download from https://eid.belgium.be/en'
      };
    } else if (platform === 'linux') {
      return {
        python: 'sudo apt-get install python3 python3-pip',
        eidreader: 'python3 -m pip install eidreader',
        middleware: 'sudo apt-get install beidpkcs11'
      };
    }
    return {};
  }
} 