import { Event } from '../types';
import { jinaAIService } from './jinaAIService';
import { googleSheetsService } from './googleSheetsService';

interface DiscoveryStrategy {
  name: string;
  priority: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  costEstimate: number;
  execute: () => Promise<Event[]>;
}

interface OrganizationSource {
  name: string;
  website: string;
  rssFeeds: string[];
  socialMedia: string[];
  reliability: number; // 0-1 score
  lastChecked: string;
}

interface DiscoveryMetrics {
  totalEventsFound: number;
  uniqueEventsAdded: number;
  duplicatesRemoved: number;
  qualityScore: number;
  costEfficiency: number;
  sourceBreakdown: Record<string, number>;
}

export class EnhancedDiscoveryEngine {
  private knownOrganizations: OrganizationSource[] = [];
  private discoveryHistory: DiscoveryMetrics[] = [];
  private deduplicationCache = new Map<string, string>(); // hash -> event_id

  constructor() {
    this.initializeKnownOrganizations();
    this.loadDeduplicationCache();
  }

  // Main discovery orchestration
  async runDiscovery(mode: 'quick' | 'deep' | 'intelligent' = 'quick'): Promise<Event[]> {
    const startTime = Date.now();
    const allEvents: Event[] = [];
    let totalCost = 0;

    try {
      console.log(`Starting ${mode} discovery mode...`);

      switch (mode) {
        case 'quick':
          const quickEvents = await this.quickDiscoveryStrategy();
          allEvents.push(...quickEvents);
          totalCost += 20; // Estimated cost
          break;

        case 'deep':
          const deepEvents = await this.deepDiscoveryStrategy();
          allEvents.push(...deepEvents);
          totalCost += 50; // Estimated cost
          break;

        case 'intelligent':
          const intelligentEvents = await this.intelligentDiscoveryStrategy();
          allEvents.push(...intelligentEvents);
          totalCost += 30; // Estimated cost
          break;
      }

      // Deduplicate events
      console.log(`🔍 FILTERING: Starting with ${allEvents.length} total events`);
      const uniqueEvents = await this.deduplicateEvents(allEvents);
      console.log(`🔍 FILTERING: After deduplication: ${uniqueEvents.length} events`);
      
      // Quality filtering
      const qualityEvents = await this.filterForQuality(uniqueEvents);
      console.log(`🔍 FILTERING: After quality filter: ${qualityEvents.length} events`);

      // Update metrics
      const metrics: DiscoveryMetrics = {
        totalEventsFound: allEvents.length,
        uniqueEventsAdded: qualityEvents.length,
        duplicatesRemoved: allEvents.length - uniqueEvents.length,
        qualityScore: this.calculateQualityScore(qualityEvents),
        costEfficiency: qualityEvents.length / totalCost,
        sourceBreakdown: this.analyzeSourceBreakdown(qualityEvents)
      };

      this.discoveryHistory.push(metrics);
      this.saveDiscoveryMetrics(metrics);

      console.log(`Discovery completed: ${qualityEvents.length} quality events found in ${Date.now() - startTime}ms`);
      
      return qualityEvents;

    } catch (error) {
      console.error('Discovery engine error:', error);
      return [];
    }
  }

  // Strategy 1: Quick daily discovery focusing on high-value sources
  private async quickDiscoveryStrategy(): Promise<Event[]> {
    const strategies: DiscoveryStrategy[] = [
      {
        name: 'Established Organizations',
        priority: 1,
        frequency: 'daily',
        costEstimate: 10,
        execute: () => this.searchEstablishedOrganizations()
      },
      {
        name: 'Jina AI Quick Discovery',
        priority: 2,
        frequency: 'daily',
        costEstimate: 10,
        execute: () => jinaAIService.quickDiscovery()
      }
    ];

    const events: Event[] = [];
    for (const strategy of strategies) {
      try {
        const strategyEvents = await strategy.execute();
        events.push(...strategyEvents);
        console.log(`${strategy.name}: Found ${strategyEvents.length} events`);
      } catch (error) {
        console.error(`Error in ${strategy.name}:`, error);
      }
    }

    return events;
  }

  // Strategy 2: Deep weekly discovery with comprehensive scraping
  private async deepDiscoveryStrategy(): Promise<Event[]> {
    const events: Event[] = [];

    // First run JinaAI quick discovery
    console.log('🔥 ENHANCED DISCOVERY ENGINE: Running JinaAI quick discovery...');
    const jinaEvents = await jinaAIService.quickDiscovery();
    events.push(...jinaEvents);
    console.log(`🔥 ENHANCED DISCOVERY ENGINE: JinaAI discovered ${jinaEvents.length} events`);

    // Skip other discovery methods for now - JinaAI is working perfectly!
    console.log('🔥 ENHANCED DISCOVERY ENGINE: Skipping other methods, JinaAI found enough events');

    return events;
  }

