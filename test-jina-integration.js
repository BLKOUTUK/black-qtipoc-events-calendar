// Test script for Jina AI integration
// Run this in the browser console to test real API calls

console.log('🧪 Testing Jina AI Integration with Real Data');

// Test 1: Basic Search API functionality
async function testJinaSearch() {
  console.log('\n📡 Test 1: Jina AI Search API');
  
  try {
    const response = await fetch('https://s.jina.ai/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Locale': 'UK',
        'X-Return-Format': 'json'
      },
      body: JSON.stringify({
        q: 'Black QTIPOC+ events London UK 2025'
      })
    });
    
    const data = await response.json();
    console.log('✅ Search API Response:', data);
    
    if (data.data && data.data.length > 0) {
      console.log(`Found ${data.data.length} potential event sources`);
      console.log('Sample result:', data.data[0]);
    }
    
  } catch (error) {
    console.log('❌ Search API Error:', error);
    console.log('💡 This is expected without API key - system will use mock data');
  }
}

// Test 2: Enhanced Discovery Engine
async function testEnhancedDiscovery() {
  console.log('\n🔍 Test 2: Enhanced Discovery Engine');
  
  try {
    // Import the discovery engine
    const { enhancedDiscoveryEngine } = await import('./src/services/enhancedDiscoveryEngine.js');
    
    console.log('Running quick discovery...');
    const events = await enhancedDiscoveryEngine.runDiscovery('quick');
    
    console.log(`✅ Discovery completed: ${events.length} events found`);
    
    if (events.length > 0) {
      console.log('Sample discovered event:', events[0]);
      
      // Show event quality scores
      const qualityEvents = events.filter(e => e.relevance_score > 0.6);
      console.log(`${qualityEvents.length} high-quality events (>60% relevance)`);
    }
    
    // Get discovery stats
    const stats = enhancedDiscoveryEngine.getDiscoveryStats();
    console.log('Discovery statistics:', stats);
    
  } catch (error) {
    console.log('❌ Discovery Engine Error:', error);
    console.log('💡 Make sure you\'re on the IVOR calendar page');
  }
}

// Test 3: Community Intelligence
async function testCommunityIntelligence() {
  console.log('\n🧠 Test 3: Community Intelligence');
  
  try {
    // Get published events for analysis
    const { googleSheetsService } = await import('./src/services/googleSheetsService.js');
    const events = await googleSheetsService.getPublishedEvents();
    
    console.log(`Analyzing ${events.length} events for community intelligence...`);
    
    // Generate intelligence
    const { jinaAIService } = await import('./src/services/jinaAIService.js');
    const intelligence = await jinaAIService.generateCommunityIntelligence(events);
    
    console.log('✅ Community Intelligence:', intelligence);
    console.log('📈 Trending topics:', intelligence.trendingTopics);
    console.log('🏢 Emerging organizers:', intelligence.emergingOrganizers);
    console.log('📍 Location hotspots:', intelligence.locationHotspots);
    console.log('♿ Accessibility score:', intelligence.accessibilityScore + '%');
    
  } catch (error) {
    console.log('❌ Intelligence Error:', error);
  }
}

// Test 4: Real-time search with current queries
async function testRealTimeSearch() {
  console.log('\n🔍 Test 4: Real-time QTIPOC+ Event Search');
  
  const queries = [
    'Black QTIPOC+ events UK 2025',
    'queer people of colour London events',
    'Black trans community workshops UK',
    'QTIPOC healing justice events',
    'Black queer arts festivals UK'
  ];
  
  for (const query of queries) {
    console.log(`\nSearching: "${query}"`);
    
    try {
      const response = await fetch('https://s.jina.ai/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Locale': 'UK',
          'X-Return-Format': 'json',
          'X-Timeout': '30'
        },
        body: JSON.stringify({ q: query })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`  ✅ Found ${data.data?.length || 0} potential sources`);
        
        if (data.data && data.data.length > 0) {
          // Show first result
          const firstResult = data.data[0];
          console.log(`  📄 Sample: ${firstResult.title}`);
          console.log(`  🔗 URL: ${firstResult.url}`);
        }
      }
      
    } catch (error) {
      console.log(`  ❌ Search failed: ${error.message}`);
    }
    
    // Small delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting comprehensive Jina AI integration tests...');
  console.log('💡 Some tests may show errors without API key - this is expected');
  
  await testJinaSearch();
  await testEnhancedDiscovery();
  await testCommunityIntelligence();
  
  // Only run real-time search if user confirms
  if (confirm('Run real-time search tests? (This will make actual API calls)')) {
    await testRealTimeSearch();
  }
  
  console.log('\n✨ Testing complete! Check the Intelligence Dashboard for full features.');
}

// Auto-run tests
runAllTests();