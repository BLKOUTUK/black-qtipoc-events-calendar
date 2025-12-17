/**
 * Events Liberation Service
 * Connects events-calendar to IVOR Core Layer 3 Business Logic
 *
 * Liberation Features:
 * - Democratic event creation with community validation
 * - Creator sovereignty for event organizers (75% minimum)
 * - Anti-oppression event screening
 * - Community protection for event content
 * - Cultural authenticity validation
 *
 * BLKOUT Community Liberation Platform
 */

// IVOR Core Layer 3 API Configuration
const IVOR_API_BASE = import.meta.env.VITE_IVOR_API_URL || 'https://ivor.blkoutuk.cloud';

export interface LiberationValidationResult {
  isCompliant: boolean;
  complianceLevel: 'full' | 'partial' | 'non-compliant';
  creatorSovereignty: {
    enforced: boolean;
    minimumShare: number;
    actualShare: number;
  };
  communityProtection: {
    level: number;
    antiOppressionChecks: string[];
    passed: boolean;
  };
  culturalAuthenticity: {
    validated: boolean;
    score: number;
    concerns: string[];
  };
  recommendations: string[];
  warnings: string[];
}

export interface EventCreationRequest {
  title: string;
  description: string;
  organizer_id: string;
  event_date?: string;
  location?: string;
  price?: string | number;
  tags?: string[];
  source_url?: string;
}

export interface OrganizerSovereigntyResult {
  revenueShare: number;
  attributionEnforced: boolean;
  controlsGranted: string[];
  creatorId: string;
  eventId: string;
}

class EventsLiberationService {
  private apiBase: string;

  constructor() {
    this.apiBase = IVOR_API_BASE;
  }

  /**
   * Check if IVOR Layer 3 services are available
   */
  async checkHealth(): Promise<{
    available: boolean;
    liberationCompliant: boolean;
    layer3Active: boolean;
  }> {
    try {
      const response = await fetch(`${this.apiBase}/health/liberation`);

      if (!response.ok) {
        return { available: false, liberationCompliant: false, layer3Active: false };
      }

      const data = await response.json();

      return {
        available: true,
        liberationCompliant: data.liberationMetrics?.overallCompliance === '100.0%',
        layer3Active: data.layer3Services?.community && data.layer3Services?.creator
      };
    } catch (error) {
      console.warn('[EventsLiberation] IVOR Layer 3 health check failed:', error);
      return { available: false, liberationCompliant: false, layer3Active: false };
    }
  }

