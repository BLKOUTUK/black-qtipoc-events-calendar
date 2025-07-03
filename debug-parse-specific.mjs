// Test the exact parsing logic on this response
const response = `[1] Title: Third Space for QTIPOC+
[1] URL Source: https://www.eventbrite.co.uk/e/third-space-for-qtipoc-tickets-1351512964659
[1] Description: Eventbrite - Exhale.group presents Third Space for QTIPOC+ - Saturday, May 17, 2025 - Find event and ticket information.

[2] Title: Black & POC Queer Social
[2] URL Source: https://www.eventbrite.co.uk/e/black-poc-queer-social-tickets-1335181857879
[2] Description: Eventbrite - Fruit Punch presents Black & POC Queer Social - Wednesday, May 7, 2025 | Wednesday, December 3, 2025 at The Victoria, Birmingham, Birmingham, England. Find event and ticket information.`;

console.log('Testing parsing on sample response...');

// Use the same parsing logic as the service
const results = [];
const entries = response.split(/\[\d+\]/);

console.log(`Split into ${entries.length} entries`);

for (let i = 0; i < entries.length; i++) {
  const entry = entries[i];
  console.log(`\n--- Entry ${i} (${entry.length} chars) ---`);
  console.log('Entry content:', entry.substring(0, 200));
  
  if (entry.trim().length < 50) {
    console.log('Skipping short entry');
    continue;
  }
  
  // Extract title (after "Title:")
  const titleMatch = entry.match(/Title:\s*(.+?)(?:\n|$)/);
  const title = titleMatch?.[1]?.trim();
  console.log('Title regex result:', titleMatch);
  console.log('Extracted title:', title);
  
  // Extract URL (after "URL Source:")
  const urlMatch = entry.match(/URL Source:\s*(.+?)(?:\n|$)/);
  const url = urlMatch?.[1]?.trim();
  console.log('URL regex result:', urlMatch);
  console.log('Extracted URL:', url);
  
  // Extract description (after "Description:")
  const descMatch = entry.match(/Description:\s*(.+?)(?:\n|$)/);
  const description = descMatch?.[1]?.trim();
  console.log('Desc regex result:', descMatch);
  console.log('Extracted description:', description);
  
  if (title && url && description) {
    const result = {
      title,
      url,
      description,
      content: entry.substring(0, 500)
    };
    results.push(result);
    console.log('✅ Added result:', result.title);
  } else {
    console.log('❌ Missing required fields');
  }
}

console.log(`\nFinal results: ${results.length}`);
results.forEach((result, i) => {
  console.log(`${i + 1}. ${result.title} - ${result.url}`);
});