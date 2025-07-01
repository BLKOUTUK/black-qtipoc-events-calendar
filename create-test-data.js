// Create test data in Google Sheets to test deduplication
import { execSync } from 'child_process';
import fs from 'fs';

console.log('🎭 Creating Test Data for Deduplication System');
console.log('='.repeat(50));

// Load environment variables from .env file
const envContent = fs.readFileSync('.env', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const GOOGLE_API_KEY = envVars.VITE_GOOGLE_API_KEY;
const SHEET_ID = envVars.VITE_GOOGLE_SHEET_ID;

// Test events with intentional duplicates
const testEvents = [
  {
    id: 'test_001',
    name: 'Black Queer Poetry Night',
    description: 'A celebration of Black QTIPOC+ voices through spoken word and poetry. Safe space for our community.',
    event_date: '2025-01-15T19:00:00Z',
    location: 'Rich Mix London, Bethnal Green Road, London',
    source: 'eventbrite',
    source_url: 'https://www.eventbrite.com/e/test001',
    organizer_name: 'BlackOutUK',
    tags: 'black, queer, poetry, spoken word, safe space',
    status: 'draft',
    price: 'Free',
    image_url: '',
    scraped_date: new Date().toISOString()
  },
  {
    id: 'test_002',
    name: 'Black Queer Poetry Evening', // Similar to test_001
    description: 'An evening celebrating Black QTIPOC+ voices through spoken word. Community safe space.',
    event_date: '2025-01-15T19:00:00Z',
    location: 'Rich Mix, Bethnal Green Road, London E1',
    source: 'web_scraping',
    source_url: 'https://richmix.org.uk/events/poetry-night',
    organizer_name: 'Rich Mix London',
    tags: 'black, qtipoc, poetry, community',
    status: 'draft', 
    price: 'Free entry',
    image_url: '',
    scraped_date: new Date().toISOString()
  },
  {
    id: 'test_003',
    name: 'QTIPOC+ Healing Circle',
    description: 'Monthly healing circle for Black and POC LGBTQ+ community. Therapy and wellness focus.',
    event_date: '2025-01-20T18:30:00Z',
    location: 'Online Event',
    source: 'rss_feed',
    source_url: 'https://example.org/healing-circle',
    organizer_name: 'Gendered Intelligence',
    tags: 'qtipoc, healing, therapy, wellness, support group',
    status: 'draft',
    price: 'Sliding scale £5-15',
    image_url: '',
    scraped_date: new Date().toISOString()
  },
  {
    id: 'test_004',
    name: 'Black Trans Liberation Workshop',
    description: 'Educational workshop on Black trans history and current organizing efforts. Community building.',
    event_date: '2025-01-25T14:00:00Z',
    location: 'Southbank Centre, London',
    source: 'web_scraping',
    source_url: 'https://southbankcentre.co.uk/events/trans-liberation',
    organizer_name: 'Southbank Centre',
    tags: 'black, trans, liberation, workshop, history, organizing',
    status: 'draft',
    price: '£10',
    image_url: '',
    scraped_date: new Date().toISOString()
  },
  {
    id: 'test_005',
    name: 'QTIPOC Wellness Circle', // Similar to test_003
    description: 'Healing and wellness circle for QTIPOC community. Monthly gathering with therapy focus.',
    event_date: '2025-01-20T18:30:00Z', 
    location: 'Virtual/Online',
    source: 'outsavvy',
    source_url: 'https://outsavvy.com/events/wellness-circle',
    organizer_name: 'Gendered Intelligence UK',
    tags: 'qtipoc, wellness, healing, therapy, community',
    status: 'draft',
    price: '£5-15 sliding scale',
    image_url: '',
    scraped_date: new Date().toISOString()
  },
  {
    id: 'test_006', 
    name: 'Afrobeats Dance Workshop',
    description: 'Learn Afrobeats dance moves in a fun, inclusive environment. All levels welcome.',
    event_date: '2025-02-01T15:00:00Z',
    location: 'Community Centre, Manchester',
    source: 'eventbrite',
    source_url: 'https://eventbrite.com/e/afrobeats-dance',
    organizer_name: 'Manchester Black Arts',
    tags: 'afrobeats, dance, workshop, community, inclusive',
    status: 'draft',
    price: '£8',
    image_url: '',
    scraped_date: new Date().toISOString()
  }
];

async function clearAndPopulateSheet() {
  try {
    console.log('🧹 Clearing existing data...');
    
    // Clear the Events sheet
    const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Events:clear?key=${GOOGLE_API_KEY}`;
    const clearCommand = `curl -s -X POST "${clearUrl}"`;
    execSync(clearCommand);
    
    console.log('📝 Adding test data...');
    
    // Add headers
    const headers = [
      'ID', 'Name', 'Description', 'Event Date', 'Location', 'Source', 'Source URL',
      'Organizer Name', 'Tags', 'Status', 'Price', 'Image URL', 'Scraped Date'
    ];
    
    // Convert test events to rows
    const rows = [headers];
    testEvents.forEach(event => {
      rows.push([
        event.id,
        event.name,
        event.description,
        event.event_date,
        event.location,
        event.source,
        event.source_url,
        event.organizer_name,
        event.tags,
        event.status,
        event.price,
        event.image_url,
        event.scraped_date
      ]);
    });
    
    // Add data to sheet
    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Events?valueInputOption=RAW&key=${GOOGLE_API_KEY}`;
    const payload = JSON.stringify({ values: rows });
    
    const updateCommand = `curl -s -X PUT "${updateUrl}" ` +
      `-H "Content-Type: application/json" ` +
      `-d '${payload}'`;
    
    const result = execSync(updateCommand, { encoding: 'utf8' });
    
    console.log('✅ Test data created successfully!');
    console.log(`📊 Added ${testEvents.length} test events to Google Sheets`);
    console.log('\n🔍 Expected duplicates:');
    console.log('• Events 1 & 2: Black Queer Poetry (same date/location, similar titles)');
    console.log('• Events 3 & 5: QTIPOC+ Healing Circle (same date/organizer, similar description)');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to create test data:', error.message);
    return false;
  }
}

// Run the test data creation
clearAndPopulateSheet().then(success => {
  if (success) {
    console.log('\n🚀 Next steps:');
    console.log('1. Test the deduplication function');
    console.log('2. Test the orchestration system');
    console.log('3. Verify quality scoring is working');
  }
});