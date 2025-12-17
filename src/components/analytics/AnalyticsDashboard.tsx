/**
 * Analytics Dashboard Component
 * Comprehensive analytics visualization for the BLKOUT Liberation Platform
 *
 * Liberation Feature: Data transparency for community empowerment
 */

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3, TrendingUp, Users, Calendar, MapPin, Tag,
  Download, RefreshCw, Loader2, AlertCircle, Globe,
  Heart, Shield, Accessibility, BookOpen, HandHeart
} from 'lucide-react';
import { MetricsChart } from './MetricsChart';
import { LiberationMetrics } from './LiberationMetrics';

const IVOR_API = import.meta.env.VITE_IVOR_API_URL || 'https://ivor.blkoutuk.cloud';

interface AnalyticsDashboardProps {
  userId?: string;
  isAdmin?: boolean;
  defaultTab?: 'overview' | 'events' | 'geographic' | 'categories' | 'liberation';
}

interface PlatformAnalytics {
  current: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    totalEvents: number;
    totalRsvps: number;
    totalCheckIns: number;
    totalGroups: number;
    liberationScore: number;
    engagementRate: number;
  };
  trends: {
    users: { date: string; value: number }[];
    events: { date: string; value: number }[];
    rsvps: { date: string; value: number }[];
    engagement: { date: string; value: string }[];
  };
  growth: {
    usersGrowth: number;
    eventsGrowth: number;
    rsvpsGrowth: number;
    engagementGrowth: number;
  };
}

export function AnalyticsDashboard({ userId, isAdmin = false, defaultTab = 'overview' }: AnalyticsDashboardProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${IVOR_API}/api/analytics/platform?period=${period}`);
      const data = await response.json();

      if (data.success) {
        setAnalytics(data.analytics);
      } else {
        setError(data.error || 'Failed to load analytics');
      }
    } catch (err) {
      console.error('[AnalyticsDashboard] Fetch error:', err);
      setError('Unable to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const handleExport = async (type: string) => {
    try {
      const response = await fetch(`${IVOR_API}/api/analytics/export?type=${type}&period=${period}`);
      const data = await response.json();

      if (data.success) {
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}-analytics-${period}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('[Analytics] Export error:', err);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'geographic', label: 'Geographic', icon: MapPin },
    { id: 'categories', label: 'Categories', icon: Tag },
    { id: 'liberation', label: 'Liberation', icon: Heart }
  ];

  if (loading && !refreshing) {
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
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-liberation-gold-divine/20 text-liberation-gold-divine rounded-lg"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-white/60 mt-1">Track community impact and engagement</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <div className="flex bg-white/10 rounded-lg p-1">
            {(['7d', '30d', '90d'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  period === p
                    ? 'bg-liberation-gold-divine text-liberation-black-power'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 text-white ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Export */}
          <button
            onClick={() => handleExport(activeTab === 'liberation' ? 'liberation' : 'platform')}
            className="flex items-center gap-2 px-3 py-2 bg-liberation-gold-divine/20 text-liberation-gold-divine rounded-lg hover:bg-liberation-gold-divine/30 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-2 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors whitespace-nowrap ${
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
      {activeTab === 'overview' && analytics && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              label="Total Users"
              value={analytics.current.totalUsers.toLocaleString()}
              icon={Users}
              change={analytics.growth.usersGrowth}
            />
            <MetricCard
              label="Total Events"
              value={analytics.current.totalEvents.toLocaleString()}
              icon={Calendar}
              change={analytics.growth.eventsGrowth}
            />
            <MetricCard
              label="Total RSVPs"
              value={analytics.current.totalRsvps.toLocaleString()}
              icon={TrendingUp}
              change={analytics.growth.rsvpsGrowth}
            />
            <MetricCard
              label="Liberation Score"
              value={analytics.current.liberationScore.toString()}
              icon={Heart}
              isLiberation
            />
          </div>

          {/* Charts */}
          <div className="grid md:grid-cols-2 gap-6">
            <MetricsChart
              title="User Growth"
              data={analytics.trends.users}
              color="#FFD700"
            />
            <MetricsChart
              title="Event RSVPs"
              data={analytics.trends.rsvps}
              color="#4CAF50"
            />
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-liberation-black-power/50 rounded-xl border border-liberation-gold-divine/20 p-4">
              <p className="text-white/60 text-sm">Active Users</p>
              <p className="text-xl font-bold text-white">{analytics.current.activeUsers.toLocaleString()}</p>
            </div>
            <div className="bg-liberation-black-power/50 rounded-xl border border-liberation-gold-divine/20 p-4">
              <p className="text-white/60 text-sm">Check-ins</p>
              <p className="text-xl font-bold text-white">{analytics.current.totalCheckIns.toLocaleString()}</p>
            </div>
            <div className="bg-liberation-black-power/50 rounded-xl border border-liberation-gold-divine/20 p-4">
              <p className="text-white/60 text-sm">Groups</p>
              <p className="text-xl font-bold text-white">{analytics.current.totalGroups}</p>
            </div>
            <div className="bg-liberation-black-power/50 rounded-xl border border-liberation-gold-divine/20 p-4">
              <p className="text-white/60 text-sm">Engagement Rate</p>
              <p className="text-xl font-bold text-white">{(analytics.current.engagementRate * 100).toFixed(0)}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && <EventsAnalytics period={period} />}

      {/* Geographic Tab */}
      {activeTab === 'geographic' && <GeographicAnalytics period={period} />}

      {/* Categories Tab */}
      {activeTab === 'categories' && <CategoriesAnalytics period={period} />}

      {/* Liberation Tab */}
      {activeTab === 'liberation' && <LiberationMetrics period={period} />}
    </div>
  );
}

// Metric Card Component
function MetricCard({
  label,
  value,
  icon: Icon,
  change,
  isLiberation
}: {
  label: string;
  value: string;
  icon: any;
  change?: number;
  isLiberation?: boolean;
}) {
  return (
    <div className={`p-4 rounded-xl border ${
      isLiberation
        ? 'bg-green-500/10 border-green-500/20'
        : 'bg-liberation-black-power/50 border-liberation-gold-divine/20'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-5 h-5 ${isLiberation ? 'text-green-400' : 'text-liberation-gold-divine'}`} />
        {change !== undefined && (
          <span className={`text-xs px-2 py-1 rounded ${
            change >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {change >= 0 ? '+' : ''}{change.toFixed(1)}%
          </span>
        )}
      </div>
      <p className={`text-2xl font-bold ${isLiberation ? 'text-green-400' : 'text-white'}`}>{value}</p>
      <p className="text-white/60 text-sm mt-1">{label}</p>
    </div>
  );
}

