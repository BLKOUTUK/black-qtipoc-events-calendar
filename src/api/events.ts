import { googleSheetsService } from '../services/googleSheetsService';
import { Event } from '../types';

// Simple API endpoint for serving events data to external applications
export class EventsAPI {
  private corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  async getPublishedEvents(maxEvents?: number): Promise<Event[]> {
    try {
      const events = await googleSheetsService.getPublishedEvents();
      
      // Sort by event date (upcoming first)
      const sortedEvents = events
        .filter(event => new Date(event.event_date) >= new Date())
        .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());

      // Limit results if maxEvents specified
      return maxEvents ? sortedEvents.slice(0, maxEvents) : sortedEvents;
    } catch (error) {
      console.error('Error fetching events for API:', error);
      return [];
    }
  }

  async getFeaturedEvents(count: number = 6): Promise<Event[]> {
    try {
      const events = await this.getPublishedEvents();
      
      // Priority: upcoming events with images, diverse organizers
      return events
        .filter(event => {
          const eventDate = new Date(event.event_date);
          const now = new Date();
          const daysUntil = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
          return daysUntil >= 0 && daysUntil <= 30; // Next 30 days
        })
        .slice(0, count);
    } catch (error) {
      console.error('Error fetching featured events:', error);
      return [];
    }
  }

  // Transform events for BLKOUT website widget format
  transformForWidget(event: Event) {
    return {
      id: event.id,
      title: event.name,
      date: event.event_date.split('T')[0], // YYYY-MM-DD format
      time: event.event_date.split('T')[1]?.slice(0, 5) || '19:00', // HH:MM format
      location: typeof event.location === 'string' ? event.location : 'TBD',
      organizer_name: event.organizer_name || 'Community Event',
      description: event.description,
      event_url: event.source_url,
      relevance_score: this.calculateRelevanceScore(event)
    };
  }

  private calculateRelevanceScore(event: Event): number {
    let score = 0;
    
    // Recent events get higher scores
    const daysUntil = (new Date(event.event_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (daysUntil <= 7) score += 0.3;
    else if (daysUntil <= 14) score += 0.2;
    else if (daysUntil <= 30) score += 0.1;
    
    // Events with images get higher scores
    if (event.image_url) score += 0.2;
    
    // Community-submitted events get slight boost
    if (event.source === 'community') score += 0.1;
    
    // Events with multiple tags (more detailed) get higher scores
    if (event.tags && event.tags.length > 2) score += 0.1;
    
    // Free events get boost for accessibility
    if (event.price && (event.price.toLowerCase().includes('free') || event.price.includes('$0'))) {
      score += 0.1;
    }
    
    return Math.min(score, 1.0); // Cap at 1.0
  }
}

export const eventsAPI = new EventsAPI();