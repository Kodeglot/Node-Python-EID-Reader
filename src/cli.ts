#!/usr/bin/env node

import { EidReader, EidReaderError } from './index';

async function main() {
  try {
    console.log('🚀 Belgian eID Reader CLI\n');

    // Check requirements first
    const reader = new EidReader({ verbose: true });
    const { passed, results } = await reader.checkRequirements();
    
    if (!passed) {
      console.log('\n⚠️  Some requirements are missing. Attempting to install...\n');
      const installed = await reader.installRequirements();
      
      if (!installed) {
        console.log('\n❌ Please install the missing requirements and try again.');
        console.log('📖 See README.md for detailed installation instructions.');
        process.exit(1);
      }
      
      // Re-check after installation
      const { passed: recheckPassed } = await reader.checkRequirements();
      if (!recheckPassed) {
        console.log('\n❌ Some requirements are still missing after installation attempt.');
        process.exit(1);
      }
    }

    console.log('\n🚀 Starting eID reader...\n');
    const eidData = await reader.readEidData();
    console.log('\n--- Public eID Data ---');
    console.log(JSON.stringify(eidData, null, 2));
    console.log('\n📸 Photo data is base64-encoded.');
    console.log('\n🎉 Successfully read real eID data using Python eidreader!');
  } catch (error) {
    if (error instanceof EidReaderError) {
      console.error(`❌ eID Reader Error (${error.code}): ${error.message}`);
    } else {
      console.error('❌ Failed to read eID data:', error);
    }
    process.exit(1);
  }
}

// Main execution
if (require.main === module) {
  main().catch(console.error);
} 