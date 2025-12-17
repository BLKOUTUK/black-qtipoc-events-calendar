/**
 * Check-In Scanner Component
 * QR code scanning for event attendance
 *
 * Liberation Feature: Smooth entry to community gatherings
 */

import { useState, useCallback } from 'react';
import { QrCode, Check, X, Loader2, Users, AlertCircle, Search } from 'lucide-react';

const IVOR_API = import.meta.env.VITE_IVOR_API_URL || 'https://ivor.blkoutuk.cloud';

interface CheckInResult {
  success: boolean;
  attendeeName?: string;
  guestCount?: number;
  error?: string;
}

interface CheckInScannerProps {
  eventId: string;
  onCheckIn?: (result: CheckInResult) => void;
  className?: string;
}

export function CheckInScanner({
  eventId,
  onCheckIn,
  className = ''
}: CheckInScannerProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [stats, setStats] = useState({
    checkedIn: 0,
    total: 0
  });

  // Fetch check-in stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${IVOR_API}/api/rsvp/${eventId}/rsvps`);
      const data = await response.json();

      if (data.success) {
        const confirmed = data.rsvps.filter((r: any) => r.status === 'confirmed');
        const checkedIn = confirmed.filter((r: any) => r.checked_in);

        setStats({
          checkedIn: checkedIn.length,
          total: confirmed.length
        });
      }
    } catch (err) {
      console.error('[CheckInScanner] Stats error:', err);
    }
  }, [eventId]);

  // Process check-in
  const handleCheckIn = async (checkInCode: string) => {
    if (!checkInCode.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`${IVOR_API}/api/rsvp/${eventId}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkInCode: checkInCode.trim().toUpperCase() })
      });

      const data = await response.json();

      const checkInResult: CheckInResult = {
        success: data.success,
        attendeeName: data.rsvp?.attendee_name,
        guestCount: data.rsvp?.guest_count,
        error: data.error
      };

      setResult(checkInResult);
      onCheckIn?.(checkInResult);

      if (data.success) {
        setCode('');
        await fetchStats();
      }
    } catch (err: any) {
      console.error('[CheckInScanner] Check-in error:', err);
      const errorResult: CheckInResult = {
        success: false,
        error: 'Network error - please try again'
      };
      setResult(errorResult);
      onCheckIn?.(errorResult);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCheckIn(code);
  };

  return (
    <div className={`bg-liberation-black-power/50 rounded-xl border border-liberation-gold-divine/20 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-liberation-gold-divine" />
            <h3 className="text-white font-bold">Event Check-In</h3>
          </div>
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <Users className="w-4 h-4" />
            <span>{stats.checkedIn} / {stats.total}</span>
          </div>
        </div>
      </div>

      {/* Check-in Form */}
      <div className="p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Enter code (BLK-XXXXXXXX)"
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-liberation-gold-divine font-mono"
              disabled={loading}
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="px-6 py-3 bg-liberation-gold-divine text-liberation-black-power font-medium rounded-lg hover:bg-liberation-gold-divine/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Check In'
            )}
          </button>
        </form>

        {/* Result Display */}
        {result && (
          <div className={`mt-4 p-4 rounded-lg flex items-start gap-3 ${
            result.success
              ? 'bg-green-500/10 border border-green-500/20'
              : 'bg-red-500/10 border border-red-500/20'
          }`}>
            {result.success ? (
              <>
                <Check className="w-6 h-6 text-green-400 flex-shrink-0" />
                <div>
                  <p className="text-green-400 font-medium">
                    Check-in successful!
                  </p>
                  {result.attendeeName && (
                    <p className="text-white mt-1">
                      Welcome, {result.attendeeName}
                      {result.guestCount && result.guestCount > 0 && (
                        <span className="text-white/60">
                          {' '}+ {result.guestCount} guest{result.guestCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <X className="w-6 h-6 text-red-400 flex-shrink-0" />
                <div>
                  <p className="text-red-400 font-medium">
                    Check-in failed
                  </p>
                  <p className="text-white/60 text-sm mt-1">
                    {result.error || 'Invalid or already used code'}
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-4 p-3 bg-white/5 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-white/40 flex-shrink-0 mt-0.5" />
            <div className="text-white/40 text-xs">
              <p className="mb-1">Enter the attendee's check-in code (found in their RSVP confirmation).</p>
              <p>Codes start with <span className="font-mono text-liberation-gold-divine/60">BLK-</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-4 pb-4">
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-liberation-gold-divine transition-all duration-500"
            style={{ width: stats.total > 0 ? `${(stats.checkedIn / stats.total) * 100}%` : '0%' }}
          />
        </div>
        <p className="text-center text-white/40 text-xs mt-2">
          {stats.total > 0
            ? `${Math.round((stats.checkedIn / stats.total) * 100)}% checked in`
            : 'No RSVPs yet'
          }
        </p>
      </div>
    </div>
  );
}

export default CheckInScanner;
