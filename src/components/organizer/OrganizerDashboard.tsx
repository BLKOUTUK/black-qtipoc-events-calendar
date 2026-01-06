/**
 * Organizer Dashboard Component
 * Main dashboard for event organizers
 *
 * Liberation Feature: Empowering Black queer event creators
 */

import { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, Calendar, Users, BarChart3, Settings,
  Plus, ChevronRight, TrendingUp, Clock, CheckCircle2,
  Loader2, AlertCircle, Award
} from 'lucide-react';

const IVOR_API = import.meta.env.VITE_IVOR_API_URL || 'https://ivor.blkoutuk.cloud';

interface DashboardData {
  organizer: any;
  stats: {
    totalEvents: number;
    totalAttendees: number;
    upcomingEvents: number;
    averageRating: number;
    liberationScore: number;
    thisMonth: {
      events: number;
      rsvps: number;
      checkIns: number;
    };
  };
  upcomingEvents: any[];
  recentActivity: any[];
  quickActions: any[];
}

interface OrganizerDashboardProps {
  userId: string;
  onNavigate?: (section: string, id?: string) => void;
}

export function OrganizerDashboard({ userId, onNavigate }: OrganizerDashboardProps) {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'analytics'>('overview');

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${IVOR_API}/api/organizer/dashboard/${userId}`);
      const data = await response.json();

      if (data.success) {
        setDashboard(data.dashboard);
      } else {
        setError(data.error || 'Failed to load dashboard');
      }
    } catch (err) {
      console.error('[OrganizerDashboard] Fetch error:', err);
      setError('Unable to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-liberation-gold-divine" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-4" />
        <p className="text-white/60 mb-4">{error}</p>
        <button
          onClick={fetchDashboard}
          className="px-4 py-2 bg-liberation-gold-divine/20 text-liberation-gold-divine rounded-lg"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!dashboard) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Organizer Dashboard</h1>
          <p className="text-white/60 mt-1">
            Welcome back, {dashboard.organizer?.display_name || 'Organizer'}
          </p>
        </div>
        <button
          onClick={() => onNavigate?.('create-event')}
          className="flex items-center gap-2 px-4 py-2 bg-liberation-gold-divine text-liberation-black-power font-medium rounded-lg hover:bg-liberation-gold-divine/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Event
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-2">
        {[
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'events', label: 'My Events', icon: Calendar },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-liberation-gold-divine/20 text-liberation-gold-divine'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Total Events"
              value={dashboard.stats.totalEvents}
              icon={Calendar}
              trend="+2 this month"
            />
            <StatCard
              label="Total Attendees"
              value={dashboard.stats.totalAttendees}
              icon={Users}
              trend={`${dashboard.stats.thisMonth.rsvps} this month`}
            />
            <StatCard
              label="Avg Rating"
              value={dashboard.stats.averageRating.toFixed(1)}
              icon={Award}
              suffix="★"
            />
            <StatCard
              label="Liberation Score"
              value={dashboard.stats.liberationScore}
              icon={TrendingUp}
              isLiberation
            />
          </div>

          {/* Upcoming Events */}
          <div className="bg-liberation-black-power/50 rounded-xl border border-liberation-gold-divine/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Upcoming Events</h2>
              <button
                onClick={() => setActiveTab('events')}
                className="text-liberation-gold-divine text-sm flex items-center gap-1"
              >
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {dashboard.upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {dashboard.upcomingEvents.map(event => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                    onClick={() => onNavigate?.('event', event.id)}
                  >
                    <div>
                      <h3 className="text-white font-medium">{event.name}</h3>
                      <p className="text-white/40 text-sm">
                        {new Date(event.date).toLocaleDateString('en-GB', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white">
                        {event.rsvp_count}
                        {event.capacity && <span className="text-white/40">/{event.capacity}</span>}
                      </p>
                      <p className="text-white/40 text-xs">RSVPs</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/40 text-center py-4">No upcoming events</p>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-liberation-black-power/50 rounded-xl border border-liberation-gold-divine/20 p-6">
            <h2 className="text-lg font-bold text-white mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {dashboard.recentActivity.map((activity, idx) => (
                <div key={idx} className="flex items-center gap-3 text-sm">
                  <ActivityIcon type={activity.type} />
                  <span className="text-white/80 flex-1">{activity.message}</span>
                  <span className="text-white/40">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && (
        <EventsList userId={userId} onNavigate={onNavigate} />
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <AnalyticsView userId={userId} />
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  suffix,
  isLiberation
}: {
  label: string;
  value: number | string;
  icon: any;
  trend?: string;
  suffix?: string;
  isLiberation?: boolean;
}) {
  return (
    <div className={`p-4 rounded-xl border ${
      isLiberation
        ? 'bg-green-500/10 border-green-500/20'
        : 'bg-liberation-black-power/50 border-liberation-gold-divine/20'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${isLiberation ? 'text-green-400' : 'text-liberation-gold-divine'}`} />
        <span className="text-white/60 text-sm">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${isLiberation ? 'text-green-400' : 'text-white'}`}>
        {value}{suffix}
      </p>
      {trend && (
        <p className="text-white/40 text-xs mt-1">{trend}</p>
      )}
    </div>
  );
}

