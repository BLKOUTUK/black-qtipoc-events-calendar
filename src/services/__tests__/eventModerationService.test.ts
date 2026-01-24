/**
 * Event Moderation Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { eventModerationService } from '../eventModerationService';
import { Event } from '../../types';

// Mock supabaseApiService
vi.mock('../supabaseApiService', () => ({
  supabaseApiService: {
    updateEvent: vi.fn((id: string, updates: Partial<Event>) => Promise.resolve({ id, ...updates })),
  }
}));

describe('EventModerationService', () => {
  const createMockEvent = (overrides: Partial<Event> = {}): Event => ({
    id: 'test-id',
    title: 'Test Event',
    description: 'Test Description',
    start_date: '2025-12-01',
    end_date: '2025-12-01',
    location: 'London, UK',
    event_type: 'meetup',
    organizer_id: 'org-1',
    max_attendees: 50,
    registration_required: false,
    cost: 0,
    tags: [],
    status: 'draft',
    created_at: '2025-01-01',
    updated_at: '2025-01-01',
    source: 'Eventbrite UK - LGBTQ+',
    ...overrides
  });

  describe('getModerationRecommendations', () => {
    it('should recommend auto-reject for past events', () => {
      const events = [
        createMockEvent({ start_date: '2024-01-01', source: 'DIVA Magazine Events' })
      ];

      const { autoReject } = eventModerationService.getModerationRecommendations(events);

      expect(autoReject).toHaveLength(1);
      expect(autoReject[0].id).toBe('test-id');
    });

    it('should recommend auto-reject for incomplete location from Web Search', () => {
      const events = [
        createMockEvent({
          start_date: '2025-12-01',
          location: 'Location TBA',
          source: 'Web Search'
        })
      ];

      const { autoReject } = eventModerationService.getModerationRecommendations(events);

      expect(autoReject).toHaveLength(1);
    });

    it('should recommend auto-reject for auto-reject sources', () => {
      const events = [
        createMockEvent({
          start_date: '2025-12-01',
          location: 'London',
          source: 'chrome-extension'
        })
      ];

      const { autoReject } = eventModerationService.getModerationRecommendations(events);

      expect(autoReject).toHaveLength(1);
    });

    it('should recommend auto-approve for future trusted source events with complete info', () => {
      const events = [
        createMockEvent({
          start_date: '2025-12-01',
          location: 'London, UK',
          source: 'DIVA Magazine Events'
        })
      ];

      const { autoApprove } = eventModerationService.getModerationRecommendations(events);

      expect(autoApprove).toHaveLength(1);
      expect(autoApprove[0].id).toBe('test-id');
    });

    it('should recommend manual review for unknown sources', () => {
      const events = [
        createMockEvent({
          start_date: '2025-12-01',
          location: 'London, UK',
          source: 'unknown-source'
        })
      ];

      const { manualReview } = eventModerationService.getModerationRecommendations(events);

      expect(manualReview).toHaveLength(1);
    });

    it('should categorize mixed events correctly', () => {
      const events = [
        createMockEvent({ start_date: '2024-01-01' }), // Past - auto reject
        createMockEvent({ start_date: '2025-12-01', source: 'DIVA Magazine Events' }), // Future trusted - auto approve
        createMockEvent({ start_date: '2025-12-01', source: 'unknown' }) // Future unknown - manual review
      ];

      const { autoApprove, autoReject, manualReview } =
        eventModerationService.getModerationRecommendations(events);

      expect(autoReject).toHaveLength(1);
      expect(autoApprove).toHaveLength(1);
      expect(manualReview).toHaveLength(1);
    });
  });

  describe('approveEvent', () => {
    it('should update event status to published', async () => {
      const result = await eventModerationService.approveEvent('test-id');

      expect(result).toBe(true);
    });
  });

  describe('rejectEvent', () => {
    it('should update event status to cancelled', async () => {
      const result = await eventModerationService.rejectEvent('test-id');

      expect(result).toBe(true);
    });
  });

  describe('bulkApprove', () => {
    it('should approve events meeting criteria', async () => {
      const events = [
        createMockEvent({ start_date: '2025-12-01', source: 'DIVA Magazine Events' }),
        createMockEvent({ start_date: '2024-01-01', source: 'DIVA Magazine Events' }) // Past, should not approve
      ];

      const result = await eventModerationService.bulkApprove(events, {
        requireFutureDate: true,
        trustedSourcesOnly: true
      });

      expect(result.approved).toBe(1);
    });
  });

  describe('bulkReject', () => {
    it('should reject past events', async () => {
      const events = [
        createMockEvent({ start_date: '2024-01-01' }),
        createMockEvent({ start_date: '2025-12-01' })
      ];

      const result = await eventModerationService.bulkReject(
        events,
        true, // rejectPastEvents
        false,
        false
      );

      expect(result.rejected).toBe(1);
    });

    it('should reject events with incomplete location', async () => {
      const events = [
        createMockEvent({ location: 'Location TBA' }),
        createMockEvent({ location: 'London, UK' })
      ];

      const result = await eventModerationService.bulkReject(
        events,
        false,
        true, // rejectIncompleteLocation
        false
      );

      expect(result.rejected).toBe(1);
    });

    it('should reject auto-reject sources', async () => {
      const events = [
        createMockEvent({ source: 'Web Search' }),
        createMockEvent({ source: 'DIVA Magazine Events' })
      ];

      const result = await eventModerationService.bulkReject(
        events,
        false,
        false,
        true // rejectAutoRejectSources
      );

      expect(result.rejected).toBe(1);
    });
  });
});
