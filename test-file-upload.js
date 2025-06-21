// Simple test script to verify file upload API works for both user types
const fs = require('fs');
const path = require('path');

// Create a simple test text file
const testContent = 'Hello World! This is a test file for upload verification.';
const testFilePath = path.join(__dirname, 'test-upload.txt');
fs.writeFileSync(testFilePath, testContent);

console.log('Created test file:', testFilePath);
console.log('File content:', testContent);
console.log('File size:', fs.statSync(testFilePath).size, 'bytes');

// To test the upload API:
// 1. Start the dev server: npm run dev
// 2. Test guest upload: 
//    - Go to /login -> Continue as Guest
//    - Try uploading the test-upload.txt file in chat
// 3. Test authenticated upload:
//    - Login with email
//    - Try uploading the same file
// 4. Verify both work and show appropriate responses

console.log('\nTo test file upload:');
console.log('1. Run "npm run dev" to start the development server');
console.log('2. Test guest upload: /login -> Continue as Guest -> Upload test-upload.txt');
console.log('3. Test authenticated upload: Login with email -> Upload test-upload.txt');
console.log('4. Both should work correctly');
