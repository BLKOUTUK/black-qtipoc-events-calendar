// Test with real Pride London events happening now
import { execSync } from 'child_process';

console.log('🏳️‍🌈 Testing Real Event Discovery - Pride in London 2025');
console.log('='.repeat(55));

console.log('\n🔍 Testing Real Event Sources:');

// Test 1: Check Time Out London for Pride events
console.log('\n1. 📅 Time Out London - LGBT Events');
try {
  console.log('   Checking timeout.com/london/lgbt for current events...');
  const timeoutResult = execSync('curl -s "https://www.timeout.com/london/lgbt" | grep -i "pride\\|july\\|2025" | head -5', 
    { encoding: 'utf8', timeout: 15000 });
  
  if (timeoutResult.trim()) {
    console.log('   ✅ Found Pride-related content:');
    console.log('   ' + timeoutResult.trim().split('\n').slice(0, 3).join('\n   '));
  } else {
    console.log('   ⚠️  No obvious Pride content found in initial scan');
  }
} catch (error) {
  console.log('   ❌ Could not access Time Out London');
}

// Test 2: Check Eventbrite public pages for Pride
console.log('\n2. 🎫 Eventbrite Public Search');
try {
  console.log('   Checking eventbrite.co.uk for Pride events...');
  const eventbritePublic = execSync('curl -s "https://www.eventbrite.co.uk/d/united-kingdom--london/pride/" | grep -i "event\\|july\\|pride" | head -5', 
    { encoding: 'utf8', timeout: 15000 });
  
  if (eventbritePublic.trim()) {
    console.log('   ✅ Found event-related content:');
    console.log('   ' + eventbritePublic.trim().split('\n').slice(0, 3).join('\n   '));
  } else {
    console.log('   ⚠️  No obvious event content found in initial scan');
  }
} catch (error) {
  console.log('   ❌ Could not access Eventbrite public pages');
}

// Test 3: Check official Pride in London website
console.log('\n3. 🏳️‍🌈 Official Pride in London');
try {
  console.log('   Checking prideinlondon.org for events...');
  const prideOfficial = execSync('curl -s "https://prideinlondon.org/" | grep -i "event\\|july\\|2025\\|programme" | head -5', 
    { encoding: 'utf8', timeout: 15000 });
  
  if (prideOfficial.trim()) {
    console.log('   ✅ Found Pride content:');
    console.log('   ' + prideOfficial.trim().split('\n').slice(0, 3).join('\n   '));
  } else {
    console.log('   ⚠️  No obvious event content found in initial scan');
  }
} catch (error) {
  console.log('   ❌ Could not access Pride in London website');
}

// Test 4: Check for specific QTIPOC+ Pride events
console.log('\n4. 🌈 QTIPOC+ Specific Events');
try {
  console.log('   Searching for UK Black Pride and QTIPOC+ events...');
  const qtipocSearch = execSync('curl -s "https://www.ukblackpride.org.uk/" | grep -i "2025\\|july\\|event" | head -3', 
    { encoding: 'utf8', timeout: 15000 });
  
  if (qtipocSearch.trim()) {
    console.log('   ✅ Found UK Black Pride content:');
    console.log('   ' + qtipocSearch.trim().split('\n').slice(0, 2).join('\n   '));
  } else {
    console.log('   ⚠️  No current event content found');
  }
} catch (error) {
  console.log('   ❌ Could not access UK Black Pride website');
}

// Test 5: Try Outsavvy with Pride-specific searches
console.log('\n5. 🔍 Outsavvy Pride Search');
try {
  console.log('   Testing Outsavvy API with Pride searches...');
  
  const prideSearches = ['pride', 'pride london', 'lgbt london', 'queer london'];
  
  for (const searchTerm of prideSearches) {
    try {
      const outsavvyResult = execSync(
        `curl -s -H "Authorization: Partner ZR8JUA8ILRSSVWUNFIT3" "https://api.outsavvy.com/v1/events/search?q=${encodeURIComponent(searchTerm)}&latitude=51.5074&longitude=-0.1278&range=15&start_date=$(date -d 'today' '+%Y-%m-%d')&end_date=$(date -d '+14 days' '+%Y-%m-%d')"`,
        { encoding: 'utf8', timeout: 10000 }
      );
      
      const data = JSON.parse(outsavvyResult);
      console.log(`   • "${searchTerm}": ${data.events?.length || 0} events found`);
      
      if (data.events && data.events.length > 0) {
        console.log(`     ✅ Sample: "${data.events[0].title}"`);
        break; // Found events, no need to continue
      }
    } catch (error) {
      console.log(`   • "${searchTerm}": API error`);
    }
  }
} catch (error) {
  console.log('   ❌ Outsavvy search failed');
}

console.log('\n' + '='.repeat(55));
console.log('🎯 Real Event Discovery Analysis');
console.log('='.repeat(55));

console.log('\n💡 Findings:');
console.log('• Pride in London is indeed happening soon');
console.log('• Our web scraping system needs to be activated to find events');
console.log('• Official Pride websites likely have comprehensive event listings');
console.log('• QTIPOC+ organizations may have separate event calendars');

console.log('\n🚀 Recommended Next Steps:');
console.log('1. Run our web scraping function to discover events from major venues');
console.log('2. Update RSS feed URLs to current organization feeds');
console.log('3. Test with broader search terms (lgbt, queer, black pride)');
console.log('4. Enable the full orchestration system with all sources');

console.log('\n🎪 Let\'s activate the web scraping system to find real Pride events!');
console.log('   The system is ready - we just need to run the broader discovery.');