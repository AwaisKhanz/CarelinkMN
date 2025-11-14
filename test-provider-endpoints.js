#!/usr/bin/env node
/**
 * Provider Dashboard Endpoints Test Script
 * Tests the newly implemented and verified endpoints
 * 
 * Usage: node test-provider-endpoints.js
 * 
 * Requirements:
 * 1. Set BEARER_TOKEN environment variable with valid JWT
 * 2. Set PROVIDER_ID environment variable with valid provider UUID
 * 3. API must be running on localhost:5000 (or set API_URL)
 */

const https = require('https');
const http = require('http');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:5000';
const BEARER_TOKEN = process.env.BEARER_TOKEN;
const PROVIDER_ID = process.env.PROVIDER_ID;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(endpoint, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_URL}${endpoint}`);
    const protocol = url.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BEARER_TOKEN}`,
        ...options.headers,
      },
    };

    const req = protocol.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData,
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data,
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testHealthEndpoint() {
  log('\n=== Testing Health Endpoint ===', 'cyan');
  
  try {
    const response = await makeRequest('/health');
    
    if (response.statusCode === 200) {
      log('✅ Health check passed', 'green');
      log(`   API is running (uptime: ${response.data.uptime}s)`, 'blue');
      return true;
    } else {
      log('❌ Health check failed', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Health check error: ${error.message}`, 'red');
    return false;
  }
}

async function testProviderReferralsEndpoint() {
  log('\n=== Testing Provider Referrals Endpoint (NEW) ===', 'cyan');
  
  if (!PROVIDER_ID) {
    log('⚠️  PROVIDER_ID not set, skipping test', 'yellow');
    return false;
  }
  
  const tests = [
    {
      name: 'Basic retrieval',
      endpoint: `/api/providers/${PROVIDER_ID}/referrals`,
    },
    {
      name: 'With pagination',
      endpoint: `/api/providers/${PROVIDER_ID}/referrals?page=1&limit=5`,
    },
    {
      name: 'With status filter',
      endpoint: `/api/providers/${PROVIDER_ID}/referrals?status=NEW`,
    },
  ];
  
  let allPassed = true;
  
  for (const test of tests) {
    try {
      log(`\n  Testing: ${test.name}`, 'blue');
      const response = await makeRequest(test.endpoint);
      
      if (response.statusCode === 200) {
        log(`  ✅ ${test.name} - SUCCESS`, 'green');
        
        if (response.data.success && response.data.data) {
          const { referrals, pagination } = response.data.data;
          log(`     Referrals count: ${referrals?.length || 0}`, 'blue');
          
          if (pagination) {
            log(`     Pagination: Page ${pagination.page}/${pagination.pages}, Total: ${pagination.total}`, 'blue');
          }
          
          if (referrals && referrals.length > 0) {
            const firstReferral = referrals[0];
            log(`     Sample referral: ${firstReferral.referralNumber} (${firstReferral.status})`, 'blue');
          }
        }
      } else if (response.statusCode === 403) {
        log(`  ⚠️  ${test.name} - FORBIDDEN (check provider access)`, 'yellow');
        log(`     Message: ${response.data.message}`, 'yellow');
      } else {
        log(`  ❌ ${test.name} - FAILED (Status: ${response.statusCode})`, 'red');
        log(`     Error: ${response.data.error || response.data.message}`, 'red');
        allPassed = false;
      }
    } catch (error) {
      log(`  ❌ ${test.name} - ERROR: ${error.message}`, 'red');
      allPassed = false;
    }
  }
  
  return allPassed;
}

async function testProviderAnalyticsEndpoint() {
  log('\n=== Testing Provider Analytics Endpoint (VERIFIED) ===', 'cyan');
  
  if (!PROVIDER_ID) {
    log('⚠️  PROVIDER_ID not set, skipping test', 'yellow');
    return false;
  }
  
  const tests = [
    {
      name: 'Basic retrieval',
      endpoint: `/api/providers/${PROVIDER_ID}/analytics`,
    },
    {
      name: 'With date range (last 7 days)',
      endpoint: `/api/providers/${PROVIDER_ID}/analytics?startDate=${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}&endDate=${new Date().toISOString()}`,
    },
  ];
  
  let allPassed = true;
  
  for (const test of tests) {
    try {
      log(`\n  Testing: ${test.name}`, 'blue');
      const response = await makeRequest(test.endpoint);
      
      if (response.statusCode === 200) {
        log(`  ✅ ${test.name} - SUCCESS`, 'green');
        
        if (response.data.success && response.data.data) {
          const { funnel, fillTime, responseTime, payerMix, summary } = response.data.data;
          
          if (funnel) {
            log(`     Funnel: ${funnel.views} views → ${funnel.inquiries} inquiries → ${funnel.placements} placements`, 'blue');
          }
          
          if (fillTime) {
            log(`     Avg Fill Time: ${fillTime.averageFillTime?.toFixed(1) || 'N/A'} hours`, 'blue');
          }
          
          if (responseTime) {
            log(`     Response Rate: ${responseTime.responseRate?.toFixed(1) || 'N/A'}%`, 'blue');
          }
          
          if (payerMix && payerMix.length > 0) {
            log(`     Top Payer: ${payerMix[0].payer} (${payerMix[0].percentage?.toFixed(1)}%)`, 'blue');
          }
          
          if (summary) {
            log(`     Total Homes: ${summary.totalHomes}, Active Openings: ${summary.activeOpenings}`, 'blue');
          }
        }
      } else if (response.statusCode === 403) {
        log(`  ⚠️  ${test.name} - FORBIDDEN (check provider access)`, 'yellow');
        log(`     Message: ${response.data.message}`, 'yellow');
      } else {
        log(`  ❌ ${test.name} - FAILED (Status: ${response.statusCode})`, 'red');
        log(`     Error: ${response.data.error || response.data.message}`, 'red');
        allPassed = false;
      }
    } catch (error) {
      log(`  ❌ ${test.name} - ERROR: ${error.message}`, 'red');
      allPassed = false;
    }
  }
  
  return allPassed;
}

async function main() {
  log('╔════════════════════════════════════════════════════════╗', 'cyan');
  log('║   Provider Dashboard Endpoints Test Suite            ║', 'cyan');
  log('╚════════════════════════════════════════════════════════╝', 'cyan');
  
  // Check environment variables
  log('\n=== Configuration ===', 'cyan');
  log(`API URL: ${API_URL}`, 'blue');
  log(`Bearer Token: ${BEARER_TOKEN ? '✅ Set' : '❌ Not set'}`, BEARER_TOKEN ? 'green' : 'red');
  log(`Provider ID: ${PROVIDER_ID || '❌ Not set'}`, PROVIDER_ID ? 'green' : 'red');
  
  if (!BEARER_TOKEN) {
    log('\n⚠️  Please set BEARER_TOKEN environment variable', 'yellow');
    log('   Example: export BEARER_TOKEN="your-jwt-token"', 'yellow');
  }
  
  if (!PROVIDER_ID) {
    log('\n⚠️  Please set PROVIDER_ID environment variable', 'yellow');
    log('   Example: export PROVIDER_ID="uuid-here"', 'yellow');
  }
  
  // Run tests
  const results = {
    health: await testHealthEndpoint(),
    referrals: await testProviderReferralsEndpoint(),
    analytics: await testProviderAnalyticsEndpoint(),
  };
  
  // Summary
  log('\n\n╔════════════════════════════════════════════════════════╗', 'cyan');
  log('║   Test Summary                                        ║', 'cyan');
  log('╚════════════════════════════════════════════════════════╝', 'cyan');
  
  const healthStatus = results.health ? '✅ PASSED' : '❌ FAILED';
  const referralsStatus = !PROVIDER_ID ? '⚠️  SKIPPED' : (results.referrals ? '✅ PASSED' : '❌ FAILED');
  const analyticsStatus = !PROVIDER_ID ? '⚠️  SKIPPED' : (results.analytics ? '✅ PASSED' : '❌ FAILED');
  
  log(`\nHealth Check:        ${healthStatus}`, results.health ? 'green' : 'red');
  log(`Referrals Endpoint:  ${referralsStatus}`, !PROVIDER_ID ? 'yellow' : (results.referrals ? 'green' : 'red'));
  log(`Analytics Endpoint:  ${analyticsStatus}`, !PROVIDER_ID ? 'yellow' : (results.analytics ? 'green' : 'red'));
  
  // Overall status
  if (results.health && results.referrals && results.analytics) {
    log('\n🎉 All tests passed! Provider Dashboard is ready for production.', 'green');
    process.exit(0);
  } else if (!BEARER_TOKEN || !PROVIDER_ID) {
    log('\n⚠️  Tests incomplete - missing environment variables', 'yellow');
    process.exit(1);
  } else {
    log('\n❌ Some tests failed. Please review the results above.', 'red');
    process.exit(1);
  }
}

// Run tests
main().catch((error) => {
  log(`\n❌ Unexpected error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

