// Check the exact response format from JinaAI
const apiKey = 'jina_5fb235d4d56843f282c26e50f3c97e63e5MR_Rrpc44DDnv46t1lkAtwiYjL';

async function checkResponseFormat() {
  console.log('Checking JinaAI response format...');
  
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
  
  console.log('=== FULL RESPONSE ===');
  console.log(text);
  
  console.log('\n=== SPLITTING BY [1], [2], etc. ===');
  const entries = text.split(/\[\d+\]/);
  console.log(`Split into ${entries.length} entries`);
  
  entries.forEach((entry, i) => {
    if (entry.trim().length > 10) {
      console.log(`\n--- Entry ${i} (${entry.length} chars) ---`);
      console.log(entry.substring(0, 200) + '...');
      
      // Try to find patterns
      const titleMatch = entry.match(/Title:\s*(.+?)(?:\n|$)/);
      const urlMatch = entry.match(/URL Source:\s*(.+?)(?:\n|$)/);
      const descMatch = entry.match(/Description:\s*(.+?)(?:\n|$)/);
      
      console.log('Title match:', titleMatch?.[1] || 'NONE');
      console.log('URL match:', urlMatch?.[1] || 'NONE');
      console.log('Desc match:', descMatch?.[1] || 'NONE');
    }
  });
}

checkResponseFormat().catch(console.error);