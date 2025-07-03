// Debug the discovery process step by step
import { jinaAIService } from './src/services/jinaAIService.ts';

const apiKey = 'jina_5fb235d4d56843f282c26e50f3c97e63e5MR_Rrpc44DDnv46t1lkAtwiYjL';

async function debugDiscoveryProcess() {
  console.log('=== DEBUGGING DISCOVERY PROCESS ===');
  
  // Test 1: Check API key
  console.log('1. API Key configured:', apiKey ? 'Yes' : 'No');
  
  // Test 2: Try the jinaAIService directly
  console.log('\n2. Testing jinaAIService.quickDiscovery()...');
  try {
    const events = await jinaAIService.quickDiscovery();
    console.log(`Found ${events.length} events`);
    events.forEach((event, i) => {
      console.log(`Event ${i + 1}:`, {
        name: event.name,
        description: event.description.substring(0, 100) + '...',
        location: event.location,
        source: event.source,
        url: event.source_url
      });
    });
  } catch (error) {
    console.error('Error in quickDiscovery:', error);
  }
  
  // Test 3: Test the search function directly
  console.log('\n3. Testing search function directly...');
  try {
    const searchResults = await testSearch();
    console.log(`Search returned ${searchResults.length} results`);
    searchResults.forEach((result, i) => {
      console.log(`Result ${i + 1}:`, {
        title: result.title?.substring(0, 50) + '...',
        url: result.url
      });
    });
  } catch (error) {
    console.error('Error in search:', error);
  }
}

async function testSearch() {
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
  
  const text = await response.text();
  console.log('Raw search response preview:', text.substring(0, 300));
  
  // Use the same parsing logic as the service
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
      results.push({ title, url, description, content: entry.substring(0, 500) });
    }
  }
  
  return results;
}

debugDiscoveryProcess();