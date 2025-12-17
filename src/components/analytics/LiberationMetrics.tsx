/**
 * Liberation Metrics Component
 * Track and visualize community liberation impact
 *
 * Liberation Feature: Centering our values in data visibility
 */

import { useState, useEffect } from 'react';
import {
  Heart, Users, Shield, Accessibility, BookOpen,
  HandHeart, Sparkles, Target, TrendingUp, Award,
  Loader2
} from 'lucide-react';
import { MetricsChart, DonutChart } from './MetricsChart';

const IVOR_API = import.meta.env.VITE_IVOR_API_URL || 'https://ivor.blkoutuk.cloud';

interface LiberationMetricsProps {
  period: string;
}

interface LiberationData {
  current: {
    overallScore: number;
    communityConnections: number;
    safeSpacesCreated: number;
    blackQueerEvents: number;
    accessibilityScore: number;
    inclusionIndex: number;
  };
  breakdown: {
    [key: string]: { count: number; score: number };
  };
  trends: {
    liberationScore: { date: string; value: string }[];
    connections: { date: string; value: number }[];
    safeSpaces: { date: string; value: number }[];
  };
  impact: {
    livesImpacted: number;
    communitiesServed: number;
    partnerOrganizations: number;
    volunteerHours: number;
  };
}

interface ImpactData {
  summary: {
    totalImpactScore: number;
    trend: string;
    percentageChange: number;
  };
  pillars: {
    name: string;
    score: number;
    description: string;
    metrics: Record<string, number>;
  }[];
  recommendations: {
    priority: string;
    area: string;
    suggestion: string;
  }[];
}