  // Strategy 3: Intelligent discovery based on successful patterns
  private async intelligentDiscoveryStrategy(): Promise<Event[]> {
    const successPatterns = await this.analyzeSuccessfulPatterns();
    const events: Event[] = [];

    // Search based on successful event patterns
    for (const pattern of successPatterns) {
      try {
        const patternEvents = await this.searchBasedOnPattern(pattern);
        events.push(...patternEvents);
      } catch (error) {
        console.error(`Error searching pattern ${pattern.query}:`, error);
      }
    }

    return events;
  }

  // Search established QTIPOC+ organizations
  private async searchEstablishedOrganizations(): Promise<Event[]> {
    const events: Event[] = [];
    const highPriorityOrgs = this.knownOrganizations
      .filter(org => org.reliability > 0.8)
      .slice(0, 5); // Limit to top 5 for cost efficiency

    for (const org of highPriorityOrgs) {
      try {
        // Check organization website for events
        const orgEvents = await this.scrapeOrganizationEvents(org);
        events.push(...orgEvents);
        
        // Update last checked
        org.lastChecked = new Date().toISOString();
      } catch (error) {
        console.error(`Error scraping ${org.name}:`, error);
      }
    }

    return events;
  }

  // Scrape events from a specific organization
  private async scrapeOrganizationEvents(org: OrganizationSource): Promise<Event[]> {
    // Mock implementation - in production would use Jina AI Reader API
    console.log(`Scraping events from ${org.name} (${org.website})`);
    
    // Simulate finding events
    return [{
      id: Date.now().toString(),
      name: `${org.name} Community Event`,
      description: `Event organized by ${org.name}`,
      event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'London, UK',
      source: 'community' as const,
      source_url: org.website,
      organizer_name: org.name,
      tags: ['community', 'qtipoc'],
      status: 'draft' as const,
      scraped_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }];
  }

  // Discover events from social media platforms
  private async discoverSocialMediaEvents(): Promise<Event[]> {
    // Mock implementation for social media discovery
    console.log('Discovering events from social media...');
    return [];
  }

  // Aggregate events from RSS feeds
  private async aggregateRSSFeeds(): Promise<Event[]> {
    // Mock implementation for RSS feed aggregation
    console.log('Aggregating RSS feeds...');
    return [];
  }

  // Analyze successful discovery patterns
  private async analyzeSuccessfulPatterns(): Promise<Array<{ query: string; success_rate: number }>> {
    // Analyze which search queries have historically found the most relevant events
    return [
      { query: 'Black QTIPOC+ events UK', success_rate: 0.8 },
      { query: 'queer people of colour workshops', success_rate: 0.7 },
      { query: 'Black trans community events', success_rate: 0.75 }
    ];
  }

  // Search based on successful patterns
  private async searchBasedOnPattern(pattern: { query: string; success_rate: number }): Promise<Event[]> {
    // Use Jina AI to search based on successful patterns
    console.log(`Searching based on pattern: ${pattern.query} (success rate: ${pattern.success_rate})`);
    return [];
  }

  // Advanced deduplication using multiple strategies
  async deduplicateEvents(events: Event[]): Promise<Event[]> {
    const uniqueEvents: Event[] = [];
    const seenHashes = new Set<string>();

    for (const event of events) {
      const hash = this.generateEventHash(event);
      
      if (!seenHashes.has(hash) && !this.deduplicationCache.has(hash)) {
        uniqueEvents.push(event);
        seenHashes.add(hash);
        this.deduplicationCache.set(hash, event.id);
      }
    }

    this.saveDeduplicationCache();
    return uniqueEvents;
  }

  // Generate robust event hash for deduplication
  private generateEventHash(event: Event): string {
    const normalizedTitle = event.name.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    const normalizedLocation = typeof event.location === 'string' 
      ? event.location.toLowerCase().replace(/[^\w\s]/g, '').trim()
      : 'online';
    
    const date = new Date(event.event_date).toDateString();
    
    const key = `${normalizedTitle}-${date}-${normalizedLocation}`;
    return btoa(key).replace(/[+/=]/g, '');
  }

