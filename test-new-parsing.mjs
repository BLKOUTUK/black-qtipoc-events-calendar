// Test the new parsing logic
const response = `[1] Title: Third Space for QTIPOC+
[1] URL Source: https://www.eventbrite.co.uk/e/third-space-for-qtipoc-tickets-1351512964659
[1] Description: Eventbrite - Exhale.group presents Third Space for QTIPOC+ - Saturday, May 17, 2025 - Find event and ticket information.

[2] Title: Black & POC Queer Social
[2] URL Source: https://www.eventbrite.co.uk/e/black-poc-queer-social-tickets-1335181857879
[2] Description: Eventbrite - Fruit Punch presents Black & POC Queer Social - Wednesday, May 7, 2025 | Wednesday, December 3, 2025 at The Victoria, Birmingham, Birmingham, England. Find event and ticket information.`;

function parseSearchResults(text) {
  const results = [];
  
  // Find all numbered entries like [1] Title:, [2] Title:, etc.
  const entryPattern = /\[(\d+)\]\s*Title:\s*(.+?)(?:\n|\r)/g;
  let match;
  
  while ((match = entryPattern.exec(text)) !== null) {
    const entryNum = match[1];
    const title = match[2].trim();
    
    console.log(`Found entry ${entryNum}: ${title}`);
    
    // Find the corresponding URL and Description for this entry number
    const urlPattern = new RegExp(`\\[${entryNum}\\]\\s*URL Source:\\s*(.+?)(?:\\n|\\r|$)`, 'i');
    const descPattern = new RegExp(`\\[${entryNum}\\]\\s*Description:\\s*(.+?)(?:\\n|\\r|$)`, 'i');
    
    const urlMatch = text.match(urlPattern);
    const descMatch = text.match(descPattern);
    
    console.log('URL match:', urlMatch?.[1]);
    console.log('Desc match:', descMatch?.[1]);
    
    if (title && urlMatch && descMatch) {
      const url = urlMatch[1].trim();
      const description = descMatch[1].trim();
      
      results.push({
        title,
        url,
        description,
        content: `${title} - ${description}`
      });
      
      console.log(`✅ Parsed event ${entryNum}: ${title}`);
    } else {
      console.log(`❌ Missing data for entry ${entryNum}`);
    }
  }
  
  console.log(`\nTotal parsed: ${results.length} events`);
  return results;
}

console.log('Testing new parsing logic...');
const results = parseSearchResults(response);

results.forEach((result, i) => {
  console.log(`\n${i + 1}. ${result.title}`);
  console.log(`   URL: ${result.url}`);
  console.log(`   Desc: ${result.description.substring(0, 80)}...`);
});