/**
 * My Events Page Component
 * Shows user's RSVP'd events with check-in codes and calendar sync
 *
 * Liberation Feature: Keeps community connected to their gatherings
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Check,
  Clock,
  MapPin,
  QrCode,
  RefreshCw,
  Loader2,
  CalendarDays,
  AlertCircle,
  ExternalLink,
  Ticket
} from 'lucide-react';
import { AddToCalendar } from './AddToCalendar';

const IVOR_API = import.meta.env.VITE_IVOR_API_URL || 'https://ivor.blkoutuk.cloud';

interface RSVPEvent {
  id: string;
  event_id: string;
  status: 'confirmed' | 'waitlist' | 'cancelled';
  check_in_code: string;
  guest_count: number;
  checked_in: boolean;
  checked_in_at?: string;
  created_at: string;
  // Event details (joined)
  event?: {
    id: string;
    title: string;
    date: string;
    end_date?: string;
    location?: string;
    image_url?: string;
    category?: string;
  };
}

interface MyEventsProps {
  userId: string;
  onEventClick?: (eventId: string) => void;
}

export function MyEvents({ userId, onEventClick }: MyEventsProps) {
  const [rsvps, setRsvps] = useState<RSVPEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const [showQRCode, setShowQRCode] = useState<string | null>(null);

  const fetchRSVPs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${IVOR_API}/api/rsvp/user/${userId}/rsvps`);
      const data = await response.json();

      if (data.success) {
        setRsvps(data.rsvps || []);
      } else {
        setError(data.error || 'Failed to load your events');
      }
    } catch (err: any) {
      console.error('[MyEvents] Fetch error:', err);
      setError('Unable to load your events');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchRSVPs();
  }, [fetchRSVPs]);

  // Filter events
  const filteredRsvps = rsvps.filter((rsvp) => {
    if (rsvp.status === 'cancelled') return false;

    const eventDate = rsvp.event?.date ? new Date(rsvp.event.date) : new Date();
    const now = new Date();

    if (filter === 'upcoming') return eventDate >= now;
    if (filter === 'past') return eventDate < now;
    return true;
  });

  // Group by month
  const groupedRsvps = filteredRsvps.reduce((groups, rsvp) => {
    const date = rsvp.event?.date ? new Date(rsvp.event.date) : new Date();
    const monthKey = date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

    if (!groups[monthKey]) {
      groups[monthKey] = [];
    }
    groups[monthKey].push(rsvp);
    return groups;
  }, {} as Record<string, RSVPEvent[]>);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isEventToday = (dateStr?: string) => {
    if (!dateStr) return false;
    const eventDate = new Date(dateStr);
    const today = new Date();
    return eventDate.toDateString() === today.toDateString();
  };

  const isEventSoon = (dateStr?: string) => {
    if (!dateStr) return false;
    const eventDate = new Date(dateStr);
    const now = new Date();
    const hoursUntil = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntil > 0 && hoursUntil <= 24;
  };

  return (
    <div className="bg-liberation-black-power/50 rounded-xl border border-liberation-gold-divine/20 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-liberation-gold-divine" />
            <h2 className="text-white font-bold text-lg">My Events</h2>
          </div>
          <button
            onClick={fetchRSVPs}
            disabled={loading}
            className="p-2 text-white/60 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {(['upcoming', 'past', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-liberation-gold-divine text-liberation-black-power'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-liberation-gold-divine" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 mx-auto text-red-400/50 mb-4" />
            <p className="text-white/60 mb-4">{error}</p>
            <button
              onClick={fetchRSVPs}
              className="px-4 py-2 bg-liberation-gold-divine/20 text-liberation-gold-divine rounded-lg hover:bg-liberation-gold-divine/30 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredRsvps.length === 0 ? (
          <div className="text-center py-12">
            <CalendarDays className="w-12 h-12 mx-auto text-white/30 mb-4" />
            <p className="text-white/60">
              {filter === 'upcoming'
                ? "No upcoming events"
                : filter === 'past'
                  ? "No past events"
                  : "No events found"
              }
            </p>
            <p className="text-white/40 text-sm mt-1">
              RSVP to events to see them here
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedRsvps).map(([month, monthRsvps]) => (
              <div key={month}>
                <h3 className="text-white/50 text-sm font-medium mb-3">{month}</h3>
                <div className="space-y-3">
                  {monthRsvps.map((rsvp) => (
                    <EventCard
                      key={rsvp.id}
                      rsvp={rsvp}
                      isToday={isEventToday(rsvp.event?.date)}
                      isSoon={isEventSoon(rsvp.event?.date)}
                      formatDate={formatDate}
                      formatTime={formatTime}
                      onEventClick={onEventClick}
                      showQRCode={showQRCode}
                      setShowQRCode={setShowQRCode}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Calendar sync */}
      <div className="p-4 border-t border-white/10 bg-white/5">
        <div className="flex items-center justify-between">
          <div className="text-sm text-white/60">
            <Calendar className="w-4 h-4 inline mr-2" />
            Sync all your events
          </div>
          <a
            href={`${IVOR_API}/api/calendar/feed/public`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-liberation-gold-divine hover:text-liberation-gold-divine/80 flex items-center gap-1"
          >
            Subscribe to feed
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}

