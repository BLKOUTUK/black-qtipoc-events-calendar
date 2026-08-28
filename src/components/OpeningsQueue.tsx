// Light approve/reject queue for the Openings stream — admin surface, plain and
// sharp-edged (no rounded-*), matching the dark/functional conventions of
// ModerationQueue.tsx and ModerationDashboardPage.tsx.
// Auth: reads the signed-in moderator's session token from supabase.auth.getSession()
// and sends it as a Bearer on both /api/pending-openings and /api/moderate-opening.
import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Loader2, ExternalLink, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Opening {
  id: string;
  title: string;
  organisation: string;
  kind: string;
  beat: string;
  summary: string | null;
  open_to: string | null;
  pay: string | null;
  location: string | null;
  url: string;
  deadline: string | null;
  found_by: string | null;
  status: string;
  source: string;
  submitted_at: string;
}

const REJECT_REASONS = [
  'not open to UK applicants',
  'deadline passed',
  'duplicate',
  'not a real opening',
  'other',
];

function formatDeadline(deadline: string | null): string {
  if (!deadline) return 'rolling';
  const d = new Date(`${deadline}T00:00:00`);
  if (isNaN(d.getTime())) return deadline;
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

async function getToken(): Promise<string | null> {
  try {
    // The no-op fallback client (used when Supabase env vars are missing) doesn't
    // implement getSession — cast rather than touch src/lib/supabase.ts (out of scope).
    const auth = supabase.auth as unknown as {
      getSession: () => Promise<{ data: { session: { access_token: string } | null } }>;
    };
    const { data } = await auth.getSession();
    return data?.session?.access_token || null;
  } catch (err) {
    console.error('[OpeningsQueue] getSession failed:', err);
    return null;
  }
}

export function OpeningsQueue() {
  const [openings, setOpenings] = useState<Opening[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectFreeText, setRejectFreeText] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function loadOpenings() {
    setLoading(true);
    setError(null);
    const token = await getToken();
    if (!token) {
      setHasSession(false);
      setLoading(false);
      return;
    }
    try {
      const response = await fetch('/api/pending-openings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401) {
        setHasSession(false);
        setOpenings([]);
        return;
      }
      const result = await response.json();
      setHasSession(true);
      if (!result.success) {
        setError(result.error || 'Failed to load openings');
        setOpenings([]);
      } else {
        setOpenings(result.openings || []);
      }
    } catch (err: any) {
      console.error('[OpeningsQueue] Load error:', err);
      setError(err.message || 'Failed to load openings');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOpenings();
  }, []);

  async function moderate(id: string, action: 'approve' | 'reject', reason?: string) {
    setActionLoading(id);
    setError(null);
    const token = await getToken();
    if (!token) {
      setHasSession(false);
      setActionLoading(null);
      return;
    }
    try {
      const response = await fetch('/api/moderate-opening', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, action, reason }),
      });
      if (response.status === 401) {
        setHasSession(false);
        return;
      }
      const result = await response.json();
      if (!result.success) {
        setError(result.error || `Failed to ${action} opening`);
        return;
      }
      setOpenings(prev => prev.filter(o => o.id !== id));
      setRejectOpen(null);
      setRejectReason('');
      setRejectFreeText('');
    } catch (err: any) {
      console.error(`[OpeningsQueue] ${action} error:`, err);
      setError(err.message || `Failed to ${action} opening`);
    } finally {
      setActionLoading(null);
    }
  }

  function confirmReject(id: string) {
    const reason = rejectReason === 'other' ? rejectFreeText.trim() : rejectReason;
    moderate(id, 'reject', reason || undefined);
  }

  if (hasSession === false) {
    return (
      <div className="bg-white/5 border border-white/10 p-6 text-white/60">
        Sign in to moderate.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-events" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3 text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Openings pending review ({openings.length})</h2>
        <button
          onClick={loadOpenings}
          className="flex items-center gap-1 text-white/60 hover:text-white text-sm border border-white/20 px-3 py-1"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh
        </button>
      </div>

      {openings.length === 0 ? (
        <div className="text-center py-8 text-white/60 border border-white/10">
          Nothing pending.
        </div>
      ) : (
        <div className="space-y-3">
          {openings.map(o => (
            <div key={o.id} className="bg-white/5 border border-white/10 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1 text-xs font-mono uppercase text-white/40">
                    <span className="px-2 py-0.5 border border-white/20 text-events">{o.kind}</span>
                    <span>{o.beat}</span>
                    <span>closes {formatDeadline(o.deadline)}</span>
                  </div>
                  <h3 className="text-white font-semibold">{o.title}</h3>
                  <p className="text-white/60 text-sm">{o.organisation}</p>
                  {o.summary && <p className="text-white/70 text-sm mt-1">{o.summary}</p>}
                  {o.open_to && <p className="text-white/50 text-xs mt-1">open to: {o.open_to}</p>}
                  {o.pay && <p className="text-white/50 text-xs">pay: {o.pay}</p>}
                  {o.location && <p className="text-white/50 text-xs">location: {o.location}</p>}
                  <a
                    href={o.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-events text-sm inline-flex items-center gap-1 mt-2 hover:underline break-all"
                  >
                    <ExternalLink className="w-3 h-3 shrink-0" /> {o.url}
                  </a>
                  <div className="text-white/40 text-xs mt-2">
                    found by {o.found_by || 'unknown'} · submitted {new Date(o.submitted_at).toLocaleDateString('en-GB')}
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => moderate(o.id, 'approve')}
                    disabled={actionLoading === o.id}
                    className="flex items-center gap-1 px-3 py-2 bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30 disabled:opacity-50"
                  >
                    {actionLoading === o.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Approve
                  </button>
                  <button
                    onClick={() => setRejectOpen(rejectOpen === o.id ? null : o.id)}
                    disabled={actionLoading === o.id}
                    className="flex items-center gap-1 px-3 py-2 bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>

              {rejectOpen === o.id && (
                <div className="mt-3 border-t border-white/10 pt-3">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {REJECT_REASONS.map(reason => (
                      <button
                        key={reason}
                        onClick={() => setRejectReason(reason)}
                        className={`text-xs font-mono uppercase px-2 py-1 border ${
                          rejectReason === reason
                            ? 'border-events text-events'
                            : 'border-white/20 text-white/50 hover:border-white/40'
                        }`}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                  {rejectReason === 'other' && (
                    <input
                      type="text"
                      value={rejectFreeText}
                      onChange={e => setRejectFreeText(e.target.value)}
                      placeholder="reason"
                      className="w-full bg-black/30 border border-white/20 px-2 py-1 text-white text-sm mb-2"
                    />
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => confirmReject(o.id)}
                      disabled={!rejectReason || actionLoading === o.id}
                      className="px-3 py-1 bg-red-500/30 text-red-200 border border-red-500/50 disabled:opacity-40 text-sm"
                    >
                      Confirm reject
                    </button>
                    <button
                      onClick={() => { setRejectOpen(null); setRejectReason(''); setRejectFreeText(''); }}
                      className="px-3 py-1 border border-white/20 text-white/60 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default OpeningsQueue;
