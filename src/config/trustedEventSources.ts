/**
 * Trusted Event Sources Configuration
 * Generated from event data analysis - January 23, 2026
 */

export const TRUSTED_EVENT_SOURCES = [
  'DIVA Magazine Events',
  'Eventbrite UK - LGBTQ+',
  'qxmagazine.com',
  'ukblackpride.org.uk',
  'QX Magazine Events',
  'stonewall.org.uk',
  'Consortium LGBT+',
  'community-submission', // Verified community submissions
];

export const AUTO_REJECT_SOURCES = [
  'Web Search', // Incomplete data - bulk web search results
  'chrome-extension', // Test/development data
  'chrome_extension', // Test/development data
];

export const MANUAL_REVIEW_SOURCES = [
  'n8n_automation', // Automated discovery - needs individual review
  'research_agent', // AI discovery - needs verification
];

/**
 * Check if an event source is trusted for auto-approval
 */
export function isTrustedSource(source: string): boolean {
  return TRUSTED_EVENT_SOURCES.includes(source);
}

/**
 * Check if an event source should be auto-rejected
 */
export function isAutoRejectSource(source: string): boolean {
  return AUTO_REJECT_SOURCES.includes(source);
}

/**
 * Check if an event source requires manual review
 */
export function requiresManualReview(source: string): boolean {
  return MANUAL_REVIEW_SOURCES.includes(source) ||
         (!isTrustedSource(source) && !isAutoRejectSource(source));
}

/**
 * Get recommendation for event based on source
 */
export function getSourceRecommendation(source: string): 'approve' | 'reject' | 'review' {
  if (isTrustedSource(source)) return 'approve';
  if (isAutoRejectSource(source)) return 'reject';
  return 'review';
}
