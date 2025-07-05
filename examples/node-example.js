"use strict";
// Example: Using @kodeglot/belgian-eid-reader in a Node.js app
// This file demonstrates basic usage of the package
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("../dist/index.js");
// Remove this interface as installRequirements returns boolean directly
async function main() {
    console.log('🇧🇪 Belgian eID Reader - Node.js Example\n');
    try {
        // Step 1: Check requirements
        console.log('1. Checking requirements...');
        const { passed, results } = await (0, index_js_1.checkRequirements)();
        if (!passed) {
            console.log('❌ Some requirements are missing:');
            console.log(JSON.stringify(results, null, 2));
            console.log('\n2. Attempting to install missing requirements...');
            const installed = await (0, index_js_1.installRequirements)();
            if (!installed) {
                console.log('❌ Failed to install requirements automatically.');
                console.log('Please install manually:');
                console.log('- Python 3.x: https://www.python.org/downloads/');
                console.log('- eidreader: pip install eidreader');
                console.log('- Belgian eID middleware: https://eid.belgium.be');
                return;
            }
            console.log('✅ Requirements installed successfully!');
        }
        else {
            console.log('✅ All requirements are met!');
        }
        // Step 2: Read eID data using convenience function
        console.log('\n3. Reading eID data (simple method)...');
        const eidData = await (0, index_js_1.readEidData)();
        console.log('\n📋 eID Data:');
        console.log('Name:', eidData.firstName, eidData.name);
        console.log('Card Number:', eidData.cardNumber);
        console.log('Birth Date:', eidData.birthDate);
        console.log('Nationality:', eidData.nationality);
        console.log('Address:', eidData.address.streetAndNumber, eidData.address.zip, eidData.address.municipality);
        console.log('Photo available:', eidData.photo ? 'Yes' : 'No');
        // Step 3: Read eID data using class with custom options
        console.log('\n4. Reading eID data (advanced method with options)...');
        const reader = new index_js_1.EidReader({
            verbose: true,
            maxRetries: 5,
            retryDelay: 500
        });
        const eidData2 = await reader.readEidData();
        console.log('✅ Advanced read completed successfully!');
        console.log('Chip Number:', eidData2.chipNumber);
        console.log('Document Type:', eidData2.documentType);
        // Step 4: Demonstrate error handling
        console.log('\n5. Demonstrating error handling...');
        try {
            // This will fail if no card is inserted
            await (0, index_js_1.readEidData)();
        }
        catch (error) {
            console.log('Expected error caught:');
            console.log('- Message:', error instanceof Error ? error.message : String(error));
            console.log('- Code:', error instanceof index_js_1.EidReaderError ? error.code : 'UNKNOWN');
            console.log('- Type:', error instanceof index_js_1.EidReaderError ? 'EidReaderError' : error.constructor.name);
        }
    }
    catch (error) {
        console.error('❌ Unexpected error:', error);
        if (error instanceof index_js_1.EidReaderError) {
            console.error('Error code:', error.code);
        }
    }
}
// Run the example
main().catch(console.error);
