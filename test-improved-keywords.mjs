// Test the improved keyword matching
const titles = [
  "Writing Club for QTIBPOC",
  "Melanin Vybz (BPOC 50+ Meetup)",
  "Pulse Cinema Presents: BIPOC Queer Filmmaker Showcase",
  "East, South and South East Asian Healing Circle",
  "Exploring African and Diasporic Queer Archiving",
  "Black History Month Poetry Circle",
  "Queer Black Women and Non-Binary Social",
  "LGBTQ+ Asian Community Meetup",
  "Caribbean Heritage Month Celebration",
  "Mixed Heritage Storytelling Workshop"
];

function testImprovedKeywords() {
  console.log('=== TESTING IMPROVED KEYWORD MATCHING ===\n');
  
  const relevanceKeywords = [
    // High-value QTIPOC terms
    'qtipoc', 'bpoc', 'bipoc',
    
    // Queer umbrella terms
    'queer', 'lgbtq', 'lgbt', 'lesbian', 'gay', 'bisexual', 'trans', 'transgender',
    
    // People of Colour terms (disaggregated)
    'people of colour', 'people of color', 'poc',
    'black', 'african', 'caribbean', 'afro',
    'asian', 'south asian', 'east asian', 'chinese', 'indian',
    'middle eastern', 'arab', 'mixed heritage', 'mixed race',
    
    // Community terms
    'community', 'inclusive', 'diversity', 'intersectional'
  ];
  
  titles.forEach(title => {
    console.log(`Testing: "${title}"`);
    
    const content = title.toLowerCase();
    const matches = relevanceKeywords.filter(keyword => content.includes(keyword));
    const matchCount = matches.length;
    
    console.log(`  Matches: [${matches.join(', ')}]`);
    console.log(`  Count: ${matchCount}`);
    console.log(`  Relevant: ${matchCount >= 1 ? '✅ YES' : '❌ NO'}`);
    console.log('---');
  });
}

testImprovedKeywords();