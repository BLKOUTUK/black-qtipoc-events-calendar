/**
 * RSVP Button Component
 * Handles event registration with capacity management
 *
 * Liberation Feature: Tracks community gathering participation
 */

import { useState, useEffect, useCallback } from 'react';
import { Check, Users, Loader2, AlertCircle, X } from 'lucide-react';

const IVOR_API = import.meta.env.VITE_IVOR_API_URL || 'https://ivor.blkoutuk.cloud';

interface RSVPButtonProps {
  eventId: string;
  userId?: string;
  onRSVPChange?: (status: RSVPStatus) => void;
  size?: 'sm' | 'md' | 'lg';
  showCapacity?: boolean;
}

interface RSVPStatus {
  isRegistered: boolean;
  status: 'confirmed' | 'waitlist' | 'cancelled' | null;
  checkInCode?: string;
  guestCount?: number;
}

interface CapacityInfo {
  maxCapacity: number | null;
  confirmedCount: number;
  waitlistCount: number;
  spotsRemaining: number | null;
  isAtCapacity: boolean;
  waitlistEnabled: boolean;
}

export function RSVPButton({
  eventId,
  userId,
  onRSVPChange,
  size = 'md',
  showCapacity = true
}: RSVPButtonProps) {
  const [rsvpStatus, setRsvpStatus] = useState<RSVPStatus>({
    isRegistered: false,
    status: null
  });
  const [capacity, setCapacity] = useState<CapacityInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [guestCount, setGuestCount] = useState(0);

  // Fetch current RSVP status and capacity
  const fetchStatus = useCallback(async () => {
    try {
      const [capacityRes, rsvpsRes] = await Promise.all([
        fetch(`${IVOR_API}/api/rsvp/${eventId}/capacity`),
        userId ? fetch(`${IVOR_API}/api/rsvp/user/${userId}/rsvps`) : Promise.resolve(null)
      ]);

      const capacityData = await capacityRes.json();
      if (capacityData.success) {
        setCapacity(capacityData.capacity);
      }

      if (rsvpsRes) {
        const rsvpsData = await rsvpsRes.json();
        if (rsvpsData.success) {
          const eventRsvp = rsvpsData.rsvps?.find((r: any) => r.event_id === eventId);
          if (eventRsvp) {
            setRsvpStatus({
              isRegistered: true,
              status: eventRsvp.status,
              checkInCode: eventRsvp.check_in_code,
              guestCount: eventRsvp.guest_count
            });
          }
        }
      }
    } catch (err) {
      console.error('[RSVPButton] Status fetch error:', err);
    }
  }, [eventId, userId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Handle RSVP submission
  const handleRSVP = async () => {
    if (!userId) {
      setError('Please sign in to RSVP');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${IVOR_API}/api/rsvp/${eventId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          guestCount
        })
      });

      const data = await response.json();

      if (data.success) {
        const newStatus: RSVPStatus = {
          isRegistered: true,
          status: data.rsvp.status,
          checkInCode: data.rsvp.check_in_code,
          guestCount: data.rsvp.guest_count
        };
        setRsvpStatus(newStatus);
        onRSVPChange?.(newStatus);
        fetchStatus(); // Refresh capacity
        setShowDetails(false);
      } else {
        setError(data.error || 'Failed to RSVP');
      }
    } catch (err: any) {
      console.error('[RSVPButton] RSVP error:', err);
      setError('Unable to process RSVP');
    } finally {
      setLoading(false);
    }
  };

  // Handle RSVP cancellation
  const handleCancel = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${IVOR_API}/api/rsvp/${eventId}/rsvp`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();

      if (data.success) {
        const newStatus: RSVPStatus = {
          isRegistered: false,
          status: null
        };
        setRsvpStatus(newStatus);
        onRSVPChange?.(newStatus);
        fetchStatus(); // Refresh capacity
      } else {
        setError(data.error || 'Failed to cancel RSVP');
      }
    } catch (err: any) {
      console.error('[RSVPButton] Cancel error:', err);
      setError('Unable to cancel RSVP');
    } finally {
      setLoading(false);
    }
  };

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  // Render capacity indicator
  const renderCapacityBadge = () => {
    if (!showCapacity || !capacity) return null;

    if (capacity.maxCapacity === null) {
      return (
        <span className="text-xs text-white/50">
          {capacity.confirmedCount} attending
        </span>
      );
    }

    const percentage = (capacity.confirmedCount / capacity.maxCapacity) * 100;
    const colorClass = percentage >= 90 ? 'text-red-400' : percentage >= 70 ? 'text-yellow-400' : 'text-green-400';

    return (
      <div className="flex items-center gap-1.5 text-xs">
        <Users className="w-3.5 h-3.5" />
        <span className={colorClass}>
          {capacity.spotsRemaining !== null
            ? `${capacity.spotsRemaining} spots left`
            : `${capacity.confirmedCount}/${capacity.maxCapacity}`
          }
        </span>
        {capacity.waitlistCount > 0 && (
          <span className="text-white/50">
            (+{capacity.waitlistCount} waitlist)
          </span>
        )}
      </div>
    );
  };

  // Already RSVP'd state
  if (rsvpStatus.isRegistered) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className={`${sizeClasses[size]} flex items-center gap-2 rounded-lg font-medium transition-all ${
              rsvpStatus.status === 'waitlist'
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                : 'bg-green-500/20 text-green-400 border border-green-500/30'
            }`}
          >
            <Check className="w-4 h-4" />
            {rsvpStatus.status === 'waitlist' ? 'On Waitlist' : 'Going'}
            {rsvpStatus.guestCount ? ` +${rsvpStatus.guestCount}` : ''}
          </button>
        </div>

        {showDetails && (
          <div className="bg-white/5 rounded-lg p-3 space-y-2">
            {rsvpStatus.checkInCode && (
              <div className="text-xs">
                <span className="text-white/50">Check-in code: </span>
                <span className="font-mono text-liberation-gold-divine">{rsvpStatus.checkInCode}</span>
              </div>
            )}
            <button
              onClick={handleCancel}
              disabled={loading}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
              Cancel RSVP
            </button>
          </div>
        )}

        {renderCapacityBadge()}
      </div>
    );
  }

  // RSVP form
  return (
    <div className="space-y-2">
      {showDetails ? (
        <div className="bg-white/5 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-white font-medium">RSVP Details</span>
            <button
              onClick={() => setShowDetails(false)}
              className="text-white/50 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Guest count */}
          <div>
            <label className="block text-sm text-white/70 mb-1">
              Additional guests
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setGuestCount(Math.max(0, guestCount - 1))}
                className="w-8 h-8 rounded bg-white/10 text-white hover:bg-white/20"
              >
                -
              </button>
              <span className="w-8 text-center text-white">{guestCount}</span>
              <button
                onClick={() => setGuestCount(Math.min(5, guestCount + 1))}
                className="w-8 h-8 rounded bg-white/10 text-white hover:bg-white/20"
              >
                +
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <button
            onClick={handleRSVP}
            disabled={loading}
            className="w-full py-2 bg-liberation-gold-divine text-liberation-black-power rounded-lg font-medium hover:bg-liberation-gold-divine/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : capacity?.isAtCapacity ? (
              'Join Waitlist'
            ) : (
              'Confirm RSVP'
            )}
          </button>
        </div>
      ) : (
        <>
          <button
            onClick={() => userId ? setShowDetails(true) : setError('Please sign in to RSVP')}
            disabled={loading}
            className={`${sizeClasses[size]} w-full bg-liberation-gold-divine text-liberation-black-power rounded-lg font-medium hover:bg-liberation-gold-divine/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2`}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {capacity?.isAtCapacity && capacity.waitlistEnabled
              ? 'Join Waitlist'
              : capacity?.isAtCapacity
                ? 'Event Full'
                : 'RSVP'
            }
          </button>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-xs">
              <AlertCircle className="w-3 h-3" />
              {error}
            </div>
          )}

          {renderCapacityBadge()}
        </>
      )}
    </div>
  );
}

export default RSVPButton;