// Activity Icon Component
function ActivityIcon({ type }: { type: string }) {
  const icons: Record<string, { icon: any; color: string }> = {
    rsvp: { icon: Users, color: 'text-blue-400' },
    check_in: { icon: CheckCircle2, color: 'text-green-400' },
    review: { icon: Award, color: 'text-yellow-400' }
  };

  const { icon: Icon, color } = icons[type] || { icon: Clock, color: 'text-white/40' };

  return <Icon className={`w-4 h-4 ${color}`} />;
}

// Events List Sub-component
function EventsList({ userId, onNavigate }: { userId: string; onNavigate?: (section: string, id?: string) => void }) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${IVOR_API}/api/organizer/events/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setEvents(data.events);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-liberation-gold-divine" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.filter(event => event && event.id).map(event => (
        <div
          key={event.id}
          className="bg-liberation-black-power/50 rounded-xl border border-liberation-gold-divine/20 p-4 hover:border-liberation-gold-divine/40 transition-colors cursor-pointer"
          onClick={() => onNavigate?.('event', event.id)}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-medium">{event.name}</h3>
              <p className="text-white/40 text-sm mt-1">{event.location}</p>
            </div>
            <div className="text-right">
              <span className={`px-2 py-1 rounded text-xs ${
                event.status === 'published' ? 'bg-green-500/20 text-green-400' :
                event.status === 'completed' ? 'bg-white/10 text-white/40' :
                'bg-yellow-500/20 text-yellow-400'
              }`}>
                {event.status}
              </span>
              <p className="text-white/60 text-sm mt-2">
                {event.rsvp_count} RSVPs • {event.check_in_count} checked in
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Analytics View Sub-component
function AnalyticsView({ userId }: { userId: string }) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    fetch(`${IVOR_API}/api/organizer/analytics/${userId}?period=${period}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setAnalytics(data.analytics);
      })
      .finally(() => setLoading(false));
  }, [userId, period]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-liberation-gold-divine" />
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex gap-2">
        {['7d', '30d', '90d'].map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1 rounded-lg text-sm ${
              period === p
                ? 'bg-liberation-gold-divine text-liberation-black-power'
                : 'bg-white/10 text-white/60'
            }`}
          >
            {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
          </button>
        ))}
      </div>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-liberation-black-power/50 rounded-xl border border-liberation-gold-divine/20 p-4 text-center">
          <p className="text-3xl font-bold text-white">{analytics.totals.views}</p>
          <p className="text-white/60 text-sm">Views</p>
        </div>
        <div className="bg-liberation-black-power/50 rounded-xl border border-liberation-gold-divine/20 p-4 text-center">
          <p className="text-3xl font-bold text-white">{analytics.totals.rsvps}</p>
          <p className="text-white/60 text-sm">RSVPs</p>
        </div>
        <div className="bg-liberation-black-power/50 rounded-xl border border-liberation-gold-divine/20 p-4 text-center">
          <p className="text-3xl font-bold text-white">{analytics.totals.checkIns}</p>
          <p className="text-white/60 text-sm">Check-ins</p>
        </div>
      </div>

      {/* Liberation Impact */}
      <div className="bg-green-500/10 rounded-xl border border-green-500/20 p-6">
        <h3 className="text-green-400 font-bold mb-4">🏴‍☠️ Liberation Impact</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-2xl font-bold text-white">{analytics.liberationImpact.score}</p>
            <p className="text-white/60 text-sm">Score</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{analytics.liberationImpact.metrics.communityReach}</p>
            <p className="text-white/60 text-sm">Community Reach</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{Math.round(analytics.liberationImpact.metrics.engagementRate * 100)}%</p>
            <p className="text-white/60 text-sm">Engagement Rate</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{Math.round(analytics.liberationImpact.metrics.returnAttendees * 100)}%</p>
            <p className="text-white/60 text-sm">Return Attendees</p>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-liberation-black-power/50 rounded-xl border border-liberation-gold-divine/20 p-6">
        <h3 className="text-white font-bold mb-4">Insights</h3>
        <div className="space-y-3">
          {analytics.insights.map((insight: any, idx: number) => (
            <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg ${
              insight.type === 'success' ? 'bg-green-500/10' :
              insight.type === 'tip' ? 'bg-blue-500/10' :
              'bg-yellow-500/10'
            }`}>
              <span className="text-lg">
                {insight.type === 'success' ? '✅' : insight.type === 'tip' ? '💡' : '📈'}
              </span>
              <p className="text-white/80">{insight.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default OrganizerDashboard;
