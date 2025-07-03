// Simple test of JinaAI integration
console.log('Testing JinaAI integration...');

// Test 1: Check if we have the API key
const apiKey = 'jina_5fb235d4d56843f282c26e50f3c97e63e5MR_Rrpc44DDnv46t1lkAtwiYjL';
console.log('API key configured:', apiKey ? 'Yes' : 'No');

// Test 2: Try a simple search without authentication first
async function testBasicSearch() {
  try {
    console.log('Testing basic search...');
    const response = await fetch('https://s.jina.ai/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: 'Black QTIPOC events UK eventbrite'
      })
    });
    
    console.log('Response status:', response.status);
    const text = await response.text();
    console.log('Response preview:', text.substring(0, 200));
  } catch (error) {
    console.error('Basic search error:', error);
  }
}

// Test 3: Try with authorization header
async function testAuthSearch() {
  try {
    console.log('Testing search with auth...');
    const response = await fetch('https://s.jina.ai/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        q: 'Black QTIPOC events UK eventbrite'
      })
    });
    
    console.log('Auth response status:', response.status);
    const text = await response.text();
    console.log('Auth response preview:', text.substring(0, 200));
  } catch (error) {
    console.error('Auth search error:', error);
  }
}

// Run tests
testBasicSearch().then(() => testAuthSearch());