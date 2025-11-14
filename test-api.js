#!/usr/bin/env node

const http = require('http');

// Test API server health
function testAPI() {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:3001/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('✅ API Server is running on port 3001');
          console.log('📊 Health check response:', result);
          resolve(result);
        } catch (e) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });
    
    req.on('error', (err) => {
      console.log('❌ API Server is not running on port 3001');
      console.log('   Make sure to run: npm run dev');
      reject(err);
    });
    
    req.setTimeout(5000, () => {
      console.log('⏰ API Server health check timed out');
      reject(new Error('Timeout'));
    });
  });
}

// Test web app
function testWebApp() {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:3000', (res) => {
      console.log('✅ Web App is running on port 3000');
      console.log('🌐 Web App response status:', res.statusCode);
      resolve(res.statusCode);
    });
    
    req.on('error', (err) => {
      console.log('❌ Web App is not running on port 3000');
      console.log('   Make sure to run: npm run dev');
      reject(err);
    });
    
    req.setTimeout(5000, () => {
      console.log('⏰ Web App health check timed out');
      reject(new Error('Timeout'));
    });
  });
}

// Run tests
async function runTests() {
  console.log('🧪 Testing CareLinkMN Development Environment...\n');
  
  try {
    await testAPI();
    console.log('');
    await testWebApp();
    console.log('\n🎉 All services are running correctly!');
    console.log('\n📝 Next steps:');
    console.log('   1. Open http://localhost:3000 in your browser');
    console.log('   2. Try the authentication forms');
    console.log('   3. Check the API at http://localhost:3001/health');
  } catch (error) {
    console.log('\n❌ Some services are not running properly');
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure you ran: npm run dev');
    console.log('   2. Check that ports 3000 and 3001 are available');
    console.log('   3. Verify your .env file is set up correctly');
    process.exit(1);
  }
}

runTests();
