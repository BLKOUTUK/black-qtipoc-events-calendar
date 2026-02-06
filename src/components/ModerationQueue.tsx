import React, { useState, useEffect } from 'react';
import { Event, ModerationStats } from '../types';
import { googleSheetsService } from '../services/googleSheetsService';
import { supabaseEventService } from '../services/supabaseEventService';
import { EventList } from './EventList';
import { ScrapingDashboard } from './ScrapingDashboard';
import { OrganizationMonitor } from './OrganizationMonitor';
import { FeaturedContentManager } from './FeaturedContentManager';
import { CheckCircle, XCircle, Clock, BarChart3, Target, ExternalLink, Users, X, Home, Download, Image, Trash2 } from 'lucide-react';
import { approveEventViaIvor, rejectEventViaIvor } from '../config/api';

interface ModerationQueueProps {
  onClose: () => void;
}

export const ModerationQueue: React.FC<ModerationQueueProps> = ({ onClose }) => {
  const [pendingEvents, setPendingEvents] = useState<Event[]>([]);
  const [approvedEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<ModerationStats>({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'queue' | 'approved' | 'discovery' | 'organizations' | 'featured'>('queue');
  const [dateFilter, setDateFilter] = useState<'all' | 'future' | 'past'>('future');
  const [dataSource, setDataSource] = useState<'ivor' | 'supabase' | 'loading'>('loading');

  // Get Google Sheet ID from environment
  const SHEET_ID = import.meta.env.VITE_GOOGLE_SHEET_ID;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setDataSource('loading');
    try {
      // Fetch pending events from local server-side API (uses service role key)
      const response = await fetch('/api/pending-events');
      const result = await response.json();

      console.log('[ModerationQueue] /api/pending-events response:', result.success, result.count);

      const pending: Event[] = (result.events || []).map((e: any) => ({
        id: e.id,
        title: e.title || 'Untitled',
        description: e.description || '',
        start_date: e.date || e.start_date || '',
        end_date: e.end_date || e.date || '',
        start_time: e.start_time || '',
        end_time: e.end_time || '',
        location: e.location || 'TBA',
        virtual_link: e.virtual_link || '',
        organizer: e.organizer || 'Unknown',
        organizer_name: e.organizer || 'Unknown',
        organizer_id: '',
        tags: Array.isArray(e.tags) ? e.tags : [],
        category: e.category || 'community',
        event_type: e.event_type || 'meetup',
        status: e.status || 'pending',
        registration_link: e.registration_link || e.url || '',
        registration_required: false,
        cost: e.cost || 'Free',
        source: e.source || 'unknown',
        created_at: e.created_at || new Date().toISOString(),
        updated_at: e.updated_at || new Date().toISOString(),
      }));

      setDataSource(result.source === 'supabase-direct' ? 'supabase' : 'ivor');
      setPendingEvents(pending);
      setStats({
        pending: pending.length,
        approved: 0,
        rejected: 0,
        total: pending.length
      });

      console.log(`[ModerationQueue] Loaded ${pending.length} pending events`);
    } catch (error) {
      console.error('[ModerationQueue] Error loading data:', error);
      setDataSource('supabase');
      setPendingEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      console.log('🏴‍☠️ Approving event:', id);

      // Try IVOR Core API first
      const apiResult = await approveEventViaIvor(id);

      if (!apiResult.success) {
        // IVOR failed — fall back to direct Supabase update
        console.warn('IVOR approve failed, using Supabase directly');
        await supabaseEventService.updateEventStatus(id, 'published');
      }

      // Also try Google Sheets in case it's from there
      await googleSheetsService.updateEventStatus(id, 'published').catch(() => {});

      console.log('✅ Event approved');
      await new Promise(resolve => setTimeout(resolve, 500));
      await loadData();
    } catch (error) {
      console.error('Error approving event:', error);
      alert('Failed to approve event. Please try again.');
    }
  };

  const handleReject = async (id: string) => {
    try {
      console.log('🏴‍☠️ Rejecting event:', id);

      // Try IVOR Core API first
      const apiResult = await rejectEventViaIvor(id, 'Does not meet community guidelines');

      if (!apiResult.success) {
        // IVOR failed — fall back to direct Supabase update
        console.warn('IVOR reject failed, using Supabase directly');
        await supabaseEventService.updateEventStatus(id, 'archived'); // Maps to 'rejected' in DB
      }

      // Also try Google Sheets in case it's from there
      await googleSheetsService.updateEventStatus(id, 'archived').catch(() => {});

      console.log('❌ Event rejected');
      await new Promise(resolve => setTimeout(resolve, 500));
      await loadData();
    } catch (error) {
      console.error('Error rejecting event:', error);
      alert('Failed to reject event. Please try again.');
    }
  };

  const handleEdit = async (id: string, edits: Partial<Event>) => {
    try {
      console.log('🔍 Editing event via Supabase:', id, edits);

      // Use Supabase event service for edits (direct database update)
      const result = await supabaseEventService.updateEvent(id, edits);

      if (!result) {
        console.error('Failed to update event');
        alert('Failed to update event');
        return;
      }

      alert('Event updated successfully');

      // Reload data
      await new Promise(resolve => setTimeout(resolve, 500));
      await loadData();
    } catch (error) {
      console.error('Error editing event:', error);
      alert('Failed to update event. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      console.log('🗑️ Deleting event via Supabase:', id);

      // Use supabaseApiService for delete (IVOR Core API)
      const { supabaseApiService } = await import('../services/supabaseApiService');
      const result = await supabaseApiService.deleteEvent(id);

      if (!result) {
        console.error('Failed to delete event');
        alert('Failed to delete event');
        return;
      }

      alert('Event permanently deleted');

      // Wait a moment for database to update
      await new Promise(resolve => setTimeout(resolve, 500));
      await loadData();
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event. Please try again.');
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject') => {
    try {
      const sheetsStatus = action === 'approve' ? 'published' : 'archived';
      const apiAction = action === 'approve' ? approveEventViaIvor : rejectEventViaIvor;

      // Use server-side API for Supabase (bypasses RLS), Google Sheets as secondary
      await Promise.all(
        pendingEvents.map(event =>
          Promise.allSettled([
            googleSheetsService.updateEventStatus(event.id, sheetsStatus),
            apiAction(event.id)
          ])
        )
      );

      // Wait a moment for database to update
      await new Promise(resolve => setTimeout(resolve, 1000));
      await loadData();
    } catch (error) {
      console.error(`Error ${action}ing events:`, error);
    }
  };

  const handleBulkRejectPast = async () => {
    if (!confirm(`Are you sure you want to reject all ${pastEventsCount} past events?`)) {
      return;
    }
    
    try {
      const pastEvents = pendingEvents.filter(e => new Date(e.start_date) <= new Date());
      
      await Promise.all(
        pastEvents.map(event =>
          rejectEventViaIvor(event.id, 'Past event - no longer relevant')
        )
      );

      // Wait for database updates
      await new Promise(resolve => setTimeout(resolve, 1000));
      await loadData();
    } catch (error) {
      console.error('Error bulk rejecting past events:', error);
      alert('Failed to reject past events. Please try again.');
    }
  };

  const handleBulkRejectIncomplete = async () => {
    const incompleteEvents = pendingEvents.filter(e => 
      !e.title || !e.start_date || !e.location || e.title.length < 5
    );
    
    if (incompleteEvents.length === 0) {
      alert('No incomplete events found.');
      return;
    }
    
    if (!confirm(`Are you sure you want to reject ${incompleteEvents.length} incomplete events?`)) {
      return;
    }
    
    try {
      await Promise.all(
        incompleteEvents.map(event =>
          rejectEventViaIvor(event.id, 'Incomplete event data')
        )
      );

      // Wait for database updates
      await new Promise(resolve => setTimeout(resolve, 1000));
      await loadData();
    } catch (error) {
      console.error('Error bulk rejecting incomplete events:', error);
      alert('Failed to reject incomplete events. Please try again.');
    }
  };

  const handleBulkApproveTrusted = async () => {
    const trustedFutureEvents = pendingEvents.filter(e => {
      const isFuture = new Date(e.start_date) > new Date();
      const isComplete = e.title && e.start_date && e.location && e.title.length >= 5;
      return isFuture && isComplete;
    });
    
    if (trustedFutureEvents.length === 0) {
      alert('No trusted future events found.');
      return;
    }
    
    if (!confirm(`Are you sure you want to approve ${trustedFutureEvents.length} trusted future events?`)) {
      return;
    }
    
    try {
      await Promise.all(
        trustedFutureEvents.map(event =>
          approveEventViaIvor(event.id)
        )
      );

      // Wait for database updates
      await new Promise(resolve => setTimeout(resolve, 1000));
      await loadData();
    } catch (error) {
      console.error('Error bulk approving trusted events:', error);
      alert('Failed to approve trusted events. Please try again.');
    }
  };

  const openGoogleSheet = (sheetName?: string) => {
    if (!SHEET_ID) {
      alert('Google Sheet ID not configured. Please set VITE_GOOGLE_SHEET_ID in your environment variables.');
      return;
    }
    
    let url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`;
    if (sheetName) {
      url += `#gid=0`; // You'd need to map sheet names to GIDs
    }
    window.open(url, '_blank');
  };

  // Filter events based on date filter
  const filteredEvents = pendingEvents.filter(event => {
    if (dateFilter === 'future') {
      return new Date(event.start_date) > new Date();
    }
    if (dateFilter === 'past') {
      return new Date(event.start_date) <= new Date();
    }
    return true; // 'all'
  });

  // Calculate counts for UI
  const futureEventsCount = pendingEvents.filter(e => new Date(e.start_date) > new Date()).length;
  const pastEventsCount = pendingEvents.filter(e => new Date(e.start_date) <= new Date()).length;
  const incompleteEventsCount = pendingEvents.filter(e => 
    !e.title || !e.start_date || !e.location || e.title.length < 5
  ).length;
  const trustedFutureEventsCount = pendingEvents.filter(e => {
    const isFuture = new Date(e.start_date) > new Date();
    const isComplete = e.title && e.start_date && e.location && e.title.length >= 5;
    return isFuture && isComplete;
  }).length;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
            <div className="flex items-center space-x-3">
              {SHEET_ID && (
                <button
                  onClick={() => openGoogleSheet()}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Google Sheet
                </button>
              )}
              <button
                onClick={onClose}
                className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                title="Back to Home"
              >
                <Home className="w-4 h-4 mr-1" />
                Home
              </button>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-2xl"
                aria-label="Close admin dashboard"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Data Source Status */}
          {dataSource === 'supabase' && (
            <div className="mb-4 bg-amber-50 border border-amber-300 rounded-lg p-3">
              <div className="flex items-center text-sm text-amber-800">
                <svg className="w-4 h-4 mr-2 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span>
                  <strong>AIvor API unavailable</strong> — loading events directly from Supabase database.
                  Approve/reject actions will update Supabase directly.
                </span>
              </div>
            </div>
          )}

          {/* Dual Integration Notice */}
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div className="flex-1">
                <h4 className="font-medium text-green-900">Dual Integration: Google Sheets + Supabase</h4>
                <p className="text-sm text-green-800 mt-1">
                  Events from both Google Sheets and Chrome extension submissions (Supabase) appear here.
                  All moderation actions update both systems in real-time.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => openGoogleSheet('Events')}
                    className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200 transition-colors"
                  >
                    📊 Events Sheet
                  </button>
                  <button
                    onClick={() => openGoogleSheet('ScrapingLogs')}
                    className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200 transition-colors"
                  >
                    📈 Scraping Logs
                  </button>
                  <button
                    onClick={() => openGoogleSheet('Contacts')}
                    className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200 transition-colors"
                  >
                    👥 Contacts
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Chrome Extension Download - v2.2.0 */}
          <div className="mb-6 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start">
              <Download className="w-5 h-5 text-orange-600 mr-2 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-orange-900">BLKOUT Moderator Tools Extension v2.2.0</h4>
                <p className="text-sm text-orange-800 mt-1">
                  <strong>🚀 NEW: Dual-platform support!</strong> Submit events AND news directly from any webpage. Auto-extracts content from Eventbrite, Meetup, Facebook Events, news sites, and more.
                  Features intelligent type detection, event-specific fields, and smart routing to the correct platform.
                </p>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="flex items-center text-xs text-green-800">
                    <svg className="w-4 h-4 text-green-600 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    Event-specific fields (date, location, capacity)
                  </div>
                  <div className="flex items-center text-xs text-green-800">
                    <svg className="w-4 h-4 text-green-600 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    Auto date/location extraction
                  </div>
                  <div className="flex items-center text-xs text-green-800">
                    <svg className="w-4 h-4 text-green-600 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    Smart content type detection
                  </div>
                  <div className="flex items-center text-xs text-green-800">
                    <svg className="w-4 h-4 text-green-600 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    Intelligent API routing
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 items-center">
                  <a
                    href="/extensions/blkout-events-curator-v1.2.2.zip"
                    download="blkout-events-curator-v1.2.2.zip"
                    className="flex items-center text-sm bg-orange-600 text-white px-3 py-2 rounded-lg hover:bg-orange-700 transition-colors font-medium"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Extension v1.2.2
                  </a>
                  <a
                    href="https://news.blkoutuk.cloud/admin"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-orange-700 hover:text-orange-900 underline flex items-center"
                  >
                    📰 News Admin Dashboard
                  </a>
                </div>
                <p className="text-xs text-orange-700 mt-2">
                  💡 After download: Extract the ZIP file → Chrome Extensions → Developer Mode → Load Unpacked → Select extracted folder
                </p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('queue')}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                activeTab === 'queue'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Clock className="w-4 h-4 mr-2" />
              Moderation Queue ({stats.pending})
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                activeTab === 'approved'
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approved Events ({stats.approved})
            </button>
            <button
              onClick={() => setActiveTab('discovery')}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                activeTab === 'discovery'
                  ? 'bg-white text-teal-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Target className="w-4 h-4 mr-2" />
              Event Discovery
            </button>
            <button
              onClick={() => setActiveTab('organizations')}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                activeTab === 'organizations'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="w-4 h-4 mr-2" />
              Organization Monitor
            </button>
            <button
              onClick={() => setActiveTab('featured')}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                activeTab === 'featured'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Image className="w-4 h-4 mr-2" />
              Featured Images
            </button>
          </div>

          {activeTab === 'queue' && (
            <>
              {/* Filter and Stats Bar */}
              <div className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <label className="text-sm font-medium text-gray-700">Filter Events:</label>
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value as 'all' | 'future' | 'past')}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="future">Future Events Only ({futureEventsCount})</option>
                      <option value="past">Past Events ({pastEventsCount})</option>
                      <option value="all">All Events ({pendingEvents.length})</option>
                    </select>
                  </div>

                  <div className="flex flex-wrap gap-3 text-sm">
                    <div className="flex items-center px-3 py-1 bg-white rounded-full border border-purple-200">
                      <span className="font-medium text-purple-700">Total:</span>
                      <span className="ml-2 font-bold text-purple-900">{pendingEvents.length}</span>
                    </div>
                    <div className="flex items-center px-3 py-1 bg-white rounded-full border border-green-200">
                      <span className="font-medium text-green-700">Future:</span>
                      <span className="ml-2 font-bold text-green-900">{futureEventsCount}</span>
                    </div>
                    <div className="flex items-center px-3 py-1 bg-white rounded-full border border-orange-200">
                      <span className="font-medium text-orange-700">Past:</span>
                      <span className="ml-2 font-bold text-orange-900">{pastEventsCount}</span>
                    </div>
                    <div className="flex items-center px-3 py-1 bg-white rounded-full border border-red-200">
                      <span className="font-medium text-red-700">Incomplete:</span>
                      <span className="ml-2 font-bold text-red-900">{incompleteEventsCount}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-center">
                    <Clock className="w-8 h-8 text-yellow-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Pending</p>
                      <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center">
                    <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Approved</p>
                      <p className="text-2xl font-bold text-green-900">{stats.approved}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="flex items-center">
                    <XCircle className="w-8 h-8 text-red-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Rejected</p>
                      <p className="text-2xl font-bold text-red-900">{stats.rejected}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center">
                    <BarChart3 className="w-8 h-8 text-blue-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Total</p>
                      <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bulk Actions */}
              {pendingEvents.length > 0 && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3">Bulk Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <button
                      onClick={handleBulkRejectPast}
                      disabled={pastEventsCount === 0}
                      className="flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Reject Past Events ({pastEventsCount})
                    </button>
                    <button
                      onClick={handleBulkRejectIncomplete}
                      disabled={incompleteEventsCount === 0}
                      className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject Incomplete ({incompleteEventsCount})
                    </button>
                    <button
                      onClick={handleBulkApproveTrusted}
                      disabled={trustedFutureEventsCount === 0}
                      className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Trusted Future ({trustedFutureEventsCount})
                    </button>
                    <button
                      onClick={() => handleBulkAction('approve')}
                      className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve All ({pendingEvents.length})
                    </button>
                    <button
                      onClick={() => handleBulkAction('reject')}
                      className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject All ({pendingEvents.length})
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 mt-3">
                    💡 Smart bulk actions: Reject past/incomplete events or approve complete future events. All actions update both Google Sheets and Supabase.
                  </p>
                </div>
              )}

              {/* Pending Events */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Pending Events ({filteredEvents.length})
                </h3>
                <EventList
                  events={filteredEvents}
                  loading={loading}
                  emptyMessage={`No ${dateFilter === 'future' ? 'future' : dateFilter === 'past' ? 'past' : ''} events pending moderation.`}
                  showActions={true}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onEdit={handleEdit}
                />
              </div>
            </>
          )}

          {activeTab === 'approved' && (
            <>
              {/* Approved Events Header */}
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-green-900">Approved Events</h4>
                    <p className="text-sm text-green-800 mt-1">
                      These events are currently published and visible to users. You can edit or permanently delete them.
                    </p>
                  </div>
                </div>
              </div>

              {/* Approved Events List */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Published Events ({approvedEvents.length})
                </h3>
                <EventList
                  events={approvedEvents}
                  loading={loading}
                  emptyMessage="No approved events found."
                  showDeleteOnly={true}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </div>
            </>
          )}

          {activeTab === 'discovery' && (
            <ScrapingDashboard />
          )}

          {activeTab === 'organizations' && (
            <OrganizationMonitor />
          )}

          {activeTab === 'featured' && (
            <FeaturedContentManager />
          )}
        </div>
      </div>
    </div>
  );
};