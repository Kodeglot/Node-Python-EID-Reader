#!/usr/bin/env node

import { EidReader, EidReaderError } from './index';

async function main() {
  try {
    console.log('🚀 Belgian eID Reader CLI\n');

    // Check requirements first
    const reader = new EidReader({ verbose: true });
    const reqResult = await reader.checkRequirements();
    
    // Display info messages
    reqResult.info.forEach(msg => console.log('INFO:', msg));
    
    if (!reqResult.success) {
      console.log('\n⚠️  Some requirements are missing. Attempting to install...\n');
      const installResult = await reader.installRequirements();
      
      // Display install info messages
      installResult.info.forEach(msg => console.log('INFO:', msg));
      
      if (!installResult.success) {
        console.log('\n❌ Please install the missing requirements and try again.');
        if (installResult.error) {
          console.log('ERROR:', installResult.error.message);
        }
        console.log('📖 See README.md for detailed installation instructions.');
        process.exit(1);
      }
      
      // Re-check after installation
      const recheckResult = await reader.checkRequirements();
      recheckResult.info.forEach(msg => console.log('INFO:', msg));
      
      if (!recheckResult.success) {
        console.log('\n❌ Some requirements are still missing after installation attempt.');
        if (recheckResult.error) {
          console.log('ERROR:', recheckResult.error.message);
        }
        process.exit(1);
      }
    }

    console.log('\n🚀 Starting eID reader...\n');
    const eidResult = await reader.readEidData();
    
    // Display read info messages
    eidResult.info.forEach(msg => console.log('INFO:', msg));
    
    if (!eidResult.success) {
      console.log('\n❌ Failed to read eID data.');
      if (eidResult.error) {
        console.log('ERROR:', eidResult.error.message, eidResult.error.code);
      }
      process.exit(1);
    }
    
    const eidData = eidResult.data!;
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