export function LiberationMetrics({ period }: LiberationMetricsProps) {
  const [data, setData] = useState<LiberationData | null>(null);
  const [impactData, setImpactData] = useState<ImpactData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'overview' | 'impact' | 'breakdown'>('overview');

  useEffect(() => {
    Promise.all([
      fetch(`${IVOR_API}/api/analytics/liberation?period=${period}`).then(r => r.json()),
      fetch(`${IVOR_API}/api/analytics/liberation/impact`).then(r => r.json())
    ])
      .then(([liberationRes, impactRes]) => {
        if (liberationRes.success) setData(liberationRes.analytics);
        if (impactRes.success) setImpactData(impactRes.impact);
      })
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-green-400" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-green-500/20 to-liberation-gold-divine/20 rounded-xl border border-green-500/30 p-6">
        <div className="flex items-center gap-3 mb-3">
          <Heart className="w-8 h-8 text-green-400" />
          <div>
            <h2 className="text-xl font-bold text-white">Liberation Impact Dashboard</h2>
            <p className="text-white/60">Measuring what matters: community empowerment for Black queer lives</p>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex gap-2 mt-4">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'impact', label: 'Impact Pillars' },
            { id: 'breakdown', label: 'Breakdown' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as any)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                activeView === tab.id
                  ? 'bg-green-500/30 text-green-400'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview View */}
      {activeView === 'overview' && (
        <>
          {/* Core Score */}
          <div className="bg-green-500/10 rounded-xl border border-green-500/20 p-6 text-center">
            <p className="text-white/60 mb-2">Overall Liberation Score</p>
            <div className="flex items-center justify-center gap-4">
              <span className="text-6xl font-bold text-green-400">{data.current.overallScore}</span>
              <span className="text-2xl text-green-400">/100</span>
            </div>
            <p className="text-white/60 mt-2">
              +5.2% from last period
            </p>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <MetricCard
              icon={Users}
              label="Community Connections"
              value={data.current.communityConnections.toLocaleString()}
              description="People connected through our events"
              color="text-blue-400"
            />
            <MetricCard
              icon={Shield}
              label="Safe Spaces Created"
              value={data.current.safeSpacesCreated.toString()}
              description="Events with safe space policies"
              color="text-purple-400"
            />
            <MetricCard
              icon={Sparkles}
              label="Black Queer Events"
              value={data.current.blackQueerEvents.toString()}
              description="Events centering our community"
              color="text-pink-400"
            />
            <MetricCard
              icon={Accessibility}
              label="Accessibility Score"
              value={`${data.current.accessibilityScore}%`}
              description="Events with accessibility features"
              color="text-yellow-400"
            />
            <MetricCard
              icon={Heart}
              label="Inclusion Index"
              value={`${data.current.inclusionIndex}%`}
              description="Measuring belonging & welcome"
              color="text-red-400"
            />
            <MetricCard
              icon={Award}
              label="Lives Impacted"
              value={data.impact.livesImpacted.toLocaleString()}
              description="Community members reached"
              color="text-green-400"
            />
          </div>

          {/* Trends */}
          <div className="grid md:grid-cols-2 gap-6">
            <MetricsChart
              title="Liberation Score Trend"
              data={data.trends.liberationScore}
              color="#4CAF50"
            />
            <MetricsChart
              title="Community Connections"
              data={data.trends.connections}
              color="#2196F3"
            />
          </div>
        </>
      )}

      {/* Impact Pillars View */}
      {activeView === 'impact' && impactData && (
        <>
          {/* Pillars Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {impactData.pillars.map((pillar, idx) => (
              <div
                key={idx}
                className="bg-liberation-black-power/50 rounded-xl border border-liberation-gold-divine/20 p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-white font-bold">{pillar.name}</h4>
                  <span className={`text-2xl font-bold ${
                    pillar.score >= 90 ? 'text-green-400' :
                    pillar.score >= 80 ? 'text-yellow-400' :
                    'text-orange-400'
                  }`}>
                    {pillar.score}
                  </span>
                </div>
                <p className="text-white/60 text-sm mb-4">{pillar.description}</p>

                {/* Progress bar */}
                <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-4">
                  <div
                    className={`h-full rounded-full ${
                      pillar.score >= 90 ? 'bg-green-400' :
                      pillar.score >= 80 ? 'bg-yellow-400' :
                      'bg-orange-400'
                    }`}
                    style={{ width: `${pillar.score}%` }}
                  />
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(pillar.metrics).slice(0, 4).map(([key, value]) => (
                    <div key={key} className="bg-white/5 rounded p-2">
                      <p className="text-white/40 text-xs truncate">{formatMetricKey(key)}</p>
                      <p className="text-white font-medium">{value.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Recommendations */}
          <div className="bg-liberation-black-power/50 rounded-xl border border-liberation-gold-divine/20 p-6">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-liberation-gold-divine" />
              Growth Recommendations
            </h3>
            <div className="space-y-3">
              {impactData.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    rec.priority === 'high' ? 'bg-red-500/10' :
                    rec.priority === 'medium' ? 'bg-yellow-500/10' :
                    'bg-green-500/10'
                  }`}
                >
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    rec.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                    rec.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {rec.priority}
                  </span>
                  <div>
                    <p className="text-white font-medium">{rec.area}</p>
                    <p className="text-white/60 text-sm">{rec.suggestion}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Breakdown View */}
      {activeView === 'breakdown' && (
        <>
          {/* Category Breakdown */}
          <div className="grid md:grid-cols-2 gap-6">
            <DonutChart
              title="Events by Liberation Category"
              data={[
                { label: 'Mutual Aid', value: data.breakdown.mutualAid?.count || 18, color: '#4CAF50' },
                { label: 'Educational', value: data.breakdown.educational?.count || 22, color: '#2196F3' },
                { label: 'Wellness', value: data.breakdown.wellness?.count || 28, color: '#9C27B0' },
                { label: 'Cultural', value: data.breakdown.cultural?.count || 35, color: '#FF9800' },
                { label: 'Advocacy', value: data.breakdown.advocacy?.count || 15, color: '#F44336' }
              ]}
            />

            <div className="bg-liberation-black-power/50 rounded-xl border border-liberation-gold-divine/20 p-6">
              <h3 className="text-white font-bold mb-4">Category Scores</h3>
              <div className="space-y-4">
                {Object.entries(data.breakdown).map(([key, value]) => (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white/80 capitalize">{key}</span>
                      <span className={`font-bold ${
                        value.score >= 90 ? 'text-green-400' :
                        value.score >= 80 ? 'text-yellow-400' :
                        'text-orange-400'
                      }`}>
                        {value.score}
                      </span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          value.score >= 90 ? 'bg-green-400' :
                          value.score >= 80 ? 'bg-yellow-400' :
                          'bg-orange-400'
                        }`}
                        style={{ width: `${value.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Impact Numbers */}
          <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-xl border border-green-500/20 p-6">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Community Impact Numbers
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ImpactStat
                icon={Users}
                value={data.impact.livesImpacted}
                label="Lives Impacted"
              />
              <ImpactStat
                icon={Heart}
                value={data.impact.communitiesServed}
                label="Communities Served"
              />
              <ImpactStat
                icon={HandHeart}
                value={data.impact.partnerOrganizations}
                label="Partner Orgs"
              />
              <ImpactStat
                icon={BookOpen}
                value={data.impact.volunteerHours}
                label="Volunteer Hours"
              />
            </div>
          </div>

          {/* Safe Spaces Trend */}
          <MetricsChart
            title="Safe Spaces Created Over Time"
            data={data.trends.safeSpaces}
            color="#9C27B0"
          />
        </>
      )}

      {/* Footer */}
      <div className="text-center text-white/40 text-sm py-4">
        <p>
          🏴‍☠️ These metrics reflect our commitment to Black queer liberation.
          Data empowers community decision-making.
        </p>
      </div>
    </div>
  );
}

// Helper Components
function MetricCard({
  icon: Icon,
  label,
  value,
  description,
  color
}: {
  icon: any;
  label: string;
  value: string;
  description: string;
  color: string;
}) {
  return (
    <div className="bg-liberation-black-power/50 rounded-xl border border-liberation-gold-divine/20 p-4">
      <Icon className={`w-6 h-6 ${color} mb-2`} />
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-white font-medium text-sm">{label}</p>
      <p className="text-white/40 text-xs mt-1">{description}</p>
    </div>
  );
}

function ImpactStat({
  icon: Icon,
  value,
  label
}: {
  icon: any;
  value: number;
  label: string;
}) {
  return (
    <div className="text-center p-4 bg-white/5 rounded-xl">
      <Icon className="w-8 h-8 mx-auto text-green-400 mb-2" />
      <p className="text-3xl font-bold text-white">{value.toLocaleString()}</p>
      <p className="text-white/60 text-sm">{label}</p>
    </div>
  );
}

// Helper function to format metric keys
function formatMetricKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

export default LiberationMetrics;
