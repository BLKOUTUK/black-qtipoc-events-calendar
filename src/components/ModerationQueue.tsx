import React, { useState, useEffect } from 'react';
import { Event, ModerationStats } from '../types';
import { googleSheetsService } from '../services/googleSheetsService';
import { supabaseEventService } from '../services/supabaseEventService';
import { EventList } from './EventList';
import { ScrapingDashboard } from './ScrapingDashboard';
import { OrganizationMonitor } from './OrganizationMonitor';
import { FeaturedContentManager } from './FeaturedContentManager';
import { CheckCircle, XCircle, Clock, BarChart3, Target, ExternalLink, Users, Calendar, X, Home, Download, Image, Trash2 } from 'lucide-react';
import { approveEventViaIvor, rejectEventViaIvor, IVOR_API_URL } from '../config/api';

interface ModerationQueueProps {
  onClose: () => void;
}

export const ModerationQueue: React.FC<ModerationQueueProps> = ({ onClose }) => {
  const [pendingEvents, setPendingEvents] = useState<Event[]>([]);
  const [approvedEvents, setApprovedEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<ModerationStats>({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'queue' | 'approved' | 'discovery' | 'organizations' | 'featured'>('queue');

  // Get Google Sheet ID from environment
  const SHEET_ID = import.meta.env.VITE_GOOGLE_SHEET_ID;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load from both Google Sheets and Supabase
      const [sheetsEvents, supabaseEvents, sheetsStats] = await Promise.all([
        googleSheetsService.getPendingEvents(),
        supabaseEventService.getPendingEvents(),
        googleSheetsService.getModerationStats()
      ]);

      // Merge events from both sources
      const allEvents = [...sheetsEvents, ...supabaseEvents];

      // Get Supabase stats
      const supabaseStats = await supabaseEventService.getModerationStats();

      // Merge stats
      const mergedStats = {
        pending: sheetsStats.pending + supabaseStats.pending,
        approved: sheetsStats.approved + supabaseStats.approved,
        rejected: sheetsStats.rejected + supabaseStats.rejected,
        total: sheetsStats.total + supabaseStats.total
      };

      // Load approved events from Supabase
      const approved = await supabaseEventService.getApprovedEvents();
      setApprovedEvents(approved);

      setPendingEvents(allEvents);
      setStats(mergedStats);
    } catch (error) {
      console.error('Error loading moderation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      // Use IVOR Core API for approval (Liberation Layer 3)
      console.log('🏴‍☠️ Approving event via IVOR Core:', id);
      const apiResult = await approveEventViaIvor(id);

      // Also try Google Sheets in case it's from there
      await googleSheetsService.updateEventStatus(id, 'published').catch(err => {
        console.log('Not in Google Sheets:', err);
      });

      if (!apiResult.success) {
        console.error('Failed to approve event:', apiResult.message);
        alert(`Failed to approve event: ${apiResult.message}`);
        return;
      }

      console.log('✅ Event approved via IVOR Core');

      // Wait a moment for database to update
      await new Promise(resolve => setTimeout(resolve, 500));
      await loadData();
    } catch (error) {
      console.error('Error approving event:', error);
      alert('Failed to approve event. Please try again.');
    }
  };

  const handleReject = async (id: string) => {
    try {
      // Use IVOR Core API for rejection (Liberation Layer 3)
      console.log('🏴‍☠️ Rejecting event via IVOR Core:', id);
      const apiResult = await rejectEventViaIvor(id, 'Does not meet community guidelines');

      // Also try Google Sheets in case it's from there
      await googleSheetsService.updateEventStatus(id, 'archived').catch(err => {
        console.log('Not in Google Sheets:', err);
      });

      if (!apiResult.success) {
        console.error('Failed to reject event:', apiResult.message);
        alert(`Failed to reject event: ${apiResult.message}`);
        return;
      }

      console.log('❌ Event rejected via IVOR Core');

      // Wait a moment for database to update
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

      // Use Supabase event service for delete (direct database delete)
      const result = await supabaseEventService.deleteEvent(id);

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
      const supabaseStatus = action === 'approve' ? 'approved' : 'archived';

      // Try updating in both services for each event
      await Promise.all(
        pendingEvents.map(event =>
          Promise.allSettled([
            googleSheetsService.updateEventStatus(event.id, sheetsStatus),
            supabaseEventService.updateEventStatus(event.id, supabaseStatus)
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
                    href="https://news-blkout.vercel.app/blkout-moderator-tools-v2.2.2-fixed.zip"
                    download="blkout-moderator-tools-v2.2.2-fixed.zip"
                    className="flex items-center text-sm bg-orange-600 text-white px-3 py-2 rounded-lg hover:bg-orange-700 transition-colors font-medium"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Extension v2.2.2
                  </a>
                  <a
                    href="https://news-blkout.vercel.app/admin"
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