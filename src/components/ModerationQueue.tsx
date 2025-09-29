import React, { useState, useEffect } from 'react';
import { Event, ModerationStats } from '../types';
import { eventService } from '../services/eventService';
import { supabaseEventService } from '../services/supabaseEventService';
import { googleSheetsService } from '../services/googleSheetsService';
import { EventList } from './EventList';
import { ScrapingDashboard } from './ScrapingDashboard';
import { OrganizationMonitor } from './OrganizationMonitor';
import { CheckCircle, XCircle, Clock, BarChart3, Target, ExternalLink, Users, Calendar, X, Home } from 'lucide-react';

interface ModerationQueueProps {
  onClose: () => void;
}

export const ModerationQueue: React.FC<ModerationQueueProps> = ({ onClose }) => {
  const [pendingEvents, setPendingEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<ModerationStats>({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'queue' | 'discovery' | 'organizations'>('queue');

  // Get Google Sheet ID from environment
  const SHEET_ID = import.meta.env.VITE_GOOGLE_SHEET_ID;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load events from Supabase (primary)
      const [events, moderationStats] = await Promise.all([
        supabaseEventService.getPendingEvents(),
        supabaseEventService.getModerationStats()
      ]);
      setPendingEvents(events);
      setStats(moderationStats);
      console.log('📊 Moderation data loaded from Supabase:', events.length, 'pending events');
    } catch (error) {
      console.error('Error loading moderation data from Supabase:', error);

      // Fallback to eventService
      try {
        console.log('⚠️ Falling back to eventService for moderation data...');
        await eventService.scrapeEvents();
        const [events, moderationStats] = await Promise.all([
          Promise.resolve(eventService.getEventsForModeration()),
          Promise.resolve(eventService.getModerationStats())
        ]);
        setPendingEvents(events);
        setStats(moderationStats);
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      console.log('✅ PRIMARY: Approving event via Supabase:', id);

      // 1. Primary: Update status in Supabase database
      const success = await supabaseEventService.updateEventStatus(id, 'published');

      if (!success) {
        throw new Error('Failed to approve event in Supabase database');
      }

      console.log('✅ PRIMARY: Event approved in Supabase database');

      // 2. Secondary: Also update Google Sheets for transparency and N8N bridge
      try {
        console.log('📊 BACKUP: Updating Google Sheets for transparency...');
        await googleSheetsService.updateEventStatus(id, 'published');
        console.log('✅ BACKUP: Google Sheets updated successfully');
      } catch (sheetsError) {
        console.warn('⚠️ BACKUP: Google Sheets update failed (non-critical):', sheetsError);
      }

      // 3. Reload the moderation queue
      loadData();
    } catch (error) {
      console.error('❌ Error approving event:', error);
      alert('Failed to approve event: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Please provide a reason for rejection (required for transparency):');
    if (!reason || reason.trim().length === 0) {
      alert('Rejection reason is required for community transparency');
      return;
    }

    try {
      console.log('❌ PRIMARY: Rejecting event via Supabase:', id, 'Reason:', reason);

      // 1. Primary: Update status in Supabase database
      const success = await supabaseEventService.updateEventStatus(id, 'archived');

      if (!success) {
        throw new Error('Failed to reject event in Supabase database');
      }

      console.log('✅ PRIMARY: Event rejected in Supabase database');

      // 2. Secondary: Also update Google Sheets for transparency and N8N bridge
      try {
        console.log('📊 BACKUP: Updating Google Sheets for transparency...');
        await googleSheetsService.updateEventStatus(id, 'archived');
        console.log('✅ BACKUP: Google Sheets updated successfully');
      } catch (sheetsError) {
        console.warn('⚠️ BACKUP: Google Sheets update failed (non-critical):', sheetsError);
      }

      // 3. Reload the moderation queue
      loadData();
    } catch (error) {
      console.error('❌ Error rejecting event:', error);
      alert('Failed to reject event: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject') => {
    try {
      const status = action === 'approve' ? 'published' : 'archived';
      console.log(`🔄 BULK ${action.toUpperCase()}: Processing ${pendingEvents.length} events`);

      // Primary: Update all events in Supabase
      const supabaseResults = await Promise.allSettled(
        pendingEvents.map(event =>
          supabaseEventService.updateEventStatus(event.id, status)
        )
      );

      const supabaseSuccesses = supabaseResults.filter(r => r.status === 'fulfilled').length;
      console.log(`✅ PRIMARY: ${supabaseSuccesses}/${pendingEvents.length} events ${action}ed in Supabase`);

      // Secondary: Update Google Sheets for transparency
      try {
        await Promise.all(
          pendingEvents.map(event =>
            googleSheetsService.updateEventStatus(event.id, status)
          )
        );
        console.log('✅ BACKUP: All events also updated in Google Sheets');
      } catch (sheetsError) {
        console.warn('⚠️ BACKUP: Some Google Sheets updates failed (non-critical):', sheetsError);
      }

      loadData();
    } catch (error) {
      console.error(`Error ${action}ing events:`, error);
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

          {/* Google Sheets Integration Notice */}
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div className="flex-1">
                <h4 className="font-medium text-green-900">Google Sheets Integration Active</h4>
                <p className="text-sm text-green-800 mt-1">
                  All moderation actions update the community Google Sheet in real-time. 
                  Changes are transparent and collaborative.
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
          </div>

          {activeTab === 'queue' && (
            <>
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
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleBulkAction('approve')}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve All ({pendingEvents.length})
                    </button>
                    <button
                      onClick={() => handleBulkAction('reject')}
                      className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject All ({pendingEvents.length})
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    💡 Bulk actions will update all rows in the Google Sheet simultaneously
                  </p>
                </div>
              )}

              {/* Pending Events */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Pending Events ({pendingEvents.length})
                </h3>
                <EventList
                  events={pendingEvents}
                  loading={loading}
                  emptyMessage="No events pending moderation."
                  showActions={true}
                  onApprove={handleApprove}
                  onReject={handleReject}
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
        </div>
      </div>
    </div>
  );
};