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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-teal-900">
      {/* Navigation Header */}
      <Header />

      {/* Hero Section with BLKOUT Branding */}
      <div className="relative overflow-hidden h-96 md:h-[32rem] mb-8 bg-white">
        {/* Background Image */}
        <img
          src="/images/imagine.png"
          alt="Liberation Background"
          className="absolute inset-0 w-full h-full object-cover opacity-30"
          onError={(e) => {
            // Hide image if it fails to load, keep white background
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4 md:px-8 z-10">
          <div className="max-w-4xl mx-auto">
            {/* BLKOUT Logo */}
            <div className="mb-8 md:mb-12">
              <img
                src="/images/blkoutlogo_blk_transparent.png"
                alt="BLKOUT Logo"
                className="h-24 md:h-32 lg:h-40 w-auto mx-auto"
                loading="eager"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>

            {/* CONNECT Title in outline style */}
            <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black mb-8 md:mb-12 leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-teal-600" style={{
              WebkitTextStroke: '2px black',
              paintOrder: 'stroke fill'
            }}>
              CONNECT
            </h1>
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
              <h2 className="text-xl font-bold mb-2">Ready to Join the Revolution?</h2>
              <p className="text-liberation-black-power/80">Share your events • Connect with organizers • Build the movement together</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowEventForm(true)}
                className="flex items-center px-6 py-3 bg-liberation-black-power text-liberation-sovereignty-gold rounded-lg hover:bg-liberation-black-power/90 transition-all duration-300 hover:scale-105 font-bold shadow-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Your Event
              </button>
              <button
                onClick={() => window.open('https://blkout.vercel.app', '_blank')}
                className="flex items-center px-6 py-3 bg-transparent border-2 border-liberation-black-power text-liberation-black-power rounded-lg hover:bg-liberation-black-power hover:text-liberation-sovereignty-gold transition-all duration-300 font-bold"
              >
                <Users className="w-5 h-5 mr-2" />
                Join BLKOUT Platform
              </button>
              {!user && (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center px-4 py-3 text-liberation-black-power/70 hover:text-liberation-black-power transition-colors duration-200 font-medium"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Admin Login
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

        {/* Stats - Only show if authenticated */}
        {user && (
          <div className="mb-8">
            <div className="bg-liberation-black-power/50 backdrop-blur-sm rounded-xl p-6 border border-liberation-sovereignty-gold/20">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-3xl font-bold text-liberation-sovereignty-gold">{events.length}</p>
                  <p className="text-sm text-liberation-silver">Liberation Events</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-liberation-red-liberation">{stats.pending}</p>
                  <p className="text-sm text-liberation-silver">Awaiting Review</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-liberation-green-africa">
                    {new Set(events.map(e => e.organizer_name)).size}
                  </p>
                  <p className="text-sm text-liberation-silver">Community Organizers</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Public Stats */}
        {!user && (
          <div className="mb-8">
            <div className="bg-liberation-black-power/50 backdrop-blur-sm rounded-xl p-6 border border-liberation-sovereignty-gold/20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
                <div>
                  <p className="text-4xl font-bold text-liberation-sovereignty-gold mb-2">{events.length}</p>
                  <p className="text-lg text-liberation-silver">Liberation Events</p>
                  <p className="text-xs text-liberation-silver/60 mt-1">Parties, workshops & community gatherings</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-liberation-green-africa mb-2">
                    {new Set(events.map(e => e.organizer_name)).size}
                  </p>
                  <p className="text-lg text-liberation-silver">Community Organizers</p>
                  <p className="text-xs text-liberation-silver/60 mt-1">Folk are connecting, organizing, liberating</p>
                </div>
              </div>
            </div>
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
          <div className="mt-12 bg-liberation-black-power/50 backdrop-blur-sm rounded-xl p-6 border border-liberation-sovereignty-gold/20">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Rss className="w-6 h-6 text-liberation-sovereignty-gold mr-3" />
                <h3 className="text-xl font-bold text-liberation-sovereignty-gold">
                  Liberation Newsroom
                </h3>
              </div>
              <button
                onClick={() => window.open('https://blkout.vercel.app/newsroom', '_blank')}
                className="flex items-center px-4 py-2 bg-liberation-sovereignty-gold text-liberation-black-power rounded-lg hover:bg-liberation-sovereignty-gold/90 transition-colors duration-200 font-medium"
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
                  className="block p-4 bg-liberation-black-power border border-liberation-silver/20 rounded-lg hover:border-liberation-sovereignty-gold/40 transition-colors duration-200"
                >
                  {article.cover_image && (
                    <img
                      src={article.cover_image}
                      alt={article.title}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                  )}
                  <h4 className="text-liberation-sovereignty-gold font-bold mb-2 line-clamp-2">
                    {article.title}
                  </h4>
                  <p className="text-liberation-silver text-sm line-clamp-2">
                    {article.excerpt}
                  </p>
                  <p className="text-liberation-silver/60 text-xs mt-2">
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