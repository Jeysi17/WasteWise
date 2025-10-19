// Simple test script to check if your server is running
const fetch = require('node-fetch');

async function testServer() {
    const testUrls = [
        'http://localhost:3000/health',
        'http://localhost:3000/api/test',
        'http://192.168.18.7:3000/health',
        'http://192.168.18.7:3000/api/test'
    ];

    console.log('🧪 Testing server endpoints...\n');

    for (const url of testUrls) {
        try {
            console.log(`Testing: ${url}`);
            const response = await fetch(url);
            const data = await response.text();
            console.log(`✅ Status: ${response.status}`);
            console.log(`📄 Response: ${data.substring(0, 100)}...\n`);
        } catch (error) {
            console.log(`❌ Error: ${error.message}\n`);
        }
    }
}

testServer();





















