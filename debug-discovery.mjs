// Debug the discovery process step by step
const apiKey = 'jina_5fb235d4d56843f282c26e50f3c97e63e5MR_Rrpc44DDnv46t1lkAtwiYjL';

async function testSearch() {
  console.log('Testing JinaAI search...');
  
  const response = await fetch('https://s.jina.ai/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      q: 'Black QTIPOC+ events UK community eventbrite'
    })
  });
  
  if (!response.ok) {
    console.error('Search failed:', response.status, response.statusText);
    return [];
  }
  
  const text = await response.text();
  console.log('Search successful, parsing results...');
  
  // Parse the results
  const results = [];
  const entries = text.split(/\[\d+\]/);
  
  for (const entry of entries) {
    if (entry.trim().length < 50) continue;
    
    const titleMatch = entry.match(/Title:\s*(.+?)(?:\n|$)/);
    const title = titleMatch?.[1]?.trim();
    
    const urlMatch = entry.match(/URL Source:\s*(.+?)(?:\n|$)/);
    const url = urlMatch?.[1]?.trim();
    
    const descMatch = entry.match(/Description:\s*(.+?)(?:\n|$)/);
    const description = descMatch?.[1]?.trim();
    
    if (title && url && description) {
      results.push({ title, url, description });
      console.log(`Found: ${title}`);
    }
  }
  
  console.log(`Total parsed results: ${results.length}`);
  return results;
}

async function testEventExtraction(url) {
  console.log(`\nTesting event extraction from: ${url}`);
  
  try {
    const response = await fetch('https://r.jina.ai/' + encodeURIComponent(url), {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-Return-Format': 'markdown',
        'X-Timeout': '30'
      }
    });
    
    if (!response.ok) {
      console.error('Reader failed:', response.status);
      return null;
    }
    
    const markdown = await response.text();
    console.log('Reader response preview:', markdown.substring(0, 300));
    
    // Try to extract basic event info
    const titleMatch = markdown.match(/^#\s*(.+)$/m) || markdown.match(/\*\*(.+)\*\*/);
    const title = titleMatch?.[1]?.trim() || 'Community Event';
    console.log('Extracted title:', title);
    
    return { title, markdown: markdown.substring(0, 500) };
    
  } catch (error) {
    console.error('Error extracting event:', error);
    return null;
  }
}

async function runDebug() {
  console.log('=== DEBUGGING JINA AI DISCOVERY ===\n');
  
  // Test search
  const searchResults = await testSearch();
  
  if (searchResults.length > 0) {
    console.log('\n=== TESTING EVENT EXTRACTION ===');
    // Test extraction on first result
    const firstResult = searchResults[0];
    await testEventExtraction(firstResult.url);
  } else {
    console.log('No search results to test extraction with');
  }
}

runDebug().catch(console.error);