  /**
   * Validate event creation against liberation values
   * Routes through IVOR Layer 3 for community and cultural validation
   */
  async validateEventCreation(event: EventCreationRequest): Promise<LiberationValidationResult> {
    try {
      const response = await fetch(`${this.apiBase}/api/liberation/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'community_interaction',
          subOperation: 'event_creation',
          payload: event,
          liberationContext: {
            creatorSovereigntyEnforcement: true,
            communityProtectionRequired: true,
            culturalAuthenticityValidation: true
          }
        })
      });

      if (!response.ok) {
        // Return fallback validation if API unavailable
        return this.getLocalValidation(event);
      }

      const data = await response.json();
      return this.mapToValidationResult(data);

    } catch (error) {
      console.warn('[EventsLiberation] Validation API unavailable, using local validation:', error);
      return this.getLocalValidation(event);
    }
  }

  /**
   * Enforce organizer sovereignty for event creators
   * Guarantees minimum 75% revenue share and full attribution
   */
  async enforceOrganizerSovereignty(
    eventId: string,
    organizerId: string
  ): Promise<OrganizerSovereigntyResult> {
    try {
      const response = await fetch(`${this.apiBase}/api/liberation/sovereignty`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'creator_sovereignty',
          payload: { eventId, creatorId: organizerId },
          liberationContext: { creatorSovereigntyEnforcement: true }
        })
      });

      if (!response.ok) {
        // Return enforced minimum if API unavailable
        return this.getDefaultSovereignty(eventId, organizerId);
      }

      const data = await response.json();

      return {
        revenueShare: Math.max(0.75, data.revenueShare || 0.75),
        attributionEnforced: true,
        controlsGranted: data.controlsGranted || [
          'edit_event',
          'cancel_event',
          'manage_registrations',
          'view_analytics',
          'export_data'
        ],
        creatorId: organizerId,
        eventId: eventId
      };

    } catch (error) {
      console.warn('[EventsLiberation] Sovereignty API unavailable, using defaults:', error);
      return this.getDefaultSovereignty(eventId, organizerId);
    }
  }

  /**
   * Validate event content for anti-oppression compliance
   */
  async validateAntiOppression(content: {
    title: string;
    description: string;
    organizer?: string;
  }): Promise<{
    passed: boolean;
    concerns: string[];
    recommendations: string[];
  }> {
    // Local anti-oppression checks (always run, even if API available)
    const concerns: string[] = [];
    const recommendations: string[] = [];

    const contentText = `${content.title} ${content.description}`.toLowerCase();

    // Check for problematic patterns
    const problematicPatterns = [
      { pattern: /corporate.*diversity|diversity.*training.*company/i, concern: 'Corporate diversity training (not community-focused)' },
      { pattern: /fetish|exotic/i, concern: 'Potential fetishization language' },
      { pattern: /terf|gender.?critical/i, concern: 'Trans-exclusionary content' },
      { pattern: /all lives matter/i, concern: 'All lives matter rhetoric' }
    ];

    for (const { pattern, concern } of problematicPatterns) {
      if (pattern.test(contentText)) {
        concerns.push(concern);
      }
    }

    // Positive indicators
    const liberationIndicators = [
      'black queer', 'qtipoc', 'black trans', 'liberation', 'community-led',
      'mutual aid', 'healing', 'safe space', 'grassroots', 'collective'
    ];

    const hasLiberationFocus = liberationIndicators.some(indicator =>
      contentText.includes(indicator)
    );

    if (!hasLiberationFocus) {
      recommendations.push('Consider adding liberation-focused language to clarify community benefit');
    }

    return {
      passed: concerns.length === 0,
      concerns,
      recommendations
    };
  }

  /**
   * Get moderation recommendation for an event
   */
  async getEventModerationRecommendation(event: EventCreationRequest): Promise<{
    recommendation: 'auto-approve' | 'review-quick' | 'review-deep';
    confidence: number;
    reasoning: string;
    liberationScore: number;
  }> {
    const validation = await this.validateEventCreation(event);
    const antiOppression = await this.validateAntiOppression({
      title: event.title,
      description: event.description,
      organizer: event.organizer_id
    });

    let confidence = 0.5;
    let recommendation: 'auto-approve' | 'review-quick' | 'review-deep' = 'review-quick';
    const reasons: string[] = [];

    // Calculate confidence based on validation results
    if (validation.isCompliant) {
      confidence += 0.2;
      reasons.push('Liberation-compliant content');
    }

    if (validation.culturalAuthenticity.validated && validation.culturalAuthenticity.score >= 0.8) {
      confidence += 0.15;
      reasons.push('High cultural authenticity');
    }

    if (antiOppression.passed) {
      confidence += 0.1;
      reasons.push('Passed anti-oppression checks');
    } else {
      confidence -= 0.2;
      reasons.push(`Anti-oppression concerns: ${antiOppression.concerns.join(', ')}`);
    }

    // Check for strong liberation indicators
    const strongIndicators = ['black queer', 'qtipoc', 'black trans', 'uk black pride'];
    const hasStrongIndicator = strongIndicators.some(ind =>
      `${event.title} ${event.description}`.toLowerCase().includes(ind)
    );

    if (hasStrongIndicator) {
      confidence += 0.15;
      reasons.push('Strong liberation community focus');
    }

    // Determine recommendation
    if (confidence >= 0.85 && antiOppression.passed) {
      recommendation = 'auto-approve';
    } else if (confidence >= 0.6) {
      recommendation = 'review-quick';
    } else {
      recommendation = 'review-deep';
    }

    return {
      recommendation,
      confidence: Math.min(1, Math.max(0, confidence)),
      reasoning: reasons.join('; '),
      liberationScore: validation.culturalAuthenticity.score
    };
  }

  /**
   * Local validation fallback when IVOR API unavailable
   */
  private getLocalValidation(event: EventCreationRequest): LiberationValidationResult {
    const contentText = `${event.title} ${event.description}`.toLowerCase();

    // Check for liberation keywords
    const liberationKeywords = [
      'black', 'queer', 'trans', 'lgbtq', 'qtipoc', 'liberation',
      'community', 'safe space', 'healing', 'mutual aid'
    ];

    const liberationScore = liberationKeywords.filter(kw =>
      contentText.includes(kw)
    ).length / liberationKeywords.length;

    return {
      isCompliant: liberationScore >= 0.2,
      complianceLevel: liberationScore >= 0.5 ? 'full' : liberationScore >= 0.2 ? 'partial' : 'non-compliant',
      creatorSovereignty: {
        enforced: true,
        minimumShare: 0.75,
        actualShare: 0.75
      },
      communityProtection: {
        level: 0.95,
        antiOppressionChecks: ['content-screening', 'keyword-analysis'],
        passed: true
      },
      culturalAuthenticity: {
        validated: true,
        score: liberationScore,
        concerns: []
      },
      recommendations: liberationScore < 0.3
        ? ['Consider adding more liberation-focused language']
        : [],
      warnings: []
    };
  }

  /**
   * Default sovereignty enforcement when API unavailable
   */
  private getDefaultSovereignty(eventId: string, organizerId: string): OrganizerSovereigntyResult {
    return {
      revenueShare: 0.75, // Minimum 75% guaranteed
      attributionEnforced: true,
      controlsGranted: [
        'edit_event',
        'cancel_event',
        'manage_registrations',
        'view_analytics',
        'export_data',
        'set_pricing',
        'manage_content'
      ],
      creatorId: organizerId,
      eventId: eventId
    };
  }

  /**
   * Map API response to validation result
   */
  private mapToValidationResult(data: any): LiberationValidationResult {
    return {
      isCompliant: data.liberationValidation?.isCompliant ?? data.success ?? false,
      complianceLevel: data.liberationValidation?.complianceLevel ?? 'partial',
      creatorSovereignty: {
        enforced: true,
        minimumShare: 0.75,
        actualShare: data.creatorSovereignty?.share ?? 0.75
      },
      communityProtection: {
        level: data.communityProtection?.level ?? 0.95,
        antiOppressionChecks: data.communityProtection?.checks ?? [],
        passed: data.communityProtection?.passed ?? true
      },
      culturalAuthenticity: {
        validated: data.culturalAuthenticity?.validated ?? true,
        score: data.culturalAuthenticity?.score ?? 0.8,
        concerns: data.culturalAuthenticity?.concerns ?? []
      },
      recommendations: data.recommendations ?? [],
      warnings: data.warnings ?? []
    };
  }
}

// Export singleton instance
export const eventsLiberationService = new EventsLiberationService();
export default EventsLiberationService;
