import React, { useState } from 'react';
import { Calendar, RefreshCw, CheckCircle, AlertCircle, Upload, ExternalLink } from 'lucide-react';
import { Event } from '../types';
import { googleCalendarService } from '../services/googleCalendarService';

interface CalendarSyncDashboardProps {
  events: Event[];
  onClose: () => void;
}

export const CalendarSyncDashboard: React.FC<CalendarSyncDashboardProps> = ({ events, onClose }) => {
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncResults, setSyncResults] = useState<{ success: number; failed: number } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(googleCalendarService.isAuthenticated());

  const handleAuthenticate = async () => {
    try {
      const authenticated = await googleCalendarService.authenticateForSync();
      setIsAuthenticated(authenticated);

      if (authenticated) {
        alert('✅ Successfully connected to Google Calendar! You can now sync events.');
      }
    } catch (error) {
      console.error('Authentication failed:', error);
      alert('❌ Authentication failed. Please try again.');
    }
  };

  const handleSyncAll = async () => {
    if (!isAuthenticated) {
      alert('Please authenticate with Google Calendar first.');
      return;
    }

    setSyncing(true);
    setSyncStatus('syncing');

    try {
      const publishedEvents = events.filter(e => e.status === 'published');
      const results = await googleCalendarService.syncEventsToCalendar(publishedEvents);

      setSyncResults(results);
      setSyncStatus('success');

      alert(`✅ Sync completed!\n${results.success} events synced successfully\n${results.failed} failed`);
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus('error');
      alert('❌ Sync failed. Please check the console for details.');
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncSelected = async (event: Event) => {
    if (!isAuthenticated) {
      alert('Please authenticate with Google Calendar first.');
      return;
    }

    try {
      await googleCalendarService.syncEventToCalendar(event);
      alert(`✅ "${event.name || event.title}" synced to Google Calendar!`);
    } catch (error) {
      console.error('Sync failed:', error);
      alert(`❌ Failed to sync event. Please try again.`);
    }
  };

  const publishedEvents = events.filter(e => e.status === 'published');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-yellow-500/30">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-600 to-amber-500 p-6 flex items-center justify-between">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-gray-900 mr-3" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Google Calendar Sync</h2>
              <p className="text-sm text-gray-800">Sync events to public BLKOUT calendar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-900 hover:text-gray-700 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Authentication Status */}
          <div className={`mb-6 p-4 rounded-lg border ${isAuthenticated ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-yellow-500/20 border-yellow-500/30'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {isAuthenticated ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400 mr-3" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-400 mr-3" />
                )}
                <div>
                  <p className={`font-medium ${isAuthenticated ? 'text-emerald-300' : 'text-yellow-300'}`}>
                    {isAuthenticated ? 'Connected to Google Calendar' : 'Not Connected'}
                  </p>
                  <p className="text-sm text-gray-300">
                    {isAuthenticated
                      ? 'You can sync events to the public calendar'
                      : 'Click "Connect" to authenticate with Google Calendar'}
                  </p>
                </div>
              </div>
              {!isAuthenticated && (
                <button
                  onClick={handleAuthenticate}
                  className="px-4 py-2 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-400 transition-colors duration-200 font-medium"
                >
                  Connect
                </button>
              )}
            </div>
          </div>

          {/* Sync Controls */}
          <div className="mb-6 p-4 bg-gray-700 rounded-lg border border-gray-600">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-yellow-500">Bulk Sync</h3>
                <p className="text-sm text-gray-300">Sync all published events to Google Calendar</p>
              </div>
              <button
                onClick={handleSyncAll}
                disabled={!isAuthenticated || syncing}
                className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
                  isAuthenticated && !syncing
                    ? 'bg-yellow-500 text-gray-900 hover:bg-yellow-400'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                {syncing ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 mr-2" />
                    Sync All ({publishedEvents.length})
                  </>
                )}
              </button>
            </div>

            {syncResults && (
              <div className="mt-4 p-3 bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-300">
                  ✅ <span className="text-emerald-400 font-medium">{syncResults.success}</span> synced successfully
                  {syncResults.failed > 0 && (
                    <> • ❌ <span className="text-red-400 font-medium">{syncResults.failed}</span> failed</>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Events List */}
          <div>
            <h3 className="text-lg font-bold text-yellow-500 mb-4">Published Events</h3>
            <div className="space-y-3">
              {publishedEvents.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No published events to sync</p>
              ) : (
                publishedEvents.map((event) => (
                  <div
                    key={event.id}
                    className="p-4 bg-gray-700 rounded-lg border border-gray-600 hover:border-yellow-500/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-200">{event.name || event.title}</h4>
                        <p className="text-sm text-gray-400">
                          {new Date(event.event_date || event.start_date).toLocaleDateString()} • {event.organizer_name}
                        </p>
                      </div>
                      <button
                        onClick={() => handleSyncSelected(event)}
                        disabled={!isAuthenticated}
                        className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                          isAuthenticated
                            ? 'bg-yellow-500 text-gray-900 hover:bg-yellow-400'
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <Upload className="w-4 h-4 mr-1" />
                        Sync
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-gray-700 rounded-lg border border-gray-600">
            <h3 className="text-sm font-bold text-yellow-500 mb-2">How it works:</h3>
            <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
              <li>Click "Connect" to authenticate with your Google account</li>
              <li>Grant calendar access permissions</li>
              <li>Sync individual events or all published events at once</li>
              <li>Events will appear on the public BLKOUT calendar</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
