// Test the minimal discovery process to see where it's failing
const apiKey = 'jina_5fb235d4d56843f282c26e50f3c97e63e5MR_Rrpc44DDnv46t1lkAtwiYjL';

async function testMinimalDiscovery() {
  console.log('=== MINIMAL DISCOVERY TEST ===\n');
  
  const sourceUrl = 'https://www.eventbrite.co.uk/cc/bpoc-events-4056573';
  
  try {
    console.log('1. Fetching markdown...');
    const response = await fetch('https://r.jina.ai/' + encodeURIComponent(sourceUrl), {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-Return-Format': 'markdown',
        'X-Remove-Selector': 'nav, footer, .ads, .sidebar, .header, .cookies',
        'X-Target-Selector': '.event-card, .event-item, [data-event], .search-result',
        'X-Timeout': '30'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const markdown = await response.text();
    console.log(`✅ Got ${markdown.length} characters`);
    
    console.log('\n2. Testing simplified patterns...');
    
    // Test the new simplified patterns
    const patterns = [
      { name: 'Header ###', regex: /^### (.+)$/gm },
      { name: 'Header ##', regex: /^## (.+)$/gm },
      { name: 'Header #', regex: /^# (.+)$/gm },
      { name: 'Bold **', regex: /\*\*(.+?)\*\*/g },
      { name: 'Links []', regex: /\[([^\]]+)\]\([^)]+\)/g }
    ];
    
    let totalEvents = [];
    
    for (const pattern of patterns) {
      const matches = [...markdown.matchAll(pattern.regex)];
      console.log(`${pattern.name}: ${matches.length} matches`);
      
      if (matches.length > 0) {
        console.log(`  Sample: "${matches[0][1]?.substring(0, 50)}..."`);
        
        // Create events from matches
        for (let i = 0; i < Math.min(3, matches.length); i++) {
          const title = matches[i][1]?.trim();
          if (title && title.length >= 10) {
            
            const event = {
              id: `test_${Date.now()}_${i}`,
              name: title,
              description: `${title}. Discovered from ${sourceUrl}.`,
              event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              location: 'London, UK',
              source: 'eventbrite',
              source_url: sourceUrl,
              organizer_name: 'Eventbrite Community',
              tags: ['test'],
              status: 'draft',
              price: 'TBD',
              scraped_date: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            // Test relevance
            const relevanceKeywords = [
              'qtipoc', 'bpoc', 'bipoc', 'queer', 'lgbtq', 'lgbt', 'black', 'african', 'caribbean',
              'asian', 'poc', 'community', 'trans', 'lesbian', 'gay', 'bisexual'
            ];
            
            const content = `${event.name} ${event.description}`.toLowerCase();
            const matches = relevanceKeywords.filter(keyword => content.includes(keyword));
            
            if (matches.length >= 1) {
              totalEvents.push(event);
              console.log(`  ✅ Created event: "${title}" (${matches.length} keywords: ${matches.join(', ')})`);
            } else {
              console.log(`  ❌ Rejected: "${title}" (no matching keywords)`);
            }
          }
        }
      }
    }
    
    console.log(`\n3. Summary:`);
    console.log(`Total events created: ${totalEvents.length}`);
    
    if (totalEvents.length > 0) {
      console.log('\nSample events:');
      totalEvents.slice(0, 3).forEach((event, i) => {
        console.log(`${i + 1}. "${event.name}"`);
        console.log(`   ID: ${event.id}`);
        console.log(`   Status: ${event.status}`);
      });
    } else {
      console.log('❌ No events created - this explains why discovery returns 0!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testMinimalDiscovery().catch(console.error);