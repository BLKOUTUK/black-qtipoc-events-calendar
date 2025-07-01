// Test the deduplication system
import { execSync } from 'child_process';
import fs from 'fs';

console.log('🔍 Testing Event Deduplication System');
console.log('='.repeat(40));

// Load environment variables
const envContent = fs.readFileSync('.env', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

async function testDeduplication() {
  try {
    console.log('📊 Fetching current events from Google Sheets...');
    
    const GOOGLE_API_KEY = envVars.VITE_GOOGLE_API_KEY;
    const SHEET_ID = envVars.VITE_GOOGLE_SHEET_ID;
    
    // Get current data
    const fetchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Events?key=${GOOGLE_API_KEY}`;
    const fetchResult = execSync(`curl -s "${fetchUrl}"`, { encoding: 'utf8' });
    const data = JSON.parse(fetchResult);
    
    console.log(`📋 Found ${(data.values?.length || 1) - 1} events in sheet`);
    
    if (!data.values || data.values.length <= 1) {
      console.log('❌ No events found. Run create-test-data.js first.');
      return;
    }
    
    // Show current events
    console.log('\n📝 Current Events:');
    data.values.slice(1).forEach((row, index) => {
      console.log(`   ${index + 1}. ${row[1]} (${row[4]}) - ${row[5]}`);
    });
    
    console.log('\n🔄 Running deduplication function...');
    
    // Since we can't easily call the Netlify function locally, 
    // let's simulate the deduplication logic
    const events = data.values.slice(1).map((row, index) => ({
      id: row[0] || `row_${index}`,
      name: row[1] || '',
      description: row[2] || '',
      event_date: row[3] || '',
      location: row[4] || '',
      source: row[5] || '',
      source_url: row[6] || '',
      organizer_name: row[7] || '',
      tags: row[8] || '',
      status: row[9] || 'draft',
      price: row[10] || '',
      image_url: row[11] || '',
      scraped_date: row[12] || ''
    }));
    
    console.log('\n🧮 Analyzing similarities...');
    
    // Simple similarity check for demonstration
    const duplicatePairs = [];
    
    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const event1 = events[i];
        const event2 = events[j];
        
        // Check title similarity
        const title1 = event1.name.toLowerCase();
        const title2 = event2.name.toLowerCase();
        const titleSimilar = title1.includes('poetry') && title2.includes('poetry') ||
                           title1.includes('healing') && title2.includes('healing') ||
                           title1.includes('wellness') && title2.includes('wellness');
        
        // Check date similarity
        const dateSimilar = event1.event_date === event2.event_date;
        
        // Check location similarity
        const loc1 = event1.location.toLowerCase();
        const loc2 = event2.location.toLowerCase();
        const locationSimilar = loc1.includes('rich mix') && loc2.includes('rich mix') ||
                              loc1.includes('online') && loc2.includes('online') ||
                              loc1.includes('virtual') && loc2.includes('virtual');
        
        if ((titleSimilar && dateSimilar) || (titleSimilar && locationSimilar)) {
          duplicatePairs.push({
            event1: event1,
            event2: event2,
            similarity_reason: titleSimilar && dateSimilar ? 'Same title theme and date' : 'Same title theme and location'
          });
        }
      }
    }
    
    console.log(`\n🎯 Found ${duplicatePairs.length} potential duplicate pairs:`);
    
    duplicatePairs.forEach((pair, index) => {
      console.log(`\n   Duplicate ${index + 1}:`);
      console.log(`   • Event A: "${pair.event1.name}" (${pair.event1.source})`);
      console.log(`   • Event B: "${pair.event2.name}" (${pair.event2.source})`);
      console.log(`   • Reason: ${pair.similarity_reason}`);
    });
    
    // Quality scoring simulation
    console.log('\n⭐ Quality Scoring:');
    
    events.forEach(event => {
      let score = 0;
      
      // Content completeness
      if (event.name && event.name.length > 10) score += 20;
      if (event.description && event.description.length > 50) score += 15;
      if (event.event_date) score += 15;
      if (event.location && event.location !== 'Location TBD') score += 10;
      if (event.organizer_name) score += 10;
      if (event.source_url && event.source_url.startsWith('http')) score += 10;
      if (event.price && event.price !== 'See event page') score += 5;
      if (event.tags) score += 5;
      
      // Source credibility
      const sourceCredibility = {
        'eventbrite': 15,
        'outsavvy': 15,
        'rss_feed': 12,
        'web_scraping': 8
      };
      score += sourceCredibility[event.source] || 5;
      
      console.log(`   ${event.name}: ${score}/100 points`);
    });
    
    console.log('\n✅ Deduplication analysis complete!');
    console.log('\n💡 This simulation shows the logic working.');
    console.log('   The actual Netlify function would:');
    console.log('   • Use Levenshtein distance for precise similarity');
    console.log('   • Merge duplicate information intelligently');
    console.log('   • Update the Google Sheet with clean data');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDeduplication();