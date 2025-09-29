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
    <div className="min-h-screen bg-liberation-black-power">
      {/* Navigation Header */}
      <Header />

      {/* Hero Section with Image */}
      <div className="relative overflow-hidden rounded-xl h-96 md:h-[32rem] mb-8 bg-gradient-to-br from-blkout-primary via-blkout-deep to-black">
        {/* Background Image */}
        <img
          src="/images/imagine.png"
          alt="Liberation Background"
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            // Hide image if it fails to load, keep gradient background
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />

        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-liberation-black-power bg-opacity-60"></div>

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4 md:px-8 z-10">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6 md:mb-8">
              <img
                src="/Branding and logos/BLKOUT25INV.png"
                alt="BLKOUT Logo"
                className="h-16 md:h-20 lg:h-24 w-auto mx-auto filter drop-shadow-lg"
                loading="eager"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-4 md:mb-6 leading-tight tracking-tight text-blkout-primary drop-shadow-2xl">
              Liberation Events Calendar
            </h1>
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-3 md:mb-4 uppercase tracking-wider text-liberation-silver drop-shadow-lg">
              Black Queer Community Sovereignty
            </h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 md:mb-8 leading-relaxed max-w-3xl mx-auto text-liberation-silver drop-shadow-md">
              Discover spaces where Black queer voices lead revolutionary change, build economic sovereignty, and create collective power.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Controls - Only show if authenticated */}
        {user && (
          <div className="bg-liberation-black-power/50 backdrop-blur-sm rounded-xl p-6 mb-8 border border-liberation-sovereignty-gold/20">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="text-liberation-sovereignty-gold">
                <h3 className="text-lg font-bold">Admin Controls</h3>
                <p className="text-sm text-liberation-silver">Manage liberation events and community content</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleModerationClick}
                  className="relative flex items-center px-4 py-2 bg-liberation-sovereignty-gold text-liberation-black-power rounded-lg hover:bg-liberation-sovereignty-gold/90 transition-colors duration-200 font-medium"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Moderation
                  {stats.pending > 0 && (
                    <span className="absolute -top-2 -right-2 bg-liberation-red-liberation text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {stats.pending}
                    </span>
                  )}
                </button>
                <button
                  onClick={handleIntelligenceClick}
                  className="flex items-center px-4 py-2 bg-liberation-green-africa text-white rounded-lg hover:bg-liberation-green-africa/90 transition-colors duration-200 font-medium"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Intelligence
                </button>
                <button
                  onClick={handleSignOut}
                  className="flex items-center px-4 py-2 border border-liberation-silver/30 text-liberation-silver rounded-lg hover:bg-liberation-silver/10 transition-colors duration-200"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Community Action Bar */}
        <div className="bg-gradient-to-r from-liberation-sovereignty-gold to-liberation-gold-divine text-liberation-black-power rounded-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold mb-2">Build Liberation Together</h2>
              <p className="text-liberation-black-power/80">Share community events and amplify revolutionary organizing</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowEventForm(true)}
                className="flex items-center px-6 py-3 bg-liberation-black-power text-liberation-sovereignty-gold rounded-lg hover:bg-liberation-black-power/90 transition-colors duration-200 font-bold"
              >
                <Plus className="w-5 h-5 mr-2" />
                Share Liberation Event
              </button>
              {!user && (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center px-4 py-3 border-2 border-liberation-black-power text-liberation-black-power rounded-lg hover:bg-liberation-black-power/10 transition-colors duration-200 font-medium"
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
        {!user && (
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blkout-primary">{events.length}</p>
                  <p className="text-sm text-gray-600">Liberation Events</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blkout-secondary">
                    {new Set(events.map(e => e.organizer_name)).size}
                  </p>
                  <p className="text-sm text-gray-600">Liberation Organizations</p>
                </div>
              </div>
            </div>
          </div>
        )}

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