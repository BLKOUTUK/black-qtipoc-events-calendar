// Debug the exact event creation pipeline
const apiKey = 'jina_5fb235d4d56843f282c26e50f3c97e63e5MR_Rrpc44DDnv46t1lkAtwiYjL';

async function debugEventCreationPipeline() {
  console.log('=== DEBUGGING EVENT CREATION PIPELINE ===\n');
  
  // Use the BPOC events source we know works
  const sourceUrl = 'https://www.eventbrite.co.uk/cc/bpoc-events-4056573';
  
  console.log('1. Fetching from source...');
  const response = await fetch('https://r.jina.ai/' + encodeURIComponent(sourceUrl), {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'X-Return-Format': 'markdown',
      'X-Remove-Selector': 'nav, footer, .ads, .sidebar, .header, .cookies',
      'X-Target-Selector': '.event-card, .event-item, [data-event], .search-result',
      'X-Timeout': '30'
    }
  });
  
  const markdown = await response.text();
  console.log(`✅ Retrieved ${markdown.length} characters\n`);
  
  console.log('2. Testing event patterns...');
  
  // Test the exact pattern from the service
  const eventPattern = /#{1,3}\s*(.+?)(?:\n|\r)[\s\S]*?(?:£|\$|Free|From)[\s\S]*?(?:https?:\/\/[^\s]+)/g;
  let matches = [...markdown.matchAll(eventPattern)];
  
  console.log(`Found ${matches.length} matches with main pattern`);
  
  if (matches.length === 0) {
    console.log('Main pattern failed, trying simpler header pattern...');
    const simplePattern = /### (.+)/g;
    matches = [...markdown.matchAll(simplePattern)];
    console.log(`Found ${matches.length} header matches`);
  }
  
  console.log('\n3. Testing event creation for first few matches...');
  
  for (let i = 0; i < Math.min(3, matches.length); i++) {
    const match = matches[i];
    const title = match[1]?.trim();
    
    console.log(`\n--- Match ${i + 1} ---`);
    console.log(`Title: "${title}"`);
    console.log(`Length: ${title?.length || 0}`);
    console.log(`Passes length check (>= 10): ${(title?.length || 0) >= 10}`);
    
    if (!title || title.length < 10) {
      console.log('❌ Rejected: Title too short');
      continue;
    }
    
    console.log('✅ Title passes length check');
    
    // Test event creation
    const event = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: title,
      description: `${title}. Discovered from ${sourceUrl}. Full details available at source.`,
      event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'London, UK',
      source: 'eventbrite',
      source_url: match[2] || sourceUrl,
      organizer_name: 'Eventbrite Community',
      tags: [],
      status: 'draft',
      price: 'TBD',
      scraped_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('✅ Event object created');
    
    // Test relevance check
    const relevanceKeywords = [
      'qtipoc', 'bpoc', 'bipoc', 'queer', 'lgbtq', 'lgbt', 'lesbian', 'gay', 'bisexual', 'trans', 'transgender',
      'people of colour', 'people of color', 'poc', 'black', 'african', 'caribbean', 'afro',
      'asian', 'south asian', 'east asian', 'chinese', 'indian', 'middle eastern', 'arab', 'mixed heritage', 'mixed race',
      'community', 'inclusive', 'diversity', 'intersectional'
    ];
    
    const content = `${event.name} ${event.description}`.toLowerCase();
    const matchingKeywords = relevanceKeywords.filter(keyword => content.includes(keyword));
    const matchCount = matchingKeywords.length;
    
    console.log(`Relevance keywords found: [${matchingKeywords.join(', ')}]`);
    console.log(`Match count: ${matchCount}`);
    console.log(`Passes relevance check (>= 1): ${matchCount >= 1}`);
    
    if (matchCount >= 1) {
      console.log('✅ Event passes all checks and would be created!');
    } else {
      console.log('❌ Event fails relevance check');
    }
  }
}

debugEventCreationPipeline().catch(console.error);