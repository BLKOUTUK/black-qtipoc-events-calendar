import React, { useState, useEffect } from 'react';
import { Plus, Settings, Heart, Shield, Mail, LogIn, LogOut, User, Zap, Users, Globe, Rss, BarChart3 } from 'lucide-react';
import { Event, FilterOptions } from './types';
import { eventService } from './services/eventService';
import { EventList } from './components/EventList';
import { EventForm } from './components/EventForm';
import { ModerationQueue } from './components/ModerationQueue';
import { FilterBar } from './components/FilterBar';
import { AuthModal } from './components/AuthModal';
import CommunityIntelligenceDashboard from './components/CommunityIntelligenceDashboard';
import CrossModuleNav from './components/CrossModuleNav';

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

  useEffect(() => {
    loadEvents();
    loadStats();
    checkUser();
  }, []);

  useEffect(() => {
    const filtered = eventService.filterEvents(events, filters);
    setFilteredEvents(filtered);
  }, [events, filters]);

  const checkUser = async () => {
    const currentUser = await googleSheetsService.getCurrentUser();
    setUser(currentUser);
  };

  const loadEvents = async () => {
    setLoading(true);
    try {
      // Load events from API
      const allEvents = await eventService.scrapeEvents();
      setEvents(allEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const moderationStats = eventService.getModerationStats();
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
    <div className="min-h-screen bg-gradient-to-br from-blkout-deep via-blkout-deep to-black">
      {/* Header */}
      <header className="bg-black/90 backdrop-blur-md border-b border-blkout-primary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gradient-to-br from-blkout-primary to-blkout-warm rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">B</span>
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold text-white">
                  BLKOUT Events Calendar
                </h1>
                <p className="text-sm text-gray-300">
                  Black QTIPOC+ Community Events • Cooperative Ownership
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Public: Add Event Button */}
              <button
                onClick={() => setShowEventForm(true)}
                className="flex items-center px-4 py-2 bg-blkout-primary text-white rounded-lg hover:bg-blkout-warm transition-colors duration-200"
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

                  <button
                    onClick={handleIntelligenceClick}
                    className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-200"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Intelligence
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
        {/* Cross-Module Navigation */}
        <CrossModuleNav />
        
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Discover Black QTIPOC+ Events
          </h2>
          <p className="text-xl text-gray-200 max-w-3xl mx-auto mb-6">
            Community-owned event discovery platform. Find workshops, celebrations, 
            and spaces where Black QTIPOC+ voices are centered and celebrated.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-blkout-primary/20 border border-blkout-primary text-blkout-secondary backdrop-blur-sm">
              <Rss className="w-4 h-4 mr-1" />
              Multi-source discovery
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-blkout-accent/20 border border-blkout-accent text-gray-100 backdrop-blur-sm">
              <Globe className="w-4 h-4 mr-1" />
              Updated daily
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-blkout-warm/20 border border-blkout-warm text-gray-100 backdrop-blur-sm">
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
                  <p className="text-2xl font-bold text-blkout-primary">{events.length}</p>
                  <p className="text-sm text-gray-600">Published Events</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blkout-warm">{stats.pending}</p>
                  <p className="text-sm text-gray-600">Pending Review</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blkout-secondary">
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
                  <p className="text-2xl font-bold text-blkout-primary">{events.length}</p>
                  <p className="text-sm text-gray-600">Community Events</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blkout-secondary">
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
          <div className="bg-blkout-secondary/10 border border-blkout-secondary/30 rounded-lg p-6 backdrop-blur-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Globe className="w-6 h-6 text-blkout-secondary" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-medium text-white">
                  How We Find Events
                </h3>
                <div className="mt-2 text-sm text-gray-200">
                  <p className="mb-3">
                    BLKOUT automatically discovers events from trusted sources across the web, 
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
          <div className="bg-gradient-to-r from-blkout-primary/10 to-blkout-warm/10 border border-blkout-primary/30 rounded-lg p-6 backdrop-blur-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Heart className="w-6 h-6 text-blkout-primary" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-medium text-white">
                  Community Partners
                </h3>
                <p className="mt-2 text-sm text-gray-200 mb-4">
                  Organizations creating safe spaces and celebrating Black QTIPOC+ voices
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/70 rounded-lg p-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-3">
                      <span className="text-white font-bold text-lg">RN</span>
                    </div>
                    <h4 className="font-semibold text-purple-900 mb-1">Rainbow Noir</h4>
                    <p className="text-xs text-purple-700 mb-2">
                      Manchester-based collective creating safe spaces for QTIPOC+ community through regular social events and peer support networks.
                    </p>
                    <div className="text-xs text-purple-600">
                      <span className="bg-purple-100 px-2 py-1 rounded-full">Community Events</span>
                    </div>
                  </div>
                  
                  <div className="bg-white/70 rounded-lg p-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mb-3">
                      <span className="text-white font-bold text-lg">RR</span>
                    </div>
                    <h4 className="font-semibold text-purple-900 mb-1">Radical Rhizomes</h4>
                    <p className="text-xs text-purple-700 mb-2">
                      Grassroots collective fostering community connection and social justice through creative workshops, discussions, and collaborative projects.
                    </p>
                    <div className="text-xs text-purple-600">
                      <span className="bg-purple-100 px-2 py-1 rounded-full">Workshops</span>
                    </div>
                  </div>

                  <div className="bg-white/70 rounded-lg p-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center mb-3">
                      <span className="text-white font-bold text-lg">BQ</span>
                    </div>
                    <h4 className="font-semibold text-purple-900 mb-1">Black Queer and Thriving at Black Thrive Lambeth</h4>
                    <p className="text-xs text-purple-700 mb-2">
                      Supporting Black QTIPOC+ individuals in Lambeth through wellness programs, community building, and advocacy for mental health and wellbeing.
                    </p>
                    <div className="text-xs text-purple-600">
                      <span className="bg-purple-100 px-2 py-1 rounded-full">Wellness</span>
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
          <div className="bg-blkout-accent/10 border border-blkout-accent/30 rounded-lg p-6 backdrop-blur-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Users className="w-6 h-6 text-blkout-accent" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-medium text-white">
                  Partner With Us
                </h3>
                <div className="mt-2 text-sm text-gray-200">
                  <p className="mb-3">
                    We're building the most comprehensive Black QTIPOC+ events calendar. 
                    Partner with BLKOUT to amplify your events to our growing community.
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
                  <div className="mt-4 p-3 bg-blkout-accent/20 border border-blkout-accent/50 rounded-lg backdrop-blur-sm">
                    <p className="text-xs font-medium text-white">
                      💡 Pro tip: Use <strong>#blkoutevents</strong> when posting events on social media 
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
        <div className="mt-12 bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-blkout-primary" />
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
          <div className="mt-6 p-4 bg-blkout-primary/10 border border-blkout-primary/30 rounded-lg">
            <p className="text-sm text-gray-800 flex items-center">
              <Mail className="w-4 h-4 mr-2" />
              Questions or concerns? Contact us at community@blkoutuk.com
            </p>
          </div>
        </div>
      </main>

      {/* Modals and Dashboards */}
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
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
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

      {/* Footer */}
      <footer className="bg-blkout-deep text-white mt-16 border-t border-blkout-primary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="mb-4">
              <div className="inline-flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-br from-blkout-primary to-blkout-warm rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-sm">B</span>
                </div>
                <span className="font-semibold text-lg">BLKOUT Events Calendar</span>
              </div>
            </div>
            <p className="text-sm text-gray-300 mb-2">
              Built with love for the Black QTIPOC+ community.
            </p>
            <p className="text-xs text-gray-400">
              Community-owned platform • Cooperative ownership • Digital sovereignty
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;