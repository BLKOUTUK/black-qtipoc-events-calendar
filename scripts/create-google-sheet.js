/**
 * Script to programmatically create the Google Sheet template
 * Run with: node scripts/create-google-sheet.js
 * 
 * Prerequisites:
 * 1. Install googleapis: npm install googleapis
 * 2. Set up OAuth2 credentials
 * 3. Run this script to create the template
 */

const { google } = require('googleapis');
const fs = require('fs');

// Sample data for the sheets
const SAMPLE_EVENTS = [
  [
    'ID', 'Name', 'Description', 'EventDate', 'Location', 'Source', 'SourceURL', 
    'Organizer', 'Tags', 'Status', 'Price', 'ImageURL', 'ScrapedDate'
  ],
  [
    '1', 'Black Trans Joy Celebration', 
    'A celebration of Black trans joy, resilience, and community. Join us for an evening of music, poetry, and connection.',
    '2024-03-15T19:00:00Z', 'Brooklyn Community Center, NY', 'community',
    'https://example.com/event1', 'Black Trans Collective', 'trans,celebration,community,music',
    'published', 'Free', 'https://images.pexels.com/photos/3182792/pexels-photo-3182792.jpeg',
    '2024-02-01T10:00:00Z'
  ],
  [
    '2', 'Queer POC Mental Health Workshop',
    'A safe space workshop focusing on mental health resources and community support for QTIPOC+ individuals.',
    '2024-03-20T14:00:00Z', 'Oakland Wellness Center, CA', 'community',
    'https://community.example.com', 'Healing Justice Collective', 'mental health,workshop,wellness,support',
    'published', 'Sliding scale $10-30', '',
    '2024-02-02T10:00:00Z'
  ],
  [
    '3', 'Black Queer Artists Showcase',
    'An evening showcasing the incredible talent of Black queer artists across multiple mediums.',
    '2024-03-25T18:00:00Z', 'Harlem Arts Center, NY', 'eventbrite',
    'https://eventbrite.com/example', 'Queer Arts Network', 'art,showcase,creativity,performance',
    'draft', '$15', 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg',
    '2024-02-03T10:00:00Z'
  ],
  [
    '4', 'Black Liberation Book Club',
    'Monthly discussion of books by Black authors focusing on liberation, justice, and community organizing.',
    '2024-04-01T18:30:00Z', 'Chicago Community Library, IL', 'community',
    'https://example.com/book-club', 'Liberation Literature Collective', 'books,discussion,liberation,education',
    'published', 'Free', '',
    '2024-02-05T10:00:00Z'
  ],
  [
    '5', 'Intersectional Healing Circle',
    'A monthly gathering for Black QTIPOC+ folks to share experiences, practice healing, and build community.',
    '2024-04-10T15:00:00Z', 'Atlanta Wellness Space, GA', 'facebook',
    'https://facebook.com/events/example', 'Healing Justice ATL', 'healing,community,support,wellness',
    'reviewing', 'Donation based', '',
    '2024-02-06T10:00:00Z'
  ]
];

const SAMPLE_LOGS = [
  ['ID', 'Source', 'EventsFound', 'EventsAdded', 'Status', 'CreatedAt'],
  ['1', 'eventbrite', '45', '12', 'success', '2024-02-15T10:30:00Z'],
  ['2', 'facebook', '23', '8', 'partial', '2024-02-15T11:00:00Z'],
  ['3', 'outsavvy', '15', '3', 'success', '2024-02-15T11:30:00Z'],
  ['4', 'all_sources', '83', '23', 'success', '2024-02-15T12:00:00Z']
];

const SAMPLE_CONTACTS = [
  ['ID', 'Name', 'Email', 'Organization', 'Role'],
  ['1', 'Black Trans Collective', 'contact@blacktranscollective.org', 'Black Trans Collective', 'Organizer'],
  ['2', 'Healing Justice Collective', 'hello@healingjustice.org', 'Healing Justice Collective', 'Coordinator'],
  ['3', 'Queer Arts Network', 'info@queerartsnetwork.org', 'Queer Arts Network', 'Director'],
  ['4', 'Liberation Literature Collective', 'books@liberationlit.org', 'Liberation Literature Collective', 'Facilitator'],
  ['5', 'Healing Justice ATL', 'atlanta@healingjustice.org', 'Healing Justice ATL', 'Organizer']
];

