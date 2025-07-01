import React, { useState, useEffect } from 'react';
import { Plus, Settings, Heart, Shield, Mail, LogIn, LogOut, User, Zap, Users, Globe, Rss } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Zap className="w-8 h-8 text-yellow-600" />
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold text-gray-900">
                  IVOR Events Calendar
                </h1>
                <p className="text-sm text-gray-500">
                  Powered by BLKOUT • Community-driven event discovery
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Public: Add Event Button */}
              <button
                onClick={() => setShowEventForm(true)}
                className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors duration-200"
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
            Discover Black QTIPOC+ Events
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
            Automatically curated from trusted sources across the web. Find workshops, celebrations, 
            and spaces where Black QTIPOC+ voices are centered and celebrated.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-800">
              <Rss className="w-4 h-4 mr-1" />
              Multi-source discovery
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800">
              <Globe className="w-4 h-4 mr-1" />
              Updated daily
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800">
              <Users className="w-4 h-4 mr-1" />
              Community verified
            </span>
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

        {/* Stats - Only show if authenticated */}
        {user && (
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{events.length}</p>
                  <p className="text-sm text-gray-600">Published Events</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
                  <p className="text-sm text-gray-600">Pending Review</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600">
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
                  <p className="text-2xl font-bold text-yellow-600">{events.length}</p>
                  <p className="text-sm text-gray-600">Community Events</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600">
                    {new Set(events.map(e => e.organizer_name)).size}
                  </p>
                  <p className="text-sm text-gray-600">Partner Organizations</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Data Sources & Partnership Info */}
        <div className="mb-8 space-y-6">
          {/* Data Sources */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Globe className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-medium text-yellow-900">
                  How We Find Events
                </h3>
                <div className="mt-2 text-sm text-yellow-800">
                  <p className="mb-3">
                    IVOR automatically discovers events from trusted sources across the web, 
                    filtering for Black QTIPOC+ relevance and community value.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">📡 Data Sources:</h4>
                      <ul className="text-xs space-y-1">
                        <li>• QTIPOC+ organization websites</li>
                        <li>• Eventbrite & community platforms</li>
                        <li>• Cultural venues & arts centers</li>
                        <li>• RSS feeds from partner orgs</li>
                        <li>• Community submissions</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">🔄 Updates:</h4>
                      <ul className="text-xs space-y-1">
                        <li>• Automated daily collection</li>
                        <li>• Smart duplicate removal</li>
                        <li>• Community moderation</li>
                        <li>• Quality scoring & filtering</li>
                        <li>• Real-time synchronization</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Featured Partner Organizations */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Heart className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-medium text-purple-900">
                  Community Partners
                </h3>
                <p className="mt-2 text-sm text-purple-800 mb-4">
                  Organizations creating safe spaces and celebrating Black QTIPOC+ voices
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/70 rounded-lg p-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center mb-3">
                      <span className="text-white font-bold text-lg">BP</span>
                    </div>
                    <h4 className="font-semibold text-purple-900 mb-1">UK Black Pride</h4>
                    <p className="text-xs text-purple-700 mb-2">
                      Europe's largest celebration for LGBTQ+ people of African, Asian, Caribbean, Middle Eastern and Latin American descent.
                    </p>
                    <div className="text-xs text-purple-600">
                      <span className="bg-purple-100 px-2 py-1 rounded-full">Pride Events</span>
                    </div>
                  </div>
                  
                  <div className="bg-white/70 rounded-lg p-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center mb-3">
                      <span className="text-white font-bold text-lg">RM</span>
                    </div>
                    <h4 className="font-semibold text-purple-900 mb-1">Rich Mix</h4>
                    <p className="text-xs text-purple-700 mb-2">
                      Cultural venue in Bethnal Green showcasing diverse arts, music, and community events.
                    </p>
                    <div className="text-xs text-purple-600">
                      <span className="bg-purple-100 px-2 py-1 rounded-full">Arts & Culture</span>
                    </div>
                  </div>

                  <div className="bg-white/70 rounded-lg p-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-teal-500 rounded-lg flex items-center justify-center mb-3">
                      <span className="text-white font-bold text-lg">SC</span>
                    </div>
                    <h4 className="font-semibold text-purple-900 mb-1">Southbank Centre</h4>
                    <p className="text-xs text-purple-700 mb-2">
                      Leading arts center hosting inclusive events, festivals, and community programs.
                    </p>
                    <div className="text-xs text-purple-600">
                      <span className="bg-purple-100 px-2 py-1 rounded-full">Festivals</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-xs text-purple-700">
                    Want to see your organization featured? Get in touch via <strong>#tellivor</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Partnership Call */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-medium text-blue-900">
                  Partner With Us
                </h3>
                <div className="mt-2 text-sm text-blue-800">
                  <p className="mb-3">
                    We're building the most comprehensive Black QTIPOC+ events calendar. 
                    Partner with IVOR to amplify your events to our growing community.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">🤝 For Organizations:</h4>
                      <ul className="text-xs space-y-1">
                        <li>• Direct RSS feed integration</li>
                        <li>• Guaranteed event visibility</li>
                        <li>• Organization profile page</li>
                        <li>• Priority event featuring</li>
                        <li>• Analytics & reach reports</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">📱 Spread the Word:</h4>
                      <ul className="text-xs space-y-1">
                        <li>• Tag us: <strong>#tellivor</strong> (B2B partnerships)</li>
                        <li>• Community: <strong>#askivor</strong> (general inquiries)</li>
                        <li>• Email: partnerships@blkout.co.uk</li>
                        <li>• Share your events on social</li>
                        <li>• Tell other organizers about us</li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                    <p className="text-xs font-medium text-blue-900">
                      💡 Pro tip: Use <strong>#tellivor</strong> when posting events on social media 
                      to help our system discover them automatically!
                    </p>
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