import puppeteer from 'puppeteer';

// Test scraper to explore what's possible with Eventbrite public pages
class EventbriteScraper {
  constructor() {
    this.browser = null;
  }

  async initialize() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  async scrapeEventbriteSearch(searchTerm, location = 'United Kingdom') {
    if (!this.browser) await this.initialize();
    
    const page = await this.browser.newPage();
    
    try {
      // Set realistic user agent
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Go to Eventbrite search page
      const searchUrl = `https://www.eventbrite.co.uk/d/${encodeURIComponent(location.toLowerCase().replace(/\s+/g, '-'))}/${encodeURIComponent(searchTerm)}/`;
      console.log(`\n🔍 Scraping: ${searchUrl}`);
      
      await page.goto(searchUrl, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Wait for content to load
      await page.waitForTimeout(3000);

      // Try to find event cards with various selectors
      const events = await page.evaluate(() => {
        const results = [];
        
        // Try multiple possible selectors for event cards
        const selectors = [
          '[data-testid="search-event-card"]',
          '[data-testid="event-card"]', 
          '.search-event-card',
          '.event-card',
          '.eds-event-card',
          '[class*="event-card"]',
          '[class*="search-event"]'
        ];
        
        let eventCards = [];
        for (const selector of selectors) {
          eventCards = document.querySelectorAll(selector);
          if (eventCards.length > 0) {
            console.log(`Found ${eventCards.length} events with selector: ${selector}`);
            break;
          }
        }
        
        if (eventCards.length === 0) {
          // Fallback: try to find any elements that might be events
          const possibleEvents = document.querySelectorAll('a[href*="/e/"]');
          console.log(`Fallback: Found ${possibleEvents.length} possible event links`);
          
          possibleEvents.forEach((link, index) => {
            if (index < 5) { // Limit to first 5 for testing
              const parent = link.closest('div');
              results.push({
                title: link.textContent?.trim() || 'Unknown',
                url: link.href,
                rawHTML: parent?.innerHTML?.substring(0, 200) || ''
              });
            }
          });
          
          return results;
        }

        // Extract data from found event cards
        eventCards.forEach((card, index) => {
          try {
            const event = {
              index: index,
              title: null,
              date: null,
              location: null,
              organizer: null,
              price: null,
              url: null,
              description: null
            };

            // Try various selectors for title
            const titleSelectors = ['h3', '[data-testid="event-title"]', '.event-title', '[class*="title"]'];
            for (const sel of titleSelectors) {
              const titleEl = card.querySelector(sel);
              if (titleEl && titleEl.textContent.trim()) {
                event.title = titleEl.textContent.trim();
                break;
              }
            }

            // Try various selectors for date
            const dateSelectors = ['[data-testid="event-datetime"]', '.event-date', '[class*="date"]', 'time'];
            for (const sel of dateSelectors) {
              const dateEl = card.querySelector(sel);
              if (dateEl && dateEl.textContent.trim()) {
                event.date = dateEl.textContent.trim();
                break;
              }
            }

            // Try to find event URL
            const linkEl = card.querySelector('a[href*="/e/"]');
            if (linkEl) {
              event.url = linkEl.href;
            }

            // Get location
            const locationSelectors = ['[data-testid="event-location"]', '.event-location', '[class*="location"]'];
            for (const sel of locationSelectors) {
              const locEl = card.querySelector(sel);
              if (locEl && locEl.textContent.trim()) {
                event.location = locEl.textContent.trim();
                break;
              }
            }

            // Get organizer
            const organizerSelectors = ['[data-testid="organizer-name"]', '.organizer', '[class*="organizer"]'];
            for (const sel of organizerSelectors) {
              const orgEl = card.querySelector(sel);
              if (orgEl && orgEl.textContent.trim()) {
                event.organizer = orgEl.textContent.trim();
                break;
              }
            }

            // Only add if we got at least a title
            if (event.title) {
              results.push(event);
            }
          } catch (error) {
            console.log(`Error extracting event ${index}:`, error.message);
          }
        });

        return results;
      });

      console.log(`✅ Found ${events.length} events`);
      return events;

    } catch (error) {
      console.error(`❌ Error scraping ${searchTerm}:`, error.message);
      return [];
    } finally {
      await page.close();
    }
  }

  async testMultipleSearches() {
    const searches = [
      'black',
      'lgbtq',
      'queer', 
      'pride',
      'community'
    ];

    const allResults = {};

    for (const searchTerm of searches) {
      console.log(`\n📊 Testing search: "${searchTerm}"`);
      const events = await this.scrapeEventbriteSearch(searchTerm);
      allResults[searchTerm] = events;
      
      // Show sample results
      if (events.length > 0) {
        console.log(`\n📋 Sample events for "${searchTerm}":`);
        events.slice(0, 3).forEach((event, i) => {
          console.log(`\n${i + 1}. ${event.title || 'No title'}`);
          console.log(`   Date: ${event.date || 'No date'}`);
          console.log(`   Location: ${event.location || 'No location'}`);
          console.log(`   URL: ${event.url || 'No URL'}`);
        });
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return allResults;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Function to analyze QTIPOC+ relevance
function analyzeRelevance(events) {
  const qtipocKeywords = [
    'black', 'african', 'caribbean', 'diaspora',
    'qtipoc', 'queer', 'trans', 'lgbtq', 'gay', 'lesbian',
    'poc', 'bipoc', 'community', 'pride'
  ];

  return events.map(event => {
    const searchText = `${event.title} ${event.description || ''}`.toLowerCase();
    let relevanceScore = 0;
    const matchedKeywords = [];

    qtipocKeywords.forEach(keyword => {
      if (searchText.includes(keyword)) {
        relevanceScore += 1;
        matchedKeywords.push(keyword);
      }
    });

    return {
      ...event,
      relevanceScore,
      matchedKeywords,
      isRelevant: relevanceScore >= 2
    };
  });
}

// Main execution
async function main() {
  console.log('🚀 Starting Eventbrite Scraping Test\n');
  
  const scraper = new EventbriteScraper();
  
  try {
    const results = await scraper.testMultipleSearches();
    
    // Analyze overall results
    console.log('\n\n📊 SCRAPING ANALYSIS');
    console.log('========================');
    
    let totalEvents = 0;
    let relevantEvents = 0;
    
    Object.entries(results).forEach(([searchTerm, events]) => {
      const analyzed = analyzeRelevance(events);
      const relevant = analyzed.filter(e => e.isRelevant);
      
      totalEvents += events.length;
      relevantEvents += relevant.length;
      
      console.log(`\n"${searchTerm}": ${events.length} total, ${relevant.length} relevant`);
      
      if (relevant.length > 0) {
        relevant.slice(0, 2).forEach(event => {
          console.log(`  ✅ ${event.title}`);
          console.log(`     Keywords: ${event.matchedKeywords.join(', ')}`);
        });
      }
    });
    
    console.log(`\n🎯 SUMMARY:`);
    console.log(`Total events found: ${totalEvents}`);
    console.log(`Potentially relevant: ${relevantEvents}`);
    console.log(`Relevance rate: ${totalEvents > 0 ? (relevantEvents/totalEvents*100).toFixed(1) : 0}%`);
    
    if (totalEvents === 0) {
      console.log('\n⚠️  No events found. This could mean:');
      console.log('   - Eventbrite changed their HTML structure');
      console.log('   - Anti-bot measures are active');
      console.log('   - The search URLs have changed');
      console.log('   - Network/timing issues');
    }
    
  } catch (error) {
    console.error('💥 Scraping test failed:', error);
  } finally {
    await scraper.cleanup();
  }
}

// Export for use as module
export { EventbriteScraper, analyzeRelevance };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}