const GUIDELINES_CONTENT = [
  ['Black QTIPOC+ Events Calendar - Community Guidelines'],
  [''],
  ['Event Approval Criteria:'],
  ['✅ Events must be relevant to Black QTIPOC+ community'],
  ['✅ Events should be safe and inclusive spaces'],
  ['✅ Information must be accurate and complete'],
  ['✅ Events should center Black QTIPOC+ voices and experiences'],
  ['✅ Events should be accessible when possible'],
  [''],
  ['Moderation Process:'],
  ['1. New events start in "draft" status'],
  ['2. Moderators review for community relevance'],
  ['3. Events move to "published" when approved'],
  ['4. Rejected events move to "archived" status'],
  ['5. Appeals can be made via email'],
  [''],
  ['Status Definitions:'],
  ['• draft: Newly submitted, awaiting review'],
  ['• reviewing: Currently being evaluated'],
  ['• published: Approved and visible to community'],
  ['• archived: Rejected or past events'],
  [''],
  ['Contact Information:'],
  ['Community Questions: community@qtipocevents.org'],
  ['Technical Issues: tech@qtipocevents.org'],
  ['Moderation Appeals: moderation@qtipocevents.org'],
  [''],
  ['Community Values:'],
  ['• Center Black QTIPOC+ voices and experiences'],
  ['• Prioritize safety and inclusion'],
  ['• Support grassroots organizing'],
  ['• Celebrate joy and resilience'],
  ['• Build authentic community connections']
];

async function createGoogleSheetTemplate() {
  try {
    console.log('🚀 Creating Black QTIPOC+ Events Calendar Google Sheet Template...');
    
    // Note: This is a template for the structure
    // In practice, you would:
    // 1. Create the sheet manually in Google Sheets
    // 2. Copy the structure and sample data
    // 3. Set up the formatting and validation
    
    console.log('📋 Sheet Structure:');
    console.log('');
    
    console.log('📅 Events Sheet:');
    SAMPLE_EVENTS.forEach((row, index) => {
      if (index === 0) {
        console.log('Headers:', row.join(' | '));
      } else {
        console.log(`Row ${index + 1}:`, row[1], '|', row[4], '|', row[9]);
      }
    });
    
    console.log('');
    console.log('📊 ScrapingLogs Sheet:');
    SAMPLE_LOGS.forEach((row, index) => {
      if (index === 0) {
        console.log('Headers:', row.join(' | '));
      } else {
        console.log(`Row ${index + 1}:`, row[1], '|', row[2], 'found |', row[3], 'added');
      }
    });
    
    console.log('');
    console.log('👥 Contacts Sheet:');
    SAMPLE_CONTACTS.forEach((row, index) => {
      if (index === 0) {
        console.log('Headers:', row.join(' | '));
      } else {
        console.log(`Row ${index + 1}:`, row[1], '|', row[3]);
      }
    });
    
    console.log('');
    console.log('📖 Guidelines Sheet:');
    GUIDELINES_CONTENT.slice(0, 10).forEach((row, index) => {
      console.log(`Row ${index + 1}:`, row[0]);
    });
    
    console.log('');
    console.log('✅ Template structure ready!');
    console.log('');
    console.log('📝 Next Steps:');
    console.log('1. Create a new Google Sheet manually');
    console.log('2. Create 4 sheets: Events, ScrapingLogs, Contacts, Guidelines');
    console.log('3. Copy the headers and sample data from above');
    console.log('4. Set up data validation and formatting');
    console.log('5. Make the sheet public for read access');
    console.log('6. Get the Sheet ID and API key');
    console.log('7. Update your .env file with the credentials');
    console.log('');
    console.log('🎯 Your Google Sheet will be the perfect database for the community!');
    
  } catch (error) {
    console.error('❌ Error creating template:', error);
  }
}

// Export the data for use in other scripts
module.exports = {
  SAMPLE_EVENTS,
  SAMPLE_LOGS,
  SAMPLE_CONTACTS,
  GUIDELINES_CONTENT
};

// Run if called directly
if (require.main === module) {
  createGoogleSheetTemplate();
}