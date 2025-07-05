"use strict";
// Example: Using @kodeglot/belgian-eid-reader in a Node.js app
// This file demonstrates basic usage of the package
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("../dist/index.js");
async function main() {
    console.log('🇧🇪 Belgian eID Reader - Node.js Example\n');
    // Step 1: Check requirements
    console.log('1. Checking requirements...');
    const reqResult = await (0, index_js_1.checkRequirements)();
    reqResult.info.forEach(msg => console.log('INFO:', msg));
    if (!reqResult.success) {
        console.log('❌ Some requirements are missing:');
        if (reqResult.error)
            console.log('ERROR:', reqResult.error.message);
        console.log(JSON.stringify(reqResult.data?.results, null, 2));
        // Step 2: Attempt to install missing requirements
        console.log('\n2. Attempting to install missing requirements...');
        const installResult = await (0, index_js_1.installRequirements)();
        installResult.info.forEach(msg => console.log('INFO:', msg));
        if (!installResult.success) {
            console.log('❌ Failed to install requirements automatically.');
            if (installResult.error)
                console.log('ERROR:', installResult.error.message);
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
    // Step 3: Read eID data using convenience function
    console.log('\n3. Reading eID data (simple method)...');
    const eidResult = await (0, index_js_1.readEidData)();
    eidResult.info.forEach(msg => console.log('INFO:', msg));
    if (!eidResult.success) {
        console.log('❌ Failed to read eID data.');
        if (eidResult.error)
            console.log('ERROR:', eidResult.error.message, eidResult.error.code);
        return;
    }
    const eidData = eidResult.data;
    console.log('\n📋 eID Data:');
    console.log('Name:', eidData.firstName, eidData.name);
    console.log('Card Number:', eidData.cardNumber);
    console.log('Birth Date:', eidData.birthDate);
    console.log('Nationality:', eidData.nationality);
    console.log('Address:', eidData.address.streetAndNumber, eidData.address.zip, eidData.address.municipality);
    console.log('Photo available:', eidData.photo ? 'Yes' : 'No');
    // Step 4: Read eID data using class with custom options
    console.log('\n4. Reading eID data (advanced method with options)...');
    const reader = new index_js_1.EidReader({
        verbose: true,
        maxRetries: 5,
        retryDelay: 500
    });
    const eidResult2 = await reader.readEidData();
    eidResult2.info.forEach(msg => console.log('INFO:', msg));
    if (!eidResult2.success) {
        console.log('❌ Failed to read eID data (advanced).');
        if (eidResult2.error)
            console.log('ERROR:', eidResult2.error.message, eidResult2.error.code);
        return;
    }
    const eidData2 = eidResult2.data;
    console.log('✅ Advanced read completed successfully!');
    console.log('Chip Number:', eidData2.chipNumber);
    console.log('Document Type:', eidData2.documentType);
    // Step 5: Demonstrate error handling
    console.log('\n5. Demonstrating error handling...');
    try {
        // This will fail if no card is inserted
        const failResult = await (0, index_js_1.readEidData)();
        if (!failResult.success) {
            console.log('Expected error caught:');
            if (failResult.error) {
                console.log('- Message:', failResult.error.message);
                console.log('- Code:', failResult.error.code);
            }
            failResult.info.forEach(msg => console.log('INFO:', msg));
        }
    }
    catch (error) {
        console.log('Unexpected error:', error);
    }
}
main().catch(console.error);
