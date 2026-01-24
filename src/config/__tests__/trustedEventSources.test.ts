/**
 * Trusted Event Sources Configuration Tests
 */

import { describe, it, expect } from 'vitest';
import {
  isTrustedSource,
  isAutoRejectSource,
  requiresManualReview,
  getSourceRecommendation
} from '../trustedEventSources';

describe('Trusted Event Sources', () => {
  describe('isTrustedSource', () => {
    it('should return true for trusted sources', () => {
      expect(isTrustedSource('DIVA Magazine Events')).toBe(true);
      expect(isTrustedSource('ukblackpride.org.uk')).toBe(true);
      expect(isTrustedSource('Eventbrite UK - LGBTQ+')).toBe(true);
    });

    it('should return false for non-trusted sources', () => {
      expect(isTrustedSource('Web Search')).toBe(false);
      expect(isTrustedSource('chrome-extension')).toBe(false);
      expect(isTrustedSource('unknown-source')).toBe(false);
    });
  });

  describe('isAutoRejectSource', () => {
    it('should return true for auto-reject sources', () => {
      expect(isAutoRejectSource('Web Search')).toBe(true);
      expect(isAutoRejectSource('chrome-extension')).toBe(true);
      expect(isAutoRejectSource('chrome_extension')).toBe(true);
    });

    it('should return false for non-auto-reject sources', () => {
      expect(isAutoRejectSource('DIVA Magazine Events')).toBe(false);
      expect(isAutoRejectSource('ukblackpride.org.uk')).toBe(false);
    });
  });

  describe('requiresManualReview', () => {
    it('should return true for manual review sources', () => {
      expect(requiresManualReview('n8n_automation')).toBe(true);
      expect(requiresManualReview('research_agent')).toBe(true);
    });

    it('should return true for unknown sources', () => {
      expect(requiresManualReview('random-source')).toBe(true);
    });

    it('should return false for trusted sources', () => {
      expect(requiresManualReview('DIVA Magazine Events')).toBe(false);
    });

    it('should return false for auto-reject sources', () => {
      expect(requiresManualReview('Web Search')).toBe(false);
    });
  });

  describe('getSourceRecommendation', () => {
    it('should recommend approve for trusted sources', () => {
      expect(getSourceRecommendation('DIVA Magazine Events')).toBe('approve');
      expect(getSourceRecommendation('ukblackpride.org.uk')).toBe('approve');
    });

    it('should recommend reject for auto-reject sources', () => {
      expect(getSourceRecommendation('Web Search')).toBe('reject');
      expect(getSourceRecommendation('chrome-extension')).toBe('reject');
    });

    it('should recommend review for unknown sources', () => {
      expect(getSourceRecommendation('unknown-source')).toBe('review');
      expect(getSourceRecommendation('n8n_automation')).toBe('review');
    });
  });
});
