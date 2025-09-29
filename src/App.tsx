import React, { useState, useEffect } from 'react';
import { Plus, Settings, LogIn, LogOut, BarChart3, Globe, Rss, Users } from 'lucide-react';
import { Event, FilterOptions } from './types';
import { supabaseEventService } from './services/supabaseEventService';
import { googleSheetsService } from './services/googleSheetsService';
import { useArticles } from './hooks/useSupabase';
import { PaginatedEventList } from './components/PaginatedEventList';
import { EventForm } from './components/EventForm';
import { ModerationQueue } from './components/ModerationQueue';
import { FilterBar } from './components/FilterBar';
import { AuthModal } from './components/AuthModal';
import CommunityIntelligenceDashboard from './components/CommunityIntelligenceDashboard';
import Footer from './components/Footer';
import Header from './components/Header';

function App() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showModerationQueue, setShowModerationQueue] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showIntelligenceDashboard, setShowIntelligenceDashboard] = useState(false);
  const [isScrapingEvents, setIsScrapingEvents] = useState(false);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: 'all',
    source: 'all',
    location: '',
    searchTerm: ''
  });

  // Use the articles hook for newsroom functionality
  const { articles, loading: articlesLoading, error: articlesError } = useArticles({
    status: 'published',
    limit: 50
  });

  useEffect(() => {
    loadEvents();
    loadStats();
    checkUser();
  }, []);

  useEffect(() => {
    const filtered = supabaseEventService.filterEvents(events, filters);
    setFilteredEvents(filtered);
  }, [events, filters]);

  const checkUser = async () => {
    const currentUser = await googleSheetsService.getCurrentUser();
    setUser(currentUser);
  };

  const loadEvents = async () => {
    setLoading(true);
    try {
      // Load published events from Supabase
      const allEvents = await supabaseEventService.getPublishedEvents();
      setEvents(allEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const moderationStats = await supabaseEventService.getModerationStats();
      setStats(moderationStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleEventSubmit = async (event: Event) => {
    setShowEventForm(false);
    await loadEvents();
    if (user) await loadStats();
  };

  const handleScrapeEvents = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setIsScrapingEvents(true);
    try {
      await googleSheetsService.scrapeEvents();
      await loadEvents();
      await loadStats();
    } catch (error) {
      console.error('Error scraping events:', error);
    } finally {
      setIsScrapingEvents(false);
    }
  };

  const handleSignIn = async (email: string, password: string) => {
    try {
      const user = await googleSheetsService.signIn(email, password);
      setUser(user);
      setShowAuthModal(false);
      await loadStats();
    } catch (error) {
      throw error;
    }
  };

  const handleSignOut = async () => {
    await googleSheetsService.signOut();
    setUser(null);
    setStats({ pending: 0, approved: 0, rejected: 0, total: 0 });
  };

  const handleModerationClick = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setShowModerationQueue(true);
  };

  const handleIntelligenceClick = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setShowIntelligenceDashboard(true);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Navigation Header */}
      <Header />

      {/* Hero Section - Simplified */}
      <div className="relative h-96 bg-gradient-to-br from-purple-600 to-blue-600 mb-8">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h1 className="text-5xl font-bold mb-4">Liberation Events Calendar</h1>
            <p className="text-xl mb-2">Black Queer Community Sovereignty</p>
            <p className="text-lg">Discover spaces where Black queer voices lead revolutionary change</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Controls - Only show if authenticated */}
        {user && (
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="text-white">
                <h3 className="text-lg font-bold">Admin Controls</h3>
                <p className="text-sm text-gray-300">Manage liberation events and community content</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleModerationClick}
                  className="flex items-center px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Moderation
                  {stats.pending > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                      {stats.pending}
                    </span>
                  )}
                </button>
                <button
                  onClick={handleIntelligenceClick}
                  className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-400"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Intelligence
                </button>
                <button
                  onClick={handleSignOut}
                  className="flex items-center px-4 py-2 border border-gray-400 text-gray-300 rounded-lg hover:bg-gray-700"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Community Action Bar */}
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold mb-2">Build Liberation Together</h2>
              <p>Share community events and amplify revolutionary organizing</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowEventForm(true)}
                className="flex items-center px-6 py-3 bg-black text-yellow-500 rounded-lg hover:bg-gray-900"
              >
                <Plus className="w-5 h-5 mr-2" />
                Share Liberation Event
              </button>
              {!user && (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center px-4 py-3 border-2 border-black text-black rounded-lg hover:bg-black hover:text-yellow-500"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Admin Access
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <FilterBar
          filters={filters}
          onFilterChange={setFilters}
          onScrapeEvents={handleScrapeEvents}
          isScrapingEvents={isScrapingEvents}
          showScrapeButton={!!user}
        />

        {/* Stats */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-purple-600">{events.length}</p>
                <p className="text-sm text-gray-600">Liberation Events</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {new Set(events.map(e => e.organizer_name)).size}
                </p>
                <p className="text-sm text-gray-600">Liberation Organizations</p>
              </div>
            </div>
          </div>
        </div>

        {/* Events List */}
        <PaginatedEventList
          events={filteredEvents}
          loading={loading}
          emptyMessage="No liberation events found. Keep building the movement - check back for new revolutionary organizing opportunities."
          showActions={user?.user_role === 'admin'}
          onApprove={async (id) => {
            try {
              await supabaseEventService.updateEventStatus(id, 'approved');
              await loadEvents();
              await loadStats();
            } catch (error) {
              console.error('Error approving event:', error);
            }
          }}
          onReject={async (id) => {
            try {
              await supabaseEventService.updateEventStatus(id, 'rejected');
              await loadEvents();
              await loadStats();
            } catch (error) {
              console.error('Error rejecting event:', error);
            }
          }}
          itemsPerPage={9}
        />

      </main>

      {/* Footer */}
      <Footer />

      {/* Modals */}
      {showEventForm && (
        <EventForm
          onSubmit={handleEventSubmit}
          onCancel={() => setShowEventForm(false)}
        />
      )}

      {showModerationQueue && user && (
        <ModerationQueue
          onClose={() => setShowModerationQueue(false)}
        />
      )}

      {showIntelligenceDashboard && user && (
        <div className="fixed inset-0 z-50 bg-white">
          <div className="absolute top-4 right-4">
            <button
              onClick={() => setShowIntelligenceDashboard(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Close Dashboard
            </button>
          </div>
          <CommunityIntelligenceDashboard />
        </div>
      )}

      {showAuthModal && (
        <AuthModal
          onSignIn={handleSignIn}
          onClose={() => setShowAuthModal(false)}
        />
      )}

    </div>
  );
}

export default App;