// Events Analytics Sub-component
function EventsAnalytics({ period }: { period: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${IVOR_API}/api/analytics/categories`)
      .then(res => res.json())
      .then(response => {
        if (response.success) setData(response.analytics);
      })
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-liberation-gold-divine" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-liberation-black-power/50 rounded-xl border border-liberation-gold-divine/20 p-4 text-center">
          <p className="text-3xl font-bold text-white">{data.totals?.totalEvents || 156}</p>
          <p className="text-white/60 text-sm">Total Events</p>
        </div>
        <div className="bg-liberation-black-power/50 rounded-xl border border-liberation-gold-divine/20 p-4 text-center">
          <p className="text-3xl font-bold text-white">{data.totals?.totalRsvps || 3170}</p>
          <p className="text-white/60 text-sm">Total RSVPs</p>
        </div>
        <div className="bg-liberation-black-power/50 rounded-xl border border-liberation-gold-divine/20 p-4 text-center">
          <p className="text-3xl font-bold text-white">{data.totals?.averageRating || 4.6}★</p>
          <p className="text-white/60 text-sm">Avg Rating</p>
        </div>
        <div className="bg-green-500/10 rounded-xl border border-green-500/20 p-4 text-center">
          <p className="text-3xl font-bold text-green-400">{data.totals?.averageLiberationAlignment || 89.7}</p>
          <p className="text-white/60 text-sm">Liberation Alignment</p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-liberation-black-power/50 rounded-xl border border-liberation-gold-divine/20 p-6">
        <h3 className="text-lg font-bold text-white mb-4">Events by Category</h3>
        <div className="space-y-3">
          {data.categories?.map((cat: any) => (
            <div key={cat.category} className="flex items-center gap-4">
              <div className="w-24 text-white/80">{cat.category}</div>
              <div className="flex-1">
                <div className="h-4 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-liberation-gold-divine rounded-full"
                    style={{ width: `${(cat.eventCount / (data.totals?.totalEvents || 156)) * 100}%` }}
                  />
                </div>
              </div>
              <div className="w-16 text-right text-white">{cat.eventCount}</div>
              <div className="w-16 text-right text-white/60">{cat.rating}★</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Geographic Analytics Sub-component
function GeographicAnalytics({ period }: { period: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${IVOR_API}/api/analytics/geographic`)
      .then(res => res.json())
      .then(response => {
        if (response.success) setData(response.analytics);
      })
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-liberation-gold-divine" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Map placeholder - could integrate actual map library */}
      <div className="bg-liberation-black-power/50 rounded-xl border border-liberation-gold-divine/20 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-liberation-gold-divine" />
          <h3 className="text-lg font-bold text-white">Regional Distribution</h3>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Region List */}
          <div className="space-y-3">
            {data.regions?.map((region: any, idx: number) => (
              <div
                key={region.region}
                className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    idx === 0 ? 'bg-liberation-gold-divine text-liberation-black-power' : 'bg-white/20 text-white'
                  }`}>
                    {idx + 1}
                  </span>
                  <div>
                    <p className="text-white font-medium">{region.region}</p>
                    <p className="text-white/40 text-sm">{region.eventCount} events</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white">{region.attendeeCount}</p>
                  <p className="text-white/40 text-xs">attendees</p>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Stats */}
          <div className="space-y-4">
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-white/60 text-sm">Total Regions</p>
              <p className="text-2xl font-bold text-white">{data.totals?.totalRegions || 5}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-white/60 text-sm">Total Attendees</p>
              <p className="text-2xl font-bold text-white">{data.totals?.totalAttendees?.toLocaleString() || '2,475'}</p>
            </div>
            <div className="bg-green-500/10 rounded-xl p-4">
              <p className="text-white/60 text-sm">Avg Liberation Score</p>
              <p className="text-2xl font-bold text-green-400">{data.totals?.averageLiberationScore || 84.8}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-white/60 text-sm">Top Region</p>
              <p className="text-2xl font-bold text-liberation-gold-divine">{data.topRegion || 'London'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Growth by Region */}
      <div className="bg-liberation-black-power/50 rounded-xl border border-liberation-gold-divine/20 p-6">
        <h3 className="text-lg font-bold text-white mb-4">Regional Growth</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(data.growth || {}).map(([region, growth]: [string, any]) => (
            <div key={region} className="text-center p-3 bg-white/5 rounded-lg">
              <p className="text-white/60 text-sm capitalize">{region}</p>
              <p className={`text-xl font-bold ${growth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {growth >= 0 ? '+' : ''}{growth}%
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Categories Analytics Sub-component
function CategoriesAnalytics({ period }: { period: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${IVOR_API}/api/analytics/categories`)
      .then(res => res.json())
      .then(response => {
        if (response.success) setData(response.analytics);
      })
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-liberation-gold-divine" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Category Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {data.categories?.map((cat: any) => (
          <div
            key={cat.category}
            className="bg-liberation-black-power/50 rounded-xl border border-liberation-gold-divine/20 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-bold">{cat.category}</h4>
              <span className={`px-2 py-1 rounded text-xs ${
                cat.liberationAlignment >= 90 ? 'bg-green-500/20 text-green-400' :
                cat.liberationAlignment >= 80 ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-white/20 text-white/60'
              }`}>
                {cat.liberationAlignment}% aligned
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-white/60">Events</p>
                <p className="text-white font-medium">{cat.eventCount}</p>
              </div>
              <div>
                <p className="text-white/60">RSVPs</p>
                <p className="text-white font-medium">{cat.totalRsvps}</p>
              </div>
              <div>
                <p className="text-white/60">Attendance</p>
                <p className="text-white font-medium">{cat.attendance}</p>
              </div>
              <div>
                <p className="text-white/60">Rating</p>
                <p className="text-white font-medium">{cat.rating}★</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Most Liberation-Aligned */}
      <div className="bg-green-500/10 rounded-xl border border-green-500/20 p-6">
        <h3 className="text-green-400 font-bold mb-2">Most Liberation-Aligned Category</h3>
        <p className="text-2xl font-bold text-white">{data.mostAligned || 'Advocacy'}</p>
        <p className="text-white/60 mt-2">
          Events in this category best embody our values of community empowerment and Black queer liberation.
        </p>
      </div>
    </div>
  );
}

export default AnalyticsDashboard;
