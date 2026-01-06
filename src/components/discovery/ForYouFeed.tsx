/**
 * For You Feed Component
 * Personalized event recommendations with liberation weighting
 *
 * Liberation Feature: Centers Black queer community events
 */

import { useState, useEffect, useCallback } from 'react';
import { Sparkles, TrendingUp, MapPin, RefreshCw, Loader2, Calendar, ChevronRight } from 'lucide-react';
import { Event } from '../../types';

const IVOR_API = import.meta.env.VITE_IVOR_API_URL || 'https://ivor.blkoutuk.cloud';

type FeedType = 'for-you' | 'trending' | 'nearby';

interface ForYouFeedProps {
  userId?: string;
  onEventClick?: (eventId: string) => void;
  showTabs?: boolean;
  limit?: number;
}

export function ForYouFeed({
  userId,
  onEventClick,
  showTabs = true,
  limit = 10
}: ForYouFeedProps) {
  const [feedType, setFeedType] = useState<FeedType>('for-you');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let endpoint = `${IVOR_API}/api/discover/events/for-you?limit=${limit}`;

      if (feedType === 'trending') {
        endpoint = `${IVOR_API}/api/discover/events/trending?limit=${limit}`;
      } else if (feedType === 'nearby' && userLocation) {
        endpoint = `${IVOR_API}/api/discover/events/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}&limit=${limit}`;
      }

      if (userId) {
        endpoint += `&userId=${userId}`;
      }

      const response = await fetch(endpoint);
      const data = await response.json();

      if (data.success) {
        setEvents(data.events || []);
      } else {
        setError(data.error || 'Failed to load recommendations');
      }
    } catch (err: any) {
      console.error('[ForYouFeed] Fetch error:', err);
      setError('Unable to load recommendations');
    } finally {
      setLoading(false);
    }
  }, [feedType, userId, userLocation, limit]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  useEffect(() => {
    // Get user location for nearby events
    if (feedType === 'nearby' && !userLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (err) => {
          console.log('[ForYouFeed] Location access denied');
          // Default to London
          setUserLocation({ lat: 51.5074, lng: -0.1278 });
        }
      );
    }
  }, [feedType, userLocation]);

  // Track view interactions
  const trackView = async (eventId: string) => {
    try {
      await fetch(`${IVOR_API}/api/discover/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          contentType: 'event',
          contentId: eventId,
          interactionType: 'view',
          source: `feed-${feedType}`
        })
      });
    } catch (err) {
      // Silent fail for tracking
    }
  };

  const handleEventClick = (event: Event) => {
    trackView(event.id);
    if (onEventClick) {
      onEventClick(event.id);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <div className="bg-gray-800/50 rounded-xl border border-yellow-500/20 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            <h3 className="text-white font-bold">Discover Events</h3>
          </div>
          <button
            onClick={fetchFeed}
            disabled={loading}
            className="p-2 text-white/60 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Feed Type Tabs */}
        {showTabs && (
          <div className="flex gap-2 mt-4">
            <TabButton
              active={feedType === 'for-you'}
              onClick={() => setFeedType('for-you')}
              icon={<Sparkles className="w-4 h-4" />}
              label="For You"
            />
            <TabButton
              active={feedType === 'trending'}
              onClick={() => setFeedType('trending')}
              icon={<TrendingUp className="w-4 h-4" />}
              label="Trending"
            />
            <TabButton
              active={feedType === 'nearby'}
              onClick={() => setFeedType('nearby')}
              icon={<MapPin className="w-4 h-4" />}
              label="Nearby"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-yellow-500" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-white/60 mb-4">{error}</p>
            <button
              onClick={fetchFeed}
              className="px-4 py-2 bg-yellow-500/20 text-yellow-500 rounded-lg hover:bg-yellow-500/30 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 mx-auto text-white/30 mb-4" />
            <p className="text-white/60">No events found</p>
            <p className="text-white/40 text-sm mt-1">
              Check back soon for community events
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.filter(event => event && event.id).map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onClick={() => handleEventClick(event)}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}
      </div>

      {/* Liberation Badge */}
      <div className="px-4 pb-4">
        <div className="text-center text-xs text-white/40 py-2 border-t border-white/10">
          🏴‍☠️ Liberation-weighted recommendations centering Black queer joy
        </div>
      </div>
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function TabButton({ active, onClick, icon, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
        active
          ? 'bg-yellow-500 text-black font-medium'
          : 'bg-white/10 text-white/70 hover:bg-white/20'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

interface EventCardProps {
  event: Event;
  onClick: () => void;
  formatDate: (date: string) => string;
}

function EventCard({ event, onClick, formatDate }: EventCardProps) {
  const liberationScore = (event as any).liberation_score || 50;
  const isHighLiberation = liberationScore >= 70;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left group"
    >
      {/* Date Badge */}
      <div className="flex-shrink-0 w-14 h-14 bg-yellow-500/20 rounded-lg flex flex-col items-center justify-center">
        <span className="text-yellow-500 text-xs font-medium">
          {formatDate(event.date).split(' ')[0]}
        </span>
        <span className="text-white font-bold text-lg leading-tight">
          {new Date(event.date).getDate()}
        </span>
      </div>

      {/* Event Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-white font-medium truncate">
            {event.title}
          </h4>
          {isHighLiberation && (
            <span className="flex-shrink-0 px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
              ✊
            </span>
          )}
        </div>
        <p className="text-white/60 text-sm truncate mt-0.5">
          {event.location || 'Location TBA'}
        </p>
        {event.organizer_name && (
          <p className="text-white/40 text-xs truncate mt-0.5">
            by {event.organizer_name}
          </p>
        )}
      </div>

      {/* Arrow */}
      <ChevronRight className="flex-shrink-0 w-5 h-5 text-white/30 group-hover:text-white/60 transition-colors" />
    </button>
  );
}

export default ForYouFeed;
