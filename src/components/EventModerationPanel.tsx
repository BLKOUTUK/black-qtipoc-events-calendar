/**
 * Event Moderation Panel Component
 * Full-featured event moderation interface with bulk operations
 */

import { useState, useEffect } from 'react';
import {
  Calendar, CheckCircle, XCircle, AlertTriangle, Loader2,
  Filter, Clock, MapPin, Globe, Trash2, CheckCheck, Eye
} from 'lucide-react';
import { Event } from '../types';
import { supabaseApiService } from '../services/supabaseApiService';
import { eventModerationService, ModerationResult } from '../services/eventModerationService';
import { isTrustedSource, isAutoRejectSource } from '../config/trustedEventSources';

interface EventModerationPanelProps {
  onStatsUpdate?: () => void;
}

type FilterType = 'all' | 'future' | 'past' | 'trusted' | 'auto-reject' | 'manual-review';

export function EventModerationPanel({ onStatsUpdate }: EventModerationPanelProps) {
  const [loading, setLoading] = useState(true);
  const [pendingEvents, setPendingEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  useEffect(() => {
    loadPendingEvents();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [filter, pendingEvents]);

  const loadPendingEvents = async () => {
    setLoading(true);
    try {
      // Fetch events with status 'draft' or 'pending'
      const events = await supabaseApiService.getEvents({
        dateRange: 'all',
        source: 'all',
        location: '',
        searchTerm: '',
        status: 'draft' // In Supabase, pending events have status='draft' or custom 'pending'
      });

      // Filter to only pending/draft events
      const pending = events.filter(e =>
        e.status === 'draft' ||
        e.status === 'pending' ||
        (e as any).moderation_status === 'pending'
      );

      setPendingEvents(pending);
    } catch (error) {
      console.error('Failed to load pending events:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    const now = new Date();
    let filtered = [...pendingEvents];

    switch (filter) {
      case 'future':
        filtered = filtered.filter(e => {
          try {
            const date = new Date(e.start_date || e.date || '');
            return date > now;
          } catch {
            return false;
          }
        });
        break;

      case 'past':
        filtered = filtered.filter(e => {
          try {
            const date = new Date(e.start_date || e.date || '');
            return date <= now;
          } catch {
            return true; // Invalid dates considered past
          }
        });
        break;

      case 'trusted':
        filtered = filtered.filter(e => isTrustedSource(e.source || ''));
        break;

      case 'auto-reject':
        filtered = filtered.filter(e => isAutoRejectSource(e.source || ''));
        break;

      case 'manual-review':
        filtered = filtered.filter(e => {
          const source = e.source || '';
          return !isTrustedSource(source) && !isAutoRejectSource(source);
        });
        break;

      default:
        // 'all' - no filter
        break;
    }

    setFilteredEvents(filtered);
  };

  const handleApprove = async (eventId: string) => {
    setActionLoading(eventId);
    try {
      const success = await eventModerationService.approveEvent(eventId);
      if (success) {
        setPendingEvents(prev => prev.filter(e => e.id !== eventId));
        onStatsUpdate?.();
      }
    } catch (error) {
      console.error('Error approving event:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (eventId: string) => {
    setActionLoading(eventId);
    try {
      const success = await eventModerationService.rejectEvent(eventId);
      if (success) {
        setPendingEvents(prev => prev.filter(e => e.id !== eventId));
        onStatsUpdate?.();
      }
    } catch (error) {
      console.error('Error rejecting event:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkRejectPast = async () => {
    if (!confirm('Reject all past events? This action cannot be undone.')) {
      return;
    }

    setBulkActionLoading(true);
    try {
      const result = await eventModerationService.bulkReject(
        pendingEvents,
        true, // rejectPastEvents
        false,
        false
      );

      alert(`Bulk rejection complete:\n✓ ${result.rejected} events rejected\n${result.errors.length > 0 ? `⚠ ${result.errors.length} errors` : ''}`);

      await loadPendingEvents();
      onStatsUpdate?.();
    } catch (error) {
      console.error('Error in bulk rejection:', error);
      alert('Bulk rejection failed. Please try again.');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkRejectIncomplete = async () => {
    if (!confirm('Reject all events with incomplete location data? This action cannot be undone.')) {
      return;
    }

    setBulkActionLoading(true);
    try {
      const result = await eventModerationService.bulkReject(
        pendingEvents,
        false,
        true, // rejectIncompleteLocation
        false
      );

      alert(`Bulk rejection complete:\n✓ ${result.rejected} events rejected\n${result.errors.length > 0 ? `⚠ ${result.errors.length} errors` : ''}`);

      await loadPendingEvents();
      onStatsUpdate?.();
    } catch (error) {
      console.error('Error in bulk rejection:', error);
      alert('Bulk rejection failed. Please try again.');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkRejectAutoReject = async () => {
    if (!confirm('Reject all events from auto-reject sources (Web Search, test data)? This action cannot be undone.')) {
      return;
    }

    setBulkActionLoading(true);
    try {
      const result = await eventModerationService.bulkReject(
        pendingEvents,
        false,
        false,
        true // rejectAutoRejectSources
      );

      alert(`Bulk rejection complete:\n✓ ${result.rejected} events rejected\n${result.errors.length > 0 ? `⚠ ${result.errors.length} errors` : ''}`);

      await loadPendingEvents();
      onStatsUpdate?.();
    } catch (error) {
      console.error('Error in bulk rejection:', error);
      alert('Bulk rejection failed. Please try again.');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkApproveTrusted = async () => {
    if (!confirm('Approve all future events from trusted sources? This will publish them to the calendar.')) {
      return;
    }

    setBulkActionLoading(true);
    try {
      const result = await eventModerationService.bulkApprove(
        pendingEvents,
        {
          requireFutureDate: true,
          requireCompleteLocation: true,
          trustedSourcesOnly: true
        }
      );

      alert(`Bulk approval complete:\n✓ ${result.approved} events approved\n${result.errors.length > 0 ? `⚠ ${result.errors.length} errors` : ''}`);

      await loadPendingEvents();
      onStatsUpdate?.();
    } catch (error) {
      console.error('Error in bulk approval:', error);
      alert('Bulk approval failed. Please try again.');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const getEventDateStatus = (event: Event): 'future' | 'past' | 'invalid' => {
    try {
      const date = new Date(event.start_date || event.date || '');
      return date > new Date() ? 'future' : 'past';
    } catch {
      return 'invalid';
    }
  };

  const getSourceBadgeColor = (source: string): string => {
    if (isTrustedSource(source)) return 'bg-green-500/20 text-green-300 border-green-500/50';
    if (isAutoRejectSource(source)) return 'bg-red-500/20 text-red-300 border-red-500/50';
    return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 rounded-lg border border-white/10 p-4">
          <p className="text-2xl font-bold text-white">{pendingEvents.length}</p>
          <p className="text-white/60 text-sm">Total Pending</p>
        </div>
        <div className="bg-green-500/10 rounded-lg border border-green-500/30 p-4">
          <p className="text-2xl font-bold text-green-400">
            {pendingEvents.filter(e => getEventDateStatus(e) === 'future').length}
          </p>
          <p className="text-white/60 text-sm">Future Events</p>
        </div>
        <div className="bg-red-500/10 rounded-lg border border-red-500/30 p-4">
          <p className="text-2xl font-bold text-red-400">
            {pendingEvents.filter(e => getEventDateStatus(e) === 'past').length}
          </p>
          <p className="text-white/60 text-sm">Past Events</p>
        </div>
        <div className="bg-blue-500/10 rounded-lg border border-blue-500/30 p-4">
          <p className="text-2xl font-bold text-blue-400">
            {pendingEvents.filter(e => isTrustedSource(e.source || '')).length}
          </p>
          <p className="text-white/60 text-sm">Trusted Sources</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'all', label: 'All Events', icon: Filter },
          { id: 'future', label: 'Future Only', icon: Calendar },
          { id: 'past', label: 'Past Events', icon: Clock },
          { id: 'trusted', label: 'Trusted Sources', icon: CheckCircle },
          { id: 'auto-reject', label: 'Auto-Reject', icon: XCircle },
          { id: 'manual-review', label: 'Manual Review', icon: AlertTriangle }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setFilter(id as FilterType)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              filter === id
                ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Bulk Actions */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-4">
        <h3 className="text-white font-bold mb-3 flex items-center gap-2">
          <CheckCheck className="w-5 h-5 text-purple-400" />
          Bulk Operations
        </h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleBulkApproveTrusted}
            disabled={bulkActionLoading}
            className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
          >
            {bulkActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Approve Trusted (Future)
          </button>
          <button
            onClick={handleBulkRejectPast}
            disabled={bulkActionLoading}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
          >
            {bulkActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Reject Past Events
          </button>
          <button
            onClick={handleBulkRejectIncomplete}
            disabled={bulkActionLoading}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 text-orange-300 rounded-lg hover:bg-orange-500/30 transition-colors disabled:opacity-50"
          >
            {bulkActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
            Reject Incomplete Location
          </button>
          <button
            onClick={handleBulkRejectAutoReject}
            disabled={bulkActionLoading}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
          >
            {bulkActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
            Reject Web Search/Tests
          </button>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        <h3 className="text-white font-bold">
          {filteredEvents.length} Event{filteredEvents.length !== 1 ? 's' : ''} {filter !== 'all' && `(${filter})`}
        </h3>

        {filteredEvents.length === 0 ? (
          <div className="text-center py-12 text-white/60">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No events match this filter</p>
          </div>
        ) : (
          filteredEvents.map(event => (
            <EventCard
              key={event.id}
              event={event}
              onApprove={() => handleApprove(event.id)}
              onReject={() => handleReject(event.id)}
              loading={actionLoading === event.id}
              dateStatus={getEventDateStatus(event)}
              sourceBadgeColor={getSourceBadgeColor(event.source || '')}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Event Card Component
function EventCard({
  event,
  onApprove,
  onReject,
  loading,
  dateStatus,
  sourceBadgeColor
}: {
  event: Event;
  onApprove: () => void;
  onReject: () => void;
  loading: boolean;
  dateStatus: 'future' | 'past' | 'invalid';
  sourceBadgeColor: string;
}) {
  return (
    <div className="bg-white/5 rounded-lg border border-white/10 p-4 hover:bg-white/[0.07] transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Title and badges */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h4 className="text-white font-medium">{event.title || 'Untitled Event'}</h4>
            <span className={`px-2 py-0.5 rounded text-xs border ${sourceBadgeColor}`}>
              {event.source || 'Unknown'}
            </span>
            <span className={`px-2 py-0.5 rounded text-xs ${
              dateStatus === 'future' ? 'bg-green-500/20 text-green-300' :
              dateStatus === 'past' ? 'bg-red-500/20 text-red-300' :
              'bg-gray-500/20 text-gray-300'
            }`}>
              {dateStatus === 'future' ? 'Future' : dateStatus === 'past' ? 'Past' : 'Invalid Date'}
            </span>
          </div>

          {/* Event details */}
          <div className="space-y-1 text-sm text-white/60 mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{event.start_date || event.date || 'No date'}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span className="truncate">{event.location || 'No location'}</span>
            </div>
            {event.description && (
              <p className="text-white/50 text-xs line-clamp-2 mt-2">
                {event.description}
              </p>
            )}
          </div>

          {/* URL */}
          {event.url && (
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 text-sm hover:text-purple-300 inline-flex items-center gap-1"
            >
              <Eye className="w-3 h-3" />
              View Source
            </a>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 shrink-0">
          <button
            onClick={onApprove}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-2 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Approve
          </button>
          <button
            onClick={onReject}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

export default EventModerationPanel;