interface EventCardProps {
  rsvp: RSVPEvent;
  isToday: boolean;
  isSoon: boolean;
  formatDate: (date?: string) => string;
  formatTime: (date?: string) => string;
  onEventClick?: (eventId: string) => void;
  showQRCode: string | null;
  setShowQRCode: (id: string | null) => void;
}

function EventCard({
  rsvp,
  isToday,
  isSoon,
  formatDate,
  formatTime,
  onEventClick,
  showQRCode,
  setShowQRCode
}: EventCardProps) {
  const event = rsvp.event || {
    id: rsvp.event_id,
    title: 'Event',
    date: rsvp.created_at
  };

  return (
    <div
      className={`rounded-xl overflow-hidden border transition-colors ${
        isToday
          ? 'border-liberation-gold-divine/50 bg-liberation-gold-divine/10'
          : isSoon
            ? 'border-yellow-500/30 bg-yellow-500/5'
            : 'border-white/10 bg-white/5'
      }`}
    >
      <div className="p-4">
        <div className="flex gap-4">
          {/* Date badge */}
          <div className="flex-shrink-0 w-14 text-center">
            <div className={`rounded-lg py-2 ${isToday ? 'bg-liberation-gold-divine text-liberation-black-power' : 'bg-white/10'}`}>
              <div className="text-xs font-medium">
                {new Date(event.date).toLocaleDateString('en-GB', { weekday: 'short' })}
              </div>
              <div className="text-2xl font-bold">
                {new Date(event.date).getDate()}
              </div>
            </div>
          </div>

          {/* Event info */}
          <div className="flex-1 min-w-0">
            <button
              onClick={() => onEventClick?.(event.id)}
              className="text-left"
            >
              <h4 className="text-white font-medium hover:text-liberation-gold-divine transition-colors">
                {event.title}
              </h4>
            </button>

            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-white/60">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatTime(event.date)}
              </span>
              {event.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {event.location}
                </span>
              )}
            </div>

            {/* Status badges */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {rsvp.status === 'confirmed' && (
                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Confirmed
                </span>
              )}
              {rsvp.status === 'waitlist' && (
                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                  On Waitlist
                </span>
              )}
              {rsvp.checked_in && (
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">
                  ✓ Checked In
                </span>
              )}
              {rsvp.guest_count > 0 && (
                <span className="px-2 py-0.5 bg-white/10 text-white/60 text-xs rounded">
                  +{rsvp.guest_count} guest{rsvp.guest_count > 1 ? 's' : ''}
                </span>
              )}
              {isToday && (
                <span className="px-2 py-0.5 bg-liberation-gold-divine/20 text-liberation-gold-divine text-xs rounded font-medium">
                  TODAY
                </span>
              )}
              {isSoon && !isToday && (
                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                  Starting Soon
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setShowQRCode(showQRCode === rsvp.id ? null : rsvp.id)}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              title="Show check-in QR code"
            >
              <QrCode className="w-5 h-5 text-white/70" />
            </button>
            <AddToCalendar event={event} variant="icon" />
          </div>
        </div>

        {/* QR Code section */}
        {showQRCode === rsvp.id && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/50 text-xs mb-1">Check-in Code</p>
                <p className="font-mono text-liberation-gold-divine text-lg font-bold">
                  {rsvp.check_in_code}
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                {/* Placeholder for QR code - in production, use a QR library */}
                <div className="w-24 h-24 bg-gray-200 flex items-center justify-center text-gray-400 text-xs text-center">
                  QR Code<br />{rsvp.check_in_code}
                </div>
              </div>
            </div>
            <p className="text-white/40 text-xs mt-3">
              Show this code at the event entrance for quick check-in
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyEvents;
