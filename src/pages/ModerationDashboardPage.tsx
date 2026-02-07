/**
 * Moderation Dashboard Page
 * Full-page unified moderation center for events and news
 *
 * Liberation Feature: Community safety and content governance
 * URL: /moderation
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, Newspaper, Calendar, Clock, CheckCircle, XCircle,
  AlertTriangle, TrendingUp, Users, Home, RefreshCw, Eye,
  ChevronRight, FileText, Flag, Loader2
} from 'lucide-react';
import { EventModerationPanel } from '../components/EventModerationPanel';

const IVOR_API = import.meta.env.VITE_IVOR_API_URL || 'https://ivor.blkoutuk.cloud';

interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  status: string;
  source_url: string;
  liberation_score: number | null;
  created_at: string;
}

interface EventReport {
  id: string;
  event_id: string;
  reason: string;
  description: string;
  status: string;
  created_at: string;
}

interface ModerationStats {
  events: {
    pending: number;
    approved: number;
    rejected: number;
    flagged: number;
  };
  news: {
    pending: number;
    published: number;
    rejected: number;
  };
  reports: {
    pending: number;
    reviewing: number;
    resolved: number;
  };
}

export function ModerationDashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'news' | 'events' | 'reports'>('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ModerationStats>({
    events: { pending: 0, approved: 0, rejected: 0, flagged: 0 },
    news: { pending: 0, published: 0, rejected: 0 },
    reports: { pending: 0, reviewing: 0, resolved: 0 }
  });
  const [pendingNews, setPendingNews] = useState<NewsArticle[]>([]);
  const [eventReports, setEventReports] = useState<EventReport[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [newsRes, eventModRes, reportsRes] = await Promise.all([
        fetch(`${IVOR_API}/api/news/pending`).then(r => r.json()).catch(() => ({ articles: [] })),
        fetch(`${IVOR_API}/api/event-moderation/dashboard`).then(r => r.json()).catch(() => ({ dashboard: { stats: {} } })),
        fetch(`${IVOR_API}/api/event-moderation/reports`).then(r => r.json()).catch(() => ({ reports: [], stats: {} }))
      ]);

      setPendingNews(newsRes.articles || []);
      setEventReports(reportsRes.reports || []);

      setStats({
        events: {
          pending: eventModRes.dashboard?.stats?.pendingReports || 0,
          approved: 0,
          rejected: 0,
          flagged: eventModRes.dashboard?.stats?.flaggedEvents || 0
        },
        news: {
          pending: newsRes.articles?.length || 0,
          published: 0,
          rejected: 0
        },
        reports: {
          pending: reportsRes.stats?.pending || 0,
          reviewing: reportsRes.stats?.reviewing || 0,
          resolved: reportsRes.stats?.resolved || 0
        }
      });
    } catch (error) {
      console.error('Error loading moderation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewsAction = async (articleId: string, action: 'approve' | 'reject') => {
    setActionLoading(articleId);
    try {
      const response = await fetch(`${IVOR_API}/api/news/${articleId}/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          moderatorId: 'admin',
          notes: action === 'approve' ? 'Approved via moderation dashboard' : 'Rejected via moderation dashboard'
        })
      });

      if (response.ok) {
        setPendingNews(prev => prev.filter(a => a.id !== articleId));
        setStats(prev => ({
          ...prev,
          news: {
            ...prev.news,
            pending: prev.news.pending - 1,
            published: action === 'approve' ? prev.news.published + 1 : prev.news.published
          }
        }));
      }
    } catch (error) {
      console.error(`Error ${action}ing article:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReportAction = async (reportId: string, status: 'resolved' | 'dismissed') => {
    setActionLoading(reportId);
    try {
      const response = await fetch(`${IVOR_API}/api/event-moderation/reports/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          moderatorId: 'admin',
          resolutionNotes: `Report ${status} via moderation dashboard`
        })
      });

      if (response.ok) {
        setEventReports(prev => prev.filter(r => r.id !== reportId));
      }
    } catch (error) {
      console.error(`Error updating report:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  const totalPending = stats.news.pending + stats.reports.pending + stats.events.flagged;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
              >
                <Home className="w-5 h-5" />
                <span className="hidden sm:inline">Back to Calendar</span>
              </Link>
              <div className="h-6 w-px bg-white/20" />
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-purple-400" />
                <h1 className="text-xl font-bold text-white">Moderation Dashboard</h1>
              </div>
            </div>
            <button
              onClick={loadAllData}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg text-white/80 hover:bg-white/20 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={AlertTriangle}
            label="Total Pending"
            value={totalPending}
            color="yellow"
            urgent={totalPending > 0}
          />
          <StatCard
            icon={Newspaper}
            label="News to Review"
            value={stats.news.pending}
            color="blue"
          />
          <StatCard
            icon={Flag}
            label="Event Reports"
            value={stats.reports.pending}
            color="red"
          />
          <StatCard
            icon={Calendar}
            label="Flagged Events"
            value={stats.events.flagged}
            color="orange"
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'news', label: `News (${stats.news.pending})`, icon: Newspaper },
            { id: 'events', label: 'Events', icon: Calendar },
            { id: 'reports', label: `Reports (${stats.reports.pending})`, icon: Flag }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Quick Actions */}
                <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-yellow-400" />
                    Requires Attention
                  </h2>

                  {totalPending === 0 ? (
                    <div className="text-center py-8 text-white/60">
                      <CheckCircle className="w-12 h-12 mx-auto text-green-400 mb-3" />
                      <p>All caught up! No items require moderation.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {stats.news.pending > 0 && (
                        <ActionItem
                          icon={Newspaper}
                          label={`${stats.news.pending} news articles pending review`}
                          onClick={() => setActiveTab('news')}
                          color="blue"
                        />
                      )}
                      {stats.reports.pending > 0 && (
                        <ActionItem
                          icon={Flag}
                          label={`${stats.reports.pending} event reports to review`}
                          onClick={() => setActiveTab('reports')}
                          color="red"
                        />
                      )}
                      {stats.events.flagged > 0 && (
                        <ActionItem
                          icon={AlertTriangle}
                          label={`${stats.events.flagged} flagged events need attention`}
                          onClick={() => setActiveTab('events')}
                          color="orange"
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Recent Activity Summary */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                    <h3 className="text-white font-bold mb-4">News Queue Preview</h3>
                    {pendingNews.slice(0, 3).map(article => (
                      <div key={article.id} className="flex items-center gap-3 py-2 border-b border-white/10 last:border-0">
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">
                          {article.category}
                        </span>
                        <span className="text-white/80 text-sm truncate flex-1">
                          {article.title}
                        </span>
                      </div>
                    ))}
                    {pendingNews.length > 3 && (
                      <button
                        onClick={() => setActiveTab('news')}
                        className="text-purple-400 text-sm mt-2 hover:text-purple-300"
                      >
                        View all {pendingNews.length} articles →
                      </button>
                    )}
                    {pendingNews.length === 0 && (
                      <p className="text-white/40 text-sm">No pending news articles</p>
                    )}
                  </div>

                  <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                    <h3 className="text-white font-bold mb-4">Guidelines</h3>
                    <div className="space-y-2 text-sm text-white/60">
                      <p>• All events must align with Black queer liberation values</p>
                      <p>• News must be relevant to UK LGBTQ+ communities</p>
                      <p>• No discrimination or harmful content</p>
                      <p>• Authentic representation required</p>
                      <p>• Transparency in event details</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* News Tab */}
            {activeTab === 'news' && (
              <div className="space-y-4">
                <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Newspaper className="w-5 h-5 text-blue-400" />
                    News Articles Pending Review ({pendingNews.length})
                  </h2>

                  {pendingNews.length === 0 ? (
                    <div className="text-center py-8 text-white/60">
                      <CheckCircle className="w-12 h-12 mx-auto text-green-400 mb-3" />
                      <p>No news articles pending review</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingNews.map(article => (
                        <NewsArticleCard
                          key={article.id}
                          article={article}
                          onApprove={() => handleNewsAction(article.id, 'approve')}
                          onReject={() => handleNewsAction(article.id, 'reject')}
                          loading={actionLoading === article.id}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Events Tab */}
            {activeTab === 'events' && (
              <div className="space-y-4">
                <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-green-400" />
                    Event Moderation - 253 Pending Events
                  </h2>

                  <EventModerationPanel onStatsUpdate={loadAllData} />
                </div>
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div className="space-y-4">
                <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Flag className="w-5 h-5 text-red-400" />
                    Event Reports ({eventReports.length})
                  </h2>

                  {eventReports.length === 0 ? (
                    <div className="text-center py-8 text-white/60">
                      <CheckCircle className="w-12 h-12 mx-auto text-green-400 mb-3" />
                      <p>No pending reports</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {eventReports.map(report => (
                        <ReportCard
                          key={report.id}
                          report={report}
                          onResolve={() => handleReportAction(report.id, 'resolved')}
                          onDismiss={() => handleReportAction(report.id, 'dismissed')}
                          loading={actionLoading === report.id}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-white/40 text-sm">
          <p>BLKOUT Moderation Dashboard • Protecting community spaces</p>
        </div>
      </footer>
    </div>
  );
}

// Helper Components
function StatCard({
  icon: Icon,
  label,
  value,
  color,
  urgent
}: {
  icon: any;
  label: string;
  value: number;
  color: string;
  urgent?: boolean;
}) {
  const colors: Record<string, string> = {
    yellow: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    red: 'bg-red-500/10 border-red-500/30 text-red-400',
    orange: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    green: 'bg-green-500/10 border-green-500/30 text-green-400'
  };

  return (
    <div className={`rounded-xl border p-4 ${colors[color]} ${urgent && value > 0 ? 'animate-pulse' : ''}`}>
      <Icon className="w-6 h-6 mb-2" />
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm opacity-80">{label}</p>
    </div>
  );
}

function ActionItem({
  icon: Icon,
  label,
  onClick,
  color
}: {
  icon: any;
  label: string;
  onClick: () => void;
  color: string;
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-300',
    red: 'bg-red-500/10 hover:bg-red-500/20 text-red-300',
    orange: 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-300'
  };

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${colors[color]}`}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5" />
        <span>{label}</span>
      </div>
      <ChevronRight className="w-5 h-5" />
    </button>
  );
}

function NewsArticleCard({
  article,
  onApprove,
  onReject,
  loading
}: {
  article: NewsArticle;
  onApprove: () => void;
  onReject: () => void;
  loading: boolean;
}) {
  return (
    <div className="bg-white/5 rounded-lg border border-white/10 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">
              {article.category}
            </span>
            <span className="text-white/40 text-xs">
              {new Date(article.created_at).toLocaleDateString()}
            </span>
          </div>
          <h3 className="text-white font-medium mb-1">{article.title}</h3>
          <p className="text-white/60 text-sm line-clamp-2">{article.excerpt}</p>
          {article.source_url && (
            <a
              href={article.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 text-sm hover:text-purple-300 mt-2 inline-flex items-center gap-1"
            >
              <Eye className="w-3 h-3" />
              View Source
            </a>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={onApprove}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-2 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Approve
          </button>
          <button
            onClick={onReject}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

function ReportCard({
  report,
  onResolve,
  onDismiss,
  loading
}: {
  report: EventReport;
  onResolve: () => void;
  onDismiss: () => void;
  loading: boolean;
}) {
  return (
    <div className="bg-white/5 rounded-lg border border-white/10 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded capitalize">
              {report.reason}
            </span>
            <span className="text-white/40 text-xs">
              {new Date(report.created_at).toLocaleDateString()}
            </span>
          </div>
          <p className="text-white/80 text-sm">Event ID: {report.event_id}</p>
          {report.description && (
            <p className="text-white/60 text-sm mt-1">{report.description}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={onResolve}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-2 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Resolve
          </button>
          <button
            onClick={onDismiss}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-2 bg-gray-500/20 text-gray-300 rounded-lg hover:bg-gray-500/30 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModerationDashboardPage;
