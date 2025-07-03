// Test the Reader-first approach on UK event sources
const apiKey = 'jina_5fb235d4d56843f282c26e50f3c97e63e5MR_Rrpc44DDnv46t1lkAtwiYjL';

const ukEventSources = [
  'https://www.eventbrite.com/d/united-kingdom/black-events',
  'https://www.eventbrite.co.uk/cc/bpoc-events-4056573', // BPOC events collection
  'https://www.eventbrite.com/d/united-kingdom--london/lgbtq-events'
];

async function testReaderApproach() {
  console.log('Testing Reader-first approach on UK event sources...\n');
  
  for (const sourceUrl of ukEventSources) {
    console.log(`\n=== Testing: ${sourceUrl} ===`);
    
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
      
      if (!response.ok) {
        console.error(`❌ Failed: ${response.status} ${response.statusText}`);
        continue;
      }
      
      const markdown = await response.text();
      console.log(`✅ Success: Retrieved ${markdown.length} characters`);
      console.log(`Preview: ${markdown.substring(0, 300)}...`);
      
      // Look for event patterns
      const eventTitles = markdown.match(/#{1,3}\s*(.+)/g) || [];
      const boldTitles = markdown.match(/\*\*(.+?)\*\*/g) || [];
      const links = markdown.match(/\[(.+?)\]\([^)]+\)/g) || [];
      
      console.log(`Found patterns:`);
      console.log(`- Headers: ${eventTitles.length}`);
      console.log(`- Bold text: ${boldTitles.length}`);
      console.log(`- Links: ${links.length}`);
      
      if (eventTitles.length > 0) {
        console.log(`Sample headers:`);
        eventTitles.slice(0, 3).forEach((title, i) => {
          console.log(`  ${i + 1}. ${title.trim()}`);
        });
      }
      
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
    
    // Wait between requests
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
}

testReaderApproach().catch(console.error);