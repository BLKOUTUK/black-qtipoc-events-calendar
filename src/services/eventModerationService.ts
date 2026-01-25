/**
 * Event Moderation Service
 * Handles bulk and individual event moderation operations
 */

import { Event } from '../types';
import { approveEventViaIvor, rejectEventViaIvor } from '../config/api';
import { isAutoRejectSource, isTrustedSource } from '../config/trustedEventSources';

export interface ModerationCriteria {
  requireFutureDate?: boolean;
  requireUKLocation?: boolean;
  requireCompleteLocation?: boolean;
  trustedSourcesOnly?: boolean;
}

export interface ModerationResult {
  approved: number;
  rejected: number;
  errors: string[];
}

class EventModerationService {
  /**
   * Check if event meets moderation criteria
   */
  private meetsApprovalCriteria(event: Event, criteria: ModerationCriteria = {}): boolean {
    // Check future date
    if (criteria.requireFutureDate) {
      try {
        const eventDate = new Date(event.start_date || event.date || '');
        if (eventDate <= new Date()) {
          return false;
        }
      } catch {
        return false;
      }
    }

    // Check UK location
    if (criteria.requireUKLocation) {
      const location = (event.location || '').toLowerCase();
      const isUK = location.includes('uk') ||
                   location.includes('london') ||
                   location.includes('manchester') ||
                   location.includes('birmingham') ||
                   location.includes('glasgow') ||
                   location.includes('edinburgh') ||
                   location.includes('online') ||
                   location.includes('virtual');
      if (!isUK) {
        return false;
      }
    }

    // Check complete location
    if (criteria.requireCompleteLocation) {
      const location = event.location || '';
      if (location === 'Location TBA' || location === 'TBD' || location.trim() === '') {
        return false;
      }
    }

    // Check trusted source
    if (criteria.trustedSourcesOnly) {
      const source = event.source || '';
      if (!isTrustedSource(source)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Approve a single event via IVOR API
   */
  async approveEvent(eventId: string): Promise<boolean> {
    try {
      const result = await approveEventViaIvor(eventId);
      if (result.success) {
        console.log(`[Moderation] Event ${eventId} approved`);
      } else {
        console.error(`[Moderation] Failed to approve event ${eventId}:`, result.message);
      }
      return result.success;
    } catch (error) {
      console.error('Error approving event:', error);
      return false;
    }
  }

  /**
   * Reject a single event via IVOR API
   */
  async rejectEvent(eventId: string, reason?: string): Promise<boolean> {
    try {
      const result = await rejectEventViaIvor(eventId, reason);
      if (result.success) {
        console.log(`[Moderation] Event ${eventId} rejected`);
      } else {
        console.error(`[Moderation] Failed to reject event ${eventId}:`, result.message);
      }
      return result.success;
    } catch (error) {
      console.error('Error rejecting event:', error);
      return false;
    }
  }

  /**
   * Bulk approve events based on criteria
   */
  async bulkApprove(
    events: Event[],
    criteria: ModerationCriteria = {}
  ): Promise<ModerationResult> {
    const result: ModerationResult = {
      approved: 0,
      rejected: 0,
      errors: []
    };

    for (const event of events) {
      if (this.meetsApprovalCriteria(event, criteria)) {
        const success = await this.approveEvent(event.id);
        if (success) {
          result.approved++;
        } else {
          result.errors.push(`Failed to approve: ${event.title}`);
        }
      }
    }

    return result;
  }

  /**
   * Bulk reject events based on criteria
   */
  async bulkReject(
    events: Event[],
    rejectPastEvents: boolean = false,
    rejectIncompleteLocation: boolean = false,
    rejectAutoRejectSources: boolean = false
  ): Promise<ModerationResult> {
    const result: ModerationResult = {
      approved: 0,
      rejected: 0,
      errors: []
    };

    for (const event of events) {
      let shouldReject = false;

      // Check if past event
      if (rejectPastEvents) {
        try {
          const eventDate = new Date(event.start_date || event.date || '');
          if (eventDate <= new Date()) {
            shouldReject = true;
          }
        } catch {
          // Invalid date, might want to reject
        }
      }

      // Check incomplete location
      if (rejectIncompleteLocation) {
        const location = event.location || '';
        if (location === 'Location TBA' || location === 'TBD' || location.trim() === '') {
          shouldReject = true;
        }
      }

      // Check auto-reject sources
      if (rejectAutoRejectSources) {
        const source = event.source || '';
        if (isAutoRejectSource(source)) {
          shouldReject = true;
        }
      }

      if (shouldReject) {
        const success = await this.rejectEvent(event.id);
        if (success) {
          result.rejected++;
        } else {
          result.errors.push(`Failed to reject: ${event.title}`);
        }
      }
    }

    return result;
  }

  /**
   * Get moderation recommendations for events
   */
  getModerationRecommendations(events: Event[]): {
    autoApprove: Event[];
    autoReject: Event[];
    manualReview: Event[];
  } {
    const now = new Date();
    const autoApprove: Event[] = [];
    const autoReject: Event[] = [];
    const manualReview: Event[] = [];

    for (const event of events) {
      const source = event.source || '';
      const location = event.location || '';
      let eventDate: Date;

      try {
        eventDate = new Date(event.start_date || event.date || '');
      } catch {
        // Invalid date -> auto reject
        autoReject.push(event);
        continue;
      }

      // Auto reject: past events
      if (eventDate <= now) {
        autoReject.push(event);
        continue;
      }

      // Auto reject: incomplete location from web search
      if (location === 'Location TBA' && isAutoRejectSource(source)) {
        autoReject.push(event);
        continue;
      }

      // Auto reject: auto-reject sources
      if (isAutoRejectSource(source)) {
        autoReject.push(event);
        continue;
      }

      // Auto approve: future events from trusted sources with complete info
      if (isTrustedSource(source) &&
          location !== 'Location TBA' &&
          location !== 'TBD' &&
          eventDate > now) {
        autoApprove.push(event);
        continue;
      }

      // Everything else needs manual review
      manualReview.push(event);
    }

    return { autoApprove, autoReject, manualReview };
  }
}

export const eventModerationService = new EventModerationService();
export default eventModerationService;
