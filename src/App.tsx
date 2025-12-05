import React, { useState, useEffect } from 'react';
import { Plus, Settings, LogIn, LogOut, BarChart3, Globe, Rss, Users, Calendar } from 'lucide-react';
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
import { GoogleCalendarEmbed } from './components/GoogleCalendarEmbed';
import { CalendarSyncDashboard } from './components/CalendarSyncDashboard';
import { FeaturedHeroCarousel } from './components/FeaturedHeroCarousel';
import { FeaturedContentManager } from './components/FeaturedContentManager';
import { featuredContentService } from './services/featuredContentService';
import { FeaturedContent } from './types';
import Footer from './components/Footer';
import Header from './components/Header';
import AdventCalendarBanner from './components/AdventCalendarBanner';

function App() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showModerationQueue, setShowModerationQueue] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showIntelligenceDashboard, setShowIntelligenceDashboard] = useState(false);
  const [showCalendarEmbed, setShowCalendarEmbed] = useState(false);
  const [showCalendarSync, setShowCalendarSync] = useState(false);
  const [showFeaturedManager, setShowFeaturedManager] = useState(false);
  const [isScrapingEvents, setIsScrapingEvents] = useState(false);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [featuredContent, setFeaturedContent] = useState<FeaturedContent[]>([]);
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
    loadFeaturedContent();
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

  const loadFeaturedContent = async () => {
    try {
      const content = await featuredContentService.getCurrentWeekFeatured();
      setFeaturedContent(content);
    } catch (error) {
      console.error('Error loading featured content:', error);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-950 to-emerald-950">
      {/* Navigation Header */}
      <Header />

      {/* Spacer for fixed header */}
      <div className="h-16"></div>

      {/* Hero Section with BLKOUT Branding */}
      <div className="relative overflow-hidden h-auto py-8 md:py-16 lg:py-20 mb-8">
        {/* Background Image - more visible */}
        <img
          src="/images/imagine.png"
          alt="Liberation Background"
          className="absolute inset-0 w-full h-full object-cover opacity-50"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />

        {/* Lighter overlay so image shows through */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/30 to-gray-900/50"></div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* BLKOUT Logo - using white version for dark background */}
          <div className="mb-6 md:mb-10">
            <img
              src="/images/blkoutlogo_wht_transparent.png"
              alt="BLKOUT Logo"
              className="h-16 md:h-24 lg:h-32 w-auto mx-auto filter drop-shadow-2xl"
              loading="eager"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>

          {/* WHAT'S ON Title with outline style */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black mb-6 md:mb-8 leading-none tracking-tighter text-yellow-500 drop-shadow-2xl" style={{
            WebkitTextStroke: '2px currentColor',
            WebkitTextFillColor: 'transparent',
            paintOrder: 'stroke fill'
          }}>
            WHAT'S ON
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-white drop-shadow-lg max-w-3xl mx-auto px-4">
            parties • culture • workshops<br/>Where the Black Queer Magic happens
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Controls - Only show if authenticated */}
        {user && (
          <div className="bg-gray-800 rounded-xl p-6 mb-8 border border-yellow-500/30">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="text-yellow-500">
                <h3 className="text-lg font-bold">Admin Controls</h3>
                <p className="text-sm text-gray-200">Manage liberation events and community content</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleModerationClick}
                  className="relative flex items-center px-4 py-2 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-400 transition-colors duration-200 font-medium"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Moderation
                  {stats.pending > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {stats.pending}
                    </span>
                  )}
                </button>
                <button
                  onClick={handleIntelligenceClick}
                  className="flex items-center px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-600 transition-colors duration-200 font-medium"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Intelligence
                </button>
                <button
                  onClick={() => setShowCalendarSync(true)}
                  className="flex items-center px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-600 transition-colors duration-200 font-medium"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Calendar Sync
                </button>
                <button
                  onClick={() => setShowFeaturedManager(true)}
                  className="flex items-center px-4 py-2 bg-pink-700 text-white rounded-lg hover:bg-pink-600 transition-colors duration-200 font-medium"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Featured Content
                </button>
                <button
                  onClick={handleSignOut}
                  className="flex items-center px-4 py-2 border border-gray-500 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors duration-200"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Community Action Bar */}
        <div className="bg-gradient-to-r from-yellow-600 to-amber-500 text-gray-900 rounded-xl p-6 mb-8 shadow-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold mb-2 text-gray-900">Ready to Join the Revolution?</h2>
              <p className="text-gray-900">Share your events • Connect with organizers • Build the movement together</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowEventForm(true)}
                className="flex items-center px-6 py-3 bg-gray-900 text-yellow-500 rounded-lg hover:bg-gray-800 transition-all duration-300 hover:scale-105 font-bold shadow-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Your Event
              </button>
              <button
                onClick={() => window.open('https://blkoutuk.com', '_blank')}
                className="flex items-center px-6 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-all duration-300 font-bold shadow-lg"
              >
                <Users className="w-5 h-5 mr-2" />
                Join BLKOUT Platform
              </button>
              {!user && (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center px-4 py-3 text-gray-900 hover:text-gray-800 transition-colors duration-200 font-medium"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Admin Login
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Advent Calendar Banner - Always Visible During December */}
        <AdventCalendarBanner />

        {/* Featured Hero Carousel */}
        {featuredContent.length > 0 && (
          <div className="mb-8">
            <FeaturedHeroCarousel featuredContent={featuredContent} autoPlayInterval={5000} />
          </div>
        )}

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
            <div className="bg-gray-800 rounded-xl p-6 border border-yellow-500/30 shadow-xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-3xl font-bold text-yellow-500">{events.length}</p>
                  <p className="text-sm text-gray-300">Liberation Events</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-red-500">{stats.pending}</p>
                  <p className="text-sm text-gray-300">Awaiting Review</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-emerald-500">
                    {new Set(events.map(e => e.organizer_name)).size}
                  </p>
                  <p className="text-sm text-gray-300">Community Organizers</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Public Stats */}
        {!user && (
          <div className="mb-8">
            <div className="bg-gray-800 rounded-xl p-6 border border-yellow-500/30 shadow-xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
                <div>
                  <p className="text-4xl font-bold text-yellow-500 mb-2">{events.length}</p>
                  <p className="text-lg text-gray-300">Liberation Events</p>
                  <p className="text-xs text-gray-400 mt-1">Parties, workshops & community gatherings</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-emerald-500 mb-2">
                    {new Set(events.map(e => e.organizer_name)).size}
                  </p>
                  <p className="text-lg text-gray-300">Community Organizers</p>
                  <p className="text-xs text-gray-400 mt-1">Folk are connecting, organizing, liberating</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Google Calendar Widget - Optional Public View */}
        {showCalendarEmbed && import.meta.env.VITE_GOOGLE_CALENDAR_ID && (
          <div className="mb-8">
            <GoogleCalendarEmbed />
          </div>
        )}

        {/* Events List */}
        <PaginatedEventList
          events={filteredEvents}
          loading={loading}
          emptyMessage="No liberation events found. Add yours to the movement!"
        />

        {/* Newsroom Integration - Show latest articles */}
        {!articlesLoading && articles && articles.length > 0 && (
          <div className="mt-12 bg-gray-800 backdrop-blur-sm rounded-xl p-6 border border-yellow-500/30">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Rss className="w-6 h-6 text-yellow-500 mr-3" />
                <h3 className="text-xl font-bold text-yellow-500">
                  Liberation Newsroom
                </h3>
              </div>
              <button
                onClick={() => window.open('https://blkout.vercel.app/newsroom', '_blank')}
                className="flex items-center px-4 py-2 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-400 transition-colors duration-200 font-medium"
              >
                <Globe className="w-4 h-4 mr-2" />
                View All Stories
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {articles.slice(0, 3).map((article) => (
                <a
                  key={article.id}
                  href={`https://blkout.vercel.app/newsroom/${article.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 bg-gray-700 border border-gray-600 rounded-lg hover:border-yellow-500/50 transition-colors duration-200"
                >
                  {article.cover_image && (
                    <img
                      src={article.cover_image}
                      alt={article.title}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                  )}
                  <h4 className="text-yellow-500 font-bold mb-2 line-clamp-2">
                    {article.title}
                  </h4>
                  <p className="text-gray-200 text-sm line-clamp-2">
                    {article.excerpt}
                  </p>
                  <p className="text-gray-400 text-xs mt-2">
                    {new Date(article.published_at).toLocaleDateString()}
                  </p>
                </a>
              ))}
            </div>
          </div>
        )}
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

      {showIntelligenceDashboard && user && (
        <CommunityIntelligenceDashboard
          onClose={() => setShowIntelligenceDashboard(false)}
        />
      )}

      {showCalendarSync && user && (
        <CalendarSyncDashboard
          events={events}
          onClose={() => setShowCalendarSync(false)}
        />
      )}

      {showFeaturedManager && user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-purple-500/30">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Featured Content Manager</h2>
                <p className="text-sm text-gray-100">Manage hero carousel and featured images</p>
              </div>
              <button
                onClick={() => {
                  setShowFeaturedManager(false);
                  loadFeaturedContent(); // Reload after closing
                }}
                className="text-white hover:text-gray-200 transition-colors"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <FeaturedContentManager />
            </div>
          </div>
        </div>
      )}

      {showAuthModal && (
        <AuthModal
          onSignIn={handleSignIn}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;