// Simple test to verify our event aggregation system
import { execSync } from 'child_process';
import fs from 'fs';

console.log('🧪 Testing Black QTIPOC+ Events Calendar Aggregation System');
console.log('='.repeat(60));

// Test 1: Check environment variables
console.log('\n1. 📋 Environment Configuration Check');
const envVars = ['EVENTBRITE_API_TOKEN', 'OUTSAVVY_API_KEY', 'VITE_GOOGLE_SHEET_ID', 'VITE_GOOGLE_API_KEY'];
envVars.forEach(varName => {
  const value = process.env[varName];
  console.log(`   ${varName}: ${value ? '✅ Set' : '❌ Missing'}`);
});

// Test 2: Check function files
console.log('\n2. 📁 Function Files Check');
const functions = [
  'aggregate-rss-feeds.ts',
  'scrape-broader-sources.ts', 
  'deduplicate-events.ts',
  'orchestrate-event-collection.ts',
  'scrape-eventbrite.ts',
  'scrape-outsavvy.ts'
];

functions.forEach(func => {
  const exists = fs.existsSync(`netlify/functions/${func}`);
  console.log(`   ${func}: ${exists ? '✅ Found' : '❌ Missing'}`);
});

// Test 3: API connectivity tests
console.log('\n3. 🌐 API Connectivity Tests');

// Test Eventbrite API
try {
  console.log('   Testing Eventbrite API...');
  const eventbriteResult = execSync(
    `curl -s -H "Authorization: Bearer ${process.env.EVENTBRITE_API_TOKEN}" "https://www.eventbriteapi.com/v3/organizations/210048439247/events/?status=live&order_by=start_asc"`,
    { encoding: 'utf8', timeout: 10000 }
  );
  const eventbriteData = JSON.parse(eventbriteResult);
  console.log(`   Eventbrite: ✅ Connected (${eventbriteData.events?.length || 0} events found)`);
} catch (error) {
  console.log(`   Eventbrite: ❌ Failed - ${error.message}`);
}

// Test Outsavvy API
try {
  console.log('   Testing Outsavvy API...');
  const outsavvyResult = execSync(
    `curl -s -H "Authorization: Partner ${process.env.OUTSAVVY_API_KEY}" "https://api.outsavvy.com/v1/events/search?q=test&latitude=51.5074&longitude=-0.1278&range=10"`,
    { encoding: 'utf8', timeout: 10000 }
  );
  const outsavvyData = JSON.parse(outsavvyResult);
  console.log(`   Outsavvy: ✅ Connected (${outsavvyData.events?.length || 0} events found)`);
} catch (error) {
  console.log(`   Outsavvy: ❌ Failed - ${error.message}`);
}

// Test RSS feeds
console.log('   Testing RSS feed parsing...');
try {
  const rssResult = execSync('curl -s "https://feeds.bbci.co.uk/news/rss.xml"', { encoding: 'utf8', timeout: 10000 });
  const isValidXML = rssResult.includes('<?xml') && rssResult.includes('<rss');
  console.log(`   RSS parsing: ${isValidXML ? '✅ Working' : '❌ Failed'}`);
} catch (error) {
  console.log(`   RSS parsing: ❌ Failed - ${error.message}`);
}

// Test 4: Google Sheets API
console.log('\n4. 📊 Google Sheets API Test');
try {
  console.log('   Testing Google Sheets API...');
  const sheetsResult = execSync(
    `curl -s "https://sheets.googleapis.com/v4/spreadsheets/${process.env.VITE_GOOGLE_SHEET_ID}/values/Events?key=${process.env.VITE_GOOGLE_API_KEY}"`,
    { encoding: 'utf8', timeout: 10000 }
  );
  const sheetsData = JSON.parse(sheetsResult);
  console.log(`   Google Sheets: ✅ Connected (${sheetsData.values?.length || 0} rows found)`);
} catch (error) {
  console.log(`   Google Sheets: ❌ Failed - ${error.message}`);
}

// Test 5: Dependencies check
console.log('\n5. 📦 Dependencies Check');
const dependencies = ['puppeteer', 'fast-xml-parser'];
dependencies.forEach(dep => {
  try {
    // Check if package.json lists the dependency
    const packageJsonPath = './package.json';
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const isInstalled = packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep];
    console.log(`   ${dep}: ${isInstalled ? '✅ Installed' : '❌ Missing'}`);
  } catch (error) {
    console.log(`   ${dep}: ❌ Missing`);
  }
});

console.log('\n' + '='.repeat(60));
console.log('🎯 Test Summary Complete');
console.log('\nNext steps:');
console.log('• If all APIs are connected, run orchestrated collection');
console.log('• If APIs return 0 events, test with mock data');
console.log('• Check RSS feed URLs and update as needed');
console.log('• Verify Google Sheets permissions for writing');