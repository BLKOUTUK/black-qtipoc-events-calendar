/**
 * API Configuration for Events Calendar
 * Routes all API calls through IVOR Core (Liberation Layer 3)
 *
 * BLKOUT Community Liberation Platform
 */

// IVOR Core API base URL
// In production: https://ivor.blkoutuk.cloud
// In development: http://localhost:3000
export const IVOR_API_URL = import.meta.env.VITE_IVOR_API_URL || 'https://ivor.blkoutuk.cloud';

// API endpoints
export const API_ENDPOINTS = {
  // Events endpoints (routed through IVOR Core)
  EVENTS_SUBMIT: `${IVOR_API_URL}/api/events/submit`,
  EVENTS_UPCOMING: `${IVOR_API_URL}/api/events/upcoming`,
  EVENTS_PENDING: `${IVOR_API_URL}/api/events/pending`,
  EVENTS_APPROVE: (id: string) => `${IVOR_API_URL}/api/events/${id}/approve`,
  EVENTS_REJECT: (id: string) => `${IVOR_API_URL}/api/events/${id}/reject`,

  // Liberation health check
  LIBERATION_HEALTH: `${IVOR_API_URL}/api/liberation/health`,
} as const;

/**
 * Submit event through IVOR Core with liberation validation
 */
export async function submitEventToIvor(eventData: {
  title: string;
  date: string;
  time?: string;
  location?: string;
  description?: string;
  url?: string;
  tags?: string[];
  organizer?: string;
  source?: string;
}): Promise<{
  success: boolean;
  message: string;
  data?: any;
  liberation?: {
    score: number;
    recommendation: string;
    autoApproved: boolean;
  };
}> {
  try {
    const response = await fetch(API_ENDPOINTS.EVENTS_SUBMIT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...eventData,
        source: eventData.source || 'events-calendar-web',
      }),
    });

    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error('[API] Event submission failed:', error);
    return {
      success: false,
      message: error.message || 'Failed to submit event',
    };
  }
}

/**
 * Approve event through IVOR Core
 */
export async function approveEventViaIvor(eventId: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(API_ENDPOINTS.EVENTS_APPROVE(eventId), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return await response.json();
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

/**
 * Reject event through IVOR Core
 */
export async function rejectEventViaIvor(eventId: string, reason?: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(API_ENDPOINTS.EVENTS_REJECT(eventId), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    });

    return await response.json();
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

/**
 * Fetch pending events from IVOR Core
 */
export async function fetchPendingEventsViaIvor(): Promise<{ success: boolean; events: any[]; count: number }> {
  try {
    const response = await fetch(API_ENDPOINTS.EVENTS_PENDING, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    return {
      success: result.success,
      events: result.events || [],
      count: result.count || 0,
    };
  } catch (error: any) {
    console.error('[API] Failed to fetch pending events:', error);
    return { success: false, events: [], count: 0 };
  }
}

/**
 * Fetch upcoming (approved) events from IVOR Core
 */
export async function fetchUpcomingEventsViaIvor(): Promise<{ success: boolean; events: any[]; count: number }> {
  try {
    const response = await fetch(API_ENDPOINTS.EVENTS_UPCOMING, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    return {
      success: result.success,
      events: result.events || [],
      count: result.count || 0,
    };
  } catch (error: any) {
    console.error('[API] Failed to fetch upcoming events:', error);
    return { success: false, events: [], count: 0 };
  }
}

export default {
  IVOR_API_URL,
  API_ENDPOINTS,
  submitEventToIvor,
  approveEventViaIvor,
  rejectEventViaIvor,
  fetchPendingEventsViaIvor,
  fetchUpcomingEventsViaIvor,
};
