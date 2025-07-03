// Test the full pipeline to see where it's failing
const apiKey = 'jina_5fb235d4d56843f282c26e50f3c97e63e5MR_Rrpc44DDnv46t1lkAtwiYjL';

async function testFullPipeline() {
  console.log('=== TESTING FULL DISCOVERY PIPELINE ===\n');
  
  // Test the BPOC events collection (we know this works)
  const sourceUrl = 'https://www.eventbrite.co.uk/cc/bpoc-events-4056573';
  
  console.log(`1. Extracting from: ${sourceUrl}`);
  
  try {
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
    
    console.log('2. Testing parsing patterns...');
    
    // Test the same patterns as the service
    const eventPatterns = [
      // Eventbrite patterns
      /#{1,3}\s*(.+?)(?:\n|\r)[\s\S]*?(?:£|\$|Free|From)[\s\S]*?(?:https?:\/\/[^\s]+)/g,
      // Date + title patterns
      /\*\*(.+?)\*\*[\s\S]*?(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[\s\S]*?(?:£|\$|Free)/g,
      // Link + description patterns
      /\[(.+?)\]\(([^)]+)\)[\s\S]*?(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)/g
    ];

    let totalMatches = 0;
    eventPatterns.forEach((pattern, i) => {
      console.log(`\nPattern ${i + 1}: ${pattern}`);
      const matches = [...markdown.matchAll(pattern)];
      console.log(`Found ${matches.length} matches`);
      
      matches.slice(0, 3).forEach((match, j) => {
        console.log(`  Match ${j + 1}: "${match[1]?.trim()}"`);
      });
      
      totalMatches += matches.length;
    });
    
    console.log(`\nTotal matches across all patterns: ${totalMatches}`);
    
    // Test simpler patterns
    console.log('\n3. Testing simpler patterns...');
    
    const simplePatterns = [
      /### (.+)/g,  // Headers
      /\*\*(.+?)\*\*/g,  // Bold text
      /\[(.+?)\]\(([^)]+)\)/g  // Links
    ];
    
    simplePatterns.forEach((pattern, i) => {
      const matches = [...markdown.matchAll(pattern)];
      console.log(`Simple pattern ${i + 1}: ${matches.length} matches`);
      
      if (matches.length > 0) {
        matches.slice(0, 5).forEach((match, j) => {
          console.log(`  "${match[1]?.trim()}"`);
        });
      }
    });
    
    // Check for QTIPOC keywords
    console.log('\n4. Checking for QTIPOC content...');
    const qtipocKeywords = ['qtipoc', 'bpoc', 'black', 'queer', 'trans', 'lgbtq', 'poc'];
    qtipocKeywords.forEach(keyword => {
      const count = (markdown.toLowerCase().match(new RegExp(keyword, 'g')) || []).length;
      console.log(`  "${keyword}": ${count} occurrences`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testFullPipeline().catch(console.error);