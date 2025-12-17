/**
 * Interaction Tracking Hook
 * Tracks user interactions for personalized recommendations
 *
 * Liberation Feature: Privacy-respecting community analytics
 */

import { useCallback, useRef, useEffect } from 'react';

const IVOR_API = import.meta.env.VITE_IVOR_API_URL || 'https://ivor.blkoutuk.cloud';

interface TrackingOptions {
  userId?: string;
  sessionId?: string;
  source?: string;
}

export function useInteractionTracking(options: TrackingOptions = {}) {
  const sessionId = useRef(
    options.sessionId || `session_${Date.now()}_${Math.random().toString(36).slice(2)}`
  );

  const dwellTimers = useRef<Map<string, { start: number; contentId: string; contentType: string }>>(
    new Map()
  );

  // Track a simple interaction
  const track = useCallback(async (
    contentType: 'event' | 'news' | 'organizer',
    contentId: string,
    interactionType: string,
    metadata?: Record<string, any>
  ) => {
    try {
      await fetch(`${IVOR_API}/api/discover/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: options.userId,
          contentType,
          contentId,
          interactionType,
          metadata,
          source: options.source || 'app',
          sessionId: sessionId.current
        })
      });
    } catch (err) {
      // Silent fail - don't interrupt user experience
      console.debug('[Tracking] Failed:', err);
    }
  }, [options.userId, options.source]);

  // Track view
  const trackView = useCallback((
    contentType: 'event' | 'news' | 'organizer',
    contentId: string
  ) => {
    track(contentType, contentId, 'view');
  }, [track]);

  // Track click
  const trackClick = useCallback((
    contentType: 'event' | 'news' | 'organizer',
    contentId: string
  ) => {
    track(contentType, contentId, 'click');
  }, [track]);

  // Track share
  const trackShare = useCallback((
    contentType: 'event' | 'news' | 'organizer',
    contentId: string,
    platform?: string
  ) => {
    track(contentType, contentId, 'share', { platform });
  }, [track]);

  // Track save/bookmark
  const trackSave = useCallback((
    contentType: 'event' | 'news' | 'organizer',
    contentId: string
  ) => {
    track(contentType, contentId, 'save');
  }, [track]);

  // Track RSVP
  const trackRsvp = useCallback((eventId: string, action: 'rsvp' | 'cancel') => {
    track('event', eventId, action === 'rsvp' ? 'rsvp' : 'dismiss');
  }, [track]);

  // Track dismiss/not interested
  const trackDismiss = useCallback((
    contentType: 'event' | 'news' | 'organizer',
    contentId: string
  ) => {
    track(contentType, contentId, 'dismiss');
  }, [track]);

  // Start dwell time tracking
  const startDwellTracking = useCallback((
    contentType: 'event' | 'news' | 'organizer',
    contentId: string
  ) => {
    const key = `${contentType}_${contentId}`;
    dwellTimers.current.set(key, {
      start: Date.now(),
      contentId,
      contentType
    });
  }, []);

  // End dwell time tracking
  const endDwellTracking = useCallback((
    contentType: 'event' | 'news' | 'organizer',
    contentId: string
  ) => {
    const key = `${contentType}_${contentId}`;
    const timer = dwellTimers.current.get(key);

    if (timer) {
      const dwellTimeSeconds = Math.round((Date.now() - timer.start) / 1000);

      // Only track if user spent at least 3 seconds
      if (dwellTimeSeconds >= 3) {
        fetch(`${IVOR_API}/api/discover/track`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: options.userId,
            contentType,
            contentId,
            interactionType: 'dwell',
            dwellTimeSeconds,
            source: options.source || 'app',
            sessionId: sessionId.current
          })
        }).catch(() => {});
      }

      dwellTimers.current.delete(key);
    }
  }, [options.userId, options.source]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // End any active dwell timers
      dwellTimers.current.forEach((timer, key) => {
        const [contentType, contentId] = key.split('_');
        endDwellTracking(contentType as any, contentId);
      });
    };
  }, [endDwellTracking]);

  return {
    track,
    trackView,
    trackClick,
    trackShare,
    trackSave,
    trackRsvp,
    trackDismiss,
    startDwellTracking,
    endDwellTracking,
    sessionId: sessionId.current
  };
}

export default useInteractionTracking;
