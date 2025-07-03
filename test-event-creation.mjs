// Test event creation and filtering
const titles = [
  "Writing Club for QTIBPOC",
  "Melanin Vybz (BPOC 50+ Meetup)",
  "Pulse Cinema Presents: BIPOC Queer Filmmaker Showcase",
  "East, South and South East Asian Healing Circle",
  "Exploring African and Diasporic Queer Archiving"
];

function testEventCreation() {
  console.log('=== TESTING EVENT CREATION AND FILTERING ===\n');
  
  titles.forEach(title => {
    console.log(`Testing: "${title}"`);
    console.log(`  Length: ${title.length}`);
    console.log(`  Passes length check (>= 10): ${title.length >= 10}`);
    
    // Test tag extraction
    const qtipocKeywords = [
      'black', 'qtipoc', 'queer', 'trans', 'transgender', 'lgbtq', 'lgbt',
      'poc', 'people of colour', 'bipoc', 'community', 'healing', 'justice',
      'arts', 'wellness', 'workshop', 'celebration', 'pride', 'activism'
    ];

    const lowerTitle = title.toLowerCase();
    const tags = qtipocKeywords.filter(keyword => lowerTitle.includes(keyword));
    console.log(`  Tags found: [${tags.join(', ')}]`);
    
    // Test QTIPOC relevance
    const relevanceKeywords = [
      'black', 'qtipoc', 'queer', 'trans', 'transgender', 'lgbtq',
      'people of colour', 'poc', 'bipoc', 'community', 'inclusive'
    ];
    
    const content = title.toLowerCase();
    const matchCount = relevanceKeywords.filter(keyword => content.includes(keyword)).length;
    console.log(`  Relevance matches: ${matchCount}`);
    console.log(`  Passes relevance check (>= 2): ${matchCount >= 2}`);
    
    console.log('---');
  });
  
  // Test with modified relevance check
  console.log('\n=== TESTING WITH RELAXED RELEVANCE CHECK ===');
  titles.forEach(title => {
    const relevanceKeywords = [
      'black', 'qtipoc', 'queer', 'trans', 'transgender', 'lgbtq',
      'people of colour', 'poc', 'bipoc', 'community', 'inclusive', 'bpoc'
    ];
    
    const content = title.toLowerCase();
    const matchCount = relevanceKeywords.filter(keyword => content.includes(keyword)).length;
    console.log(`"${title}": ${matchCount} matches - ${matchCount >= 1 ? 'PASS' : 'FAIL'}`);
  });
}

testEventCreation();