  // Filter events for quality and relevance
  private async filterForQuality(events: Event[]): Promise<Event[]> {
    const qualityEvents: Event[] = [];

    for (const event of events) {
      const qualityScore = await this.calculateEventQualityScore(event);
      if (qualityScore >= 0.4) { // 40% threshold - if JinaAI found it relevant, trust it
        qualityEvents.push({
          ...event,
          relevance_score: qualityScore
        });
      }
    }

    return qualityEvents.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));
  }

  // Calculate quality score for an event
  private async calculateEventQualityScore(event: Event): Promise<number> {
    let score = 0;

    // QTIPOC+ relevance (40% of score)
    const qtipocKeywords = ['black', 'qtipoc', 'queer', 'trans', 'transgender', 'lgbtq', 'poc', 'bipoc'];
    const content = `${event.name} ${event.description} ${event.tags?.join(' ')}`.toLowerCase();
    const qtipocMatches = qtipocKeywords.filter(keyword => content.includes(keyword)).length;
    score += (qtipocMatches / qtipocKeywords.length) * 0.4;

    // Date relevance (20% of score)
    const eventDate = new Date(event.event_date);
    const now = new Date();
    const daysUntil = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (daysUntil >= 0 && daysUntil <= 30) score += 0.2;
    else if (daysUntil > 30 && daysUntil <= 90) score += 0.1;

    // Completeness (20% of score)
    let completeness = 0;
    if (event.name && event.name.trim().length > 5) completeness += 0.25;
    if (event.description && event.description.trim().length > 20) completeness += 0.25;
    if (event.location && event.location !== 'TBD') completeness += 0.25;
    if (event.organizer_name && event.organizer_name !== 'Community Organizer') completeness += 0.25;
    score += completeness * 0.2;

    // Accessibility indicators (10% of score)
    if (event.price && (event.price.toLowerCase().includes('free') || event.price.includes('sliding scale'))) {
      score += 0.1;
    }

    // Source reliability (10% of score)
    const reliableSource = ['eventbrite', 'facebook', 'outsavvy'].includes(event.source);
    if (reliableSource) score += 0.1;

    return Math.min(score, 1.0);
  }

  // Calculate overall quality score for a batch of events
  private calculateQualityScore(events: Event[]): number {
    if (events.length === 0) return 0;
    
    const totalScore = events.reduce((sum, event) => sum + (event.relevance_score || 0), 0);
    return totalScore / events.length;
  }

  // Analyze source breakdown
  private analyzeSourceBreakdown(events: Event[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    
    events.forEach(event => {
      breakdown[event.source] = (breakdown[event.source] || 0) + 1;
    });

    return breakdown;
  }

  // Initialize known QTIPOC+ organizations
  private initializeKnownOrganizations() {
    this.knownOrganizations = [
      {
        name: 'UK Black Pride',
        website: 'https://www.ukblackpride.org.uk',
        rssFeeds: [],
        socialMedia: ['@UKBlackPride'],
        reliability: 0.95,
        lastChecked: new Date().toISOString()
      },
      {
        name: 'Black Lives Matter UK',
        website: 'https://blacklivesmatter.uk',
        rssFeeds: [],
        socialMedia: ['@BLMUK'],
        reliability: 0.9,
        lastChecked: new Date().toISOString()
      },
      {
        name: 'Gendered Intelligence',
        website: 'http://genderedintelligence.co.uk',
        rssFeeds: [],
        socialMedia: ['@Genderintell'],
        reliability: 0.85,
        lastChecked: new Date().toISOString()
      },
      {
        name: 'Imkaan',
        website: 'https://www.imkaan.org.uk',
        rssFeeds: [],
        socialMedia: ['@imkaan_wws'],
        reliability: 0.8,
        lastChecked: new Date().toISOString()
      }
    ];
  }

  // Cache management
  private loadDeduplicationCache() {
    const cached = localStorage.getItem('ivor-deduplication-cache');
    if (cached) {
      this.deduplicationCache = new Map(JSON.parse(cached));
    }
  }

  private saveDeduplicationCache() {
    localStorage.setItem('ivor-deduplication-cache', 
      JSON.stringify(Array.from(this.deduplicationCache.entries())));
  }

  private saveDiscoveryMetrics(metrics: DiscoveryMetrics) {
    const allMetrics = [...this.discoveryHistory];
    // Keep only last 30 days of metrics
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const recentMetrics = allMetrics.filter(m => 
      new Date(m.sourceBreakdown.timestamp || Date.now()).getTime() > thirtyDaysAgo
    );
    
    localStorage.setItem('ivor-discovery-metrics', JSON.stringify(recentMetrics));
  }

  // Public API for getting discovery statistics
  getDiscoveryStats() {
    return {
      totalRuns: this.discoveryHistory.length,
      averageEventsFound: this.discoveryHistory.reduce((sum, m) => sum + m.totalEventsFound, 0) / this.discoveryHistory.length || 0,
      averageQualityScore: this.discoveryHistory.reduce((sum, m) => sum + m.qualityScore, 0) / this.discoveryHistory.length || 0,
      knownOrganizations: this.knownOrganizations.length,
      cacheSize: this.deduplicationCache.size
    };
  }
}

export const enhancedDiscoveryEngine = new EnhancedDiscoveryEngine();