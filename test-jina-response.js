// Test full JinaAI response format
const apiKey = 'jina_5fb235d4d56843f282c26e50f3c97e63e5MR_Rrpc44DDnv46t1lkAtwiYjL';

async function testFullResponse() {
  try {
    console.log('Testing full Jina response...');
    const response = await fetch('https://s.jina.ai/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-Return-Format': 'json'
      },
      body: JSON.stringify({
        q: 'Black QTIPOC events UK eventbrite'
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', [...response.headers.entries()]);
    
    const text = await response.text();
    console.log('Full response:', text);
    
    // Try parsing as JSON
    try {
      const json = JSON.parse(text);
      console.log('Parsed as JSON:', json);
    } catch (parseError) {
      console.log('Not JSON format, text response:', text.length, 'characters');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testFullResponse();