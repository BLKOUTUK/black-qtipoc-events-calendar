import React, { useState, useEffect } from 'react';
import { Plus, Settings, Heart, Shield, Mail, LogIn, LogOut, User } from 'lucide-react';
import { Event, FilterOptions } from './types';
import { googleSheetsService } from './services/googleSheetsService';
import { EventList } from './components/EventList';
import { EventForm } from './components/EventForm';
import { ModerationQueue } from './components/ModerationQueue';
import { FilterBar } from './components/FilterBar';
import { AuthModal } from './components/AuthModal';

function App() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showModerationQueue, setShowModerationQueue] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isScrapingEvents, setIsScrapingEvents] = useState(false);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: 'all',
    source: 'all',
    location: '',
    searchTerm: ''
  });

  useEffect(() => {
    loadEvents();
    loadStats();
    checkUser();
  }, []);

  useEffect(() => {
    const filtered = googleSheetsService.filterEvents(events, filters);
    setFilteredEvents(filtered);
  }, [events, filters]);

  const checkUser = async () => {
    const currentUser = await googleSheetsService.getCurrentUser();
    setUser(currentUser);
  };

  const loadEvents = async () => {
    setLoading(true);
    try {
      // Always load published events for public view
      const allEvents = await googleSheetsService.getPublishedEvents();
      setEvents(allEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      if (user) {
        const moderationStats = await googleSheetsService.getModerationStats();
        setStats(moderationStats);
      }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-teal-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Heart className="w-8 h-8 text-purple-600" />
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold text-gray-900">
                  Black QTIPOC+ Events
                </h1>
                <p className="text-sm text-gray-500">
                  Community-curated events for our people
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Public: Add Event Button */}
              <button
                onClick={() => setShowEventForm(true)}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Submit Event
              </button>

              {user ? (
                <>
                  {/* Authenticated: Admin Controls */}
                  <button
                    onClick={handleModerationClick}
                    className="relative flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Moderation
                    {stats.pending > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {stats.pending}
                      </span>
                    )}
                  </button>

                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-600">{user.email}</span>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200"
                    >
                      <LogOut className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Admin Login
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Discover Our Community
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Find events that celebrate Black QTIPOC+ voices, experiences, and joy. 
            From workshops to celebrations, discover spaces where you belong.
          </p>
        </div>

        {/* Filter Bar */}
        <FilterBar
          filters={filters}
          onFilterChange={setFilters}
          onScrapeEvents={handleScrapeEvents}
          isScrapingEvents={isScrapingEvents}
          showScrapeButton={!!user}
        />

        {/* Stats - Only show if authenticated */}
        {user && (
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-purple-600">{events.length}</p>
                  <p className="text-sm text-gray-600">Published Events</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
                  <p className="text-sm text-gray-600">Pending Review</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-teal-600">
                    {new Set(events.map(e => e.organizer_name)).size}
                  </p>
                  <p className="text-sm text-gray-600">Community Organizers</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Public Stats */}
        {!user && (
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-purple-600">{events.length}</p>
                  <p className="text-sm text-gray-600">Community Events</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-teal-600">
                    {new Set(events.map(e => e.organizer_name)).size}
                  </p>
                  <p className="text-sm text-gray-600">Community Organizers</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Google Sheets Integration Notice */}
        <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-green-900">
                Powered by Google Sheets
              </h3>
              <div className="mt-2 text-sm text-green-800">
                <p className="mb-2">
                  This platform uses Google Sheets as its database - simple, transparent, and community-friendly!
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-1">✅ Benefits:</h4>
                    <ul className="text-xs space-y-1">
                      <li>• No complex database setup</li>
                      <li>• Community can see all data</li>
                      <li>• Easy to backup and export</li>
                      <li>• Multiple admins can collaborate</li>
                      <li>• Free and reliable</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">🔧 Setup Required:</h4>
                    <ul className="text-xs space-y-1">
                      <li>• Create Google Sheet with proper columns</li>
                      <li>• Get Google Sheets API key</li>
                      <li>• Set VITE_GOOGLE_SHEET_ID</li>
                      <li>• Set VITE_GOOGLE_API_KEY</li>
                      <li>• Configure OAuth for write access</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Events List */}
        <EventList 
          events={filteredEvents} 
          loading={loading}
          emptyMessage="No events found. Try adjusting your filters or check back later for new events."
        />

        {/* Community Guidelines */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-purple-600" />
            Community Guidelines
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Safe Spaces</h4>
              <p className="text-sm text-gray-600">
                All events must be affirming and inclusive of Black QTIPOC+ identities. 
                We prioritize spaces where our community can feel safe and celebrated.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Community-Centered</h4>
              <p className="text-sm text-gray-600">
                Events should center Black QTIPOC+ voices, experiences, and leadership. 
                We amplify grassroots organizing and community-led initiatives.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Accessible</h4>
              <p className="text-sm text-gray-600">
                We encourage events that are accessible in terms of location, cost, 
                and physical accessibility. Include accessibility information when possible.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Respectful</h4>
              <p className="text-sm text-gray-600">
                All submissions must be respectful and appropriate. Discriminatory or 
                harmful content will not be tolerated.
              </p>
            </div>
          </div>
          <div className="mt-6 p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-800 flex items-center">
              <Mail className="w-4 h-4 mr-2" />
              Questions or concerns? Contact us at community@qtipocevents.org
            </p>
          </div>
        </div>
      </main>

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

      {showAuthModal && (
        <AuthModal
          onSignIn={handleSignIn}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-sm text-gray-400">
              Built with love for the Black QTIPOC+ community. 
              Powered by Google Sheets for transparency and community collaboration.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;