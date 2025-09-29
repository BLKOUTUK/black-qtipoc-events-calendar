import React, { useState, useEffect } from 'react';
import { Plus, Settings, Heart, Shield, Mail, LogIn, LogOut, User, Zap, Users, Globe, Rss, BarChart3, Calendar, Newspaper } from 'lucide-react';
import { Event, FilterOptions } from './types';
import { supabaseEventService } from './services/supabaseEventService';
import { googleSheetsService } from './services/googleSheetsService';
import { useArticles } from './hooks/useSupabase';
import { PaginatedEventList } from './components/PaginatedEventList';
import { ArticleList } from './components/ArticleList';
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
  const [activeTab, setActiveTab] = useState<'events' | 'newsroom'>('events');
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
                  BLKOUT Liberation Calendar
                </h1>
                <p className="text-sm text-gray-300">
                  Black Queer Liberation Events • Community Sovereignty • Creator Economy
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
                Share Event
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
          <div className="flex items-center justify-center gap-6 mb-4">
            <img 
              src="/images/face-square/face-cycling.gif" 
              alt="Community members cycling" 
              className="w-20 h-20 rounded-lg shadow-lg"
            />
            <h2 className="text-4xl font-bold text-white">
              Black Queer Liberation Events
            </h2>
            <img 
              src="/images/face-square/face-cycling.gif" 
              alt="Community members cycling" 
              className="w-20 h-20 rounded-lg shadow-lg"
            />
          </div>
          <p className="text-xl text-gray-200 max-w-3xl mx-auto mb-6">
            Community-owned liberation platform. Discover spaces where Black queer voices 
            lead revolutionary change, build economic sovereignty, and create collective power.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-blkout-primary/20 border border-blkout-primary text-blkout-secondary backdrop-blur-sm">
              <Rss className="w-4 h-4 mr-1" />
              Liberation-centered
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-blkout-accent/20 border border-blkout-accent text-gray-100 backdrop-blur-sm">
              <Globe className="w-4 h-4 mr-1" />
              Community sovereignty
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-blkout-warm/20 border border-blkout-warm text-gray-100 backdrop-blur-sm">
              <Users className="w-4 h-4 mr-1" />
              Creator economy
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
                  <p className="text-sm text-gray-600">Liberation Events</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blkout-warm">{stats.pending}</p>
                  <p className="text-sm text-gray-600">Awaiting Review</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blkout-secondary">
                    {new Set(events.map(e => e.organizer_name)).size}
                  </p>
                  <p className="text-sm text-gray-600">Liberation Organizers</p>
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

        {/* Data Sources & Liberation Movement Info */}
        <div className="mb-8 space-y-6">
          {/* Data Sources */}
          <div className="bg-blkout-secondary/10 border border-blkout-secondary/30 rounded-lg p-6 backdrop-blur-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Globe className="w-6 h-6 text-blkout-secondary" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-medium text-white">
                  Liberation Event Discovery
                </h3>
                <div className="mt-2 text-sm text-gray-200">
                  <p className="mb-3">
                    BLKOUT autonomously discovers Black queer liberation events across the web, 
                    centering community sovereignty and revolutionary organizing.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">🏴 Liberation Sources:</h4>
                      <ul className="text-xs space-y-1">
                        <li>• Black queer liberation organizations</li>
                        <li>• Community-owned event platforms</li>
                        <li>• Revolutionary arts & cultural spaces</li>
                        <li>• Mutual aid & organizing networks</li>
                        <li>• Creator economy initiatives</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">🔄 Community Control:</h4>
                      <ul className="text-xs space-y-1">
                        <li>• Community-owned moderation</li>
                        <li>• Democratic content governance</li>
                        <li>• Liberation-centered filtering</li>
                        <li>• Anti-oppressive quality control</li>
                        <li>• Sovereign data management</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Featured Liberation Organizations */}
          <div className="bg-gradient-to-r from-blkout-primary/10 to-blkout-warm/10 border border-blkout-primary/30 rounded-lg p-6 backdrop-blur-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Heart className="w-6 h-6 text-blkout-primary" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-medium text-white">
                  Liberation Movement Partners
                </h3>
                <p className="mt-2 text-sm text-gray-200 mb-4">
                  Revolutionary organizations building Black queer liberation through community power
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <a 
                    href="https://www.rainbownoirmcr.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-white/70 rounded-lg p-4 hover:bg-white/80 transition-colors duration-200 hover:shadow-lg"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-3">
                      <span className="text-white font-bold text-lg">RN</span>
                    </div>
                    <h4 className="font-semibold text-purple-900 mb-1">Rainbow Noir</h4>
                    <p className="text-xs text-purple-700 mb-2">
                      Manchester collective creating liberated spaces for Black queer community through revolutionary organizing and mutual support.
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="bg-purple-100 px-2 py-1 rounded-full text-xs text-purple-600">Liberation Organizing</span>
                      <span className="text-xs text-purple-500 hover:text-purple-700">Join movement →</span>
                    </div>
                  </a>
                  
                  <a 
                    href="https://marlboroughproductions.org.uk/project/radical-rhizomes/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-white/70 rounded-lg p-4 hover:bg-white/80 transition-colors duration-200 hover:shadow-lg"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mb-3">
                      <span className="text-white font-bold text-lg">RR</span>
                    </div>
                    <h4 className="font-semibold text-purple-900 mb-1">Radical Rhizomes</h4>
                    <p className="text-xs text-purple-700 mb-2">
                      Revolutionary collective fostering community power through creative resistance, educational organizing, and collective liberation projects.
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="bg-purple-100 px-2 py-1 rounded-full text-xs text-purple-600">Revolutionary Education</span>
                      <span className="text-xs text-purple-500 hover:text-purple-700">Join movement →</span>
                    </div>
                  </a>

                  <a 
                    href="https://lambeth.blackthrive.org/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-white/70 rounded-lg p-4 hover:bg-white/80 transition-colors duration-200 hover:shadow-lg"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center mb-3">
                      <span className="text-white font-bold text-lg">BQ</span>
                    </div>
                    <h4 className="font-semibold text-purple-900 mb-1">Black Queer & Thriving</h4>
                    <p className="text-xs text-purple-700 mb-2">
                      Building Black queer liberation through community healing, revolutionary wellness practices, and collective mental health sovereignty.
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="bg-purple-100 px-2 py-1 rounded-full text-xs text-purple-600">Liberation Healing</span>
                      <span className="text-xs text-purple-500 hover:text-purple-700">Join movement →</span>
                    </div>
                  </a>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-xs text-purple-700">
                    Building liberation movements? Connect with us via <strong>#tellivor</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Revolutionary Partnership Call */}
          <div className="bg-blkout-accent/10 border border-blkout-accent/30 rounded-lg p-6 backdrop-blur-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Users className="w-6 h-6 text-blkout-accent" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-medium text-white">
                  Build Liberation Together
                </h3>
                <div className="mt-2 text-sm text-gray-200">
                  <p className="mb-3">
                    We're creating the most powerful Black queer liberation event network. 
                    Join BLKOUT's revolutionary platform to amplify liberation organizing.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">🏴 For Liberation Organizations:</h4>
                      <ul className="text-xs space-y-1">
                        <li>• Community-owned platform access</li>
                        <li>• Liberation-centered visibility</li>
                        <li>• Revolutionary organizing support</li>
                        <li>• Creator economy participation</li>
                        <li>• Movement analytics & insights</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">✊ Build the Movement:</h4>
                      <ul className="text-xs space-y-1">
                        <li>• Liberation organizing: <strong>#tellivor</strong></li>
                        <li>• Community building: <strong>#askivor</strong></li>
                        <li>• Revolutionary partnerships: liberation@blkoutuk.com</li>
                        <li>• Share liberation events everywhere</li>
                        <li>• Build collective power together</li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-blkout-accent/20 border border-blkout-accent/50 rounded-lg backdrop-blur-sm">
                    <p className="text-xs font-medium text-white">
                      ✊ Revolution tip: Use <strong>#blkoutliberation</strong> when sharing liberation events 
                      to help our AI discover and amplify your revolutionary work!
                    </p>
                  </div>
                </div>
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

        {/* Liberation Community Guidelines */}
        <div className="mt-12 bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-blkout-primary" />
            Liberation Community Principles
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Revolutionary Spaces</h4>
              <p className="text-sm text-gray-600">
                All events must center Black queer liberation and revolutionary organizing. 
                We prioritize spaces building collective power and challenging oppressive systems.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Community Sovereignty</h4>
              <p className="text-sm text-gray-600">
                Events should advance Black queer self-determination, economic sovereignty, and community ownership. 
                We amplify grassroots liberation organizing and creator economy initiatives.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Liberation-Accessible</h4>
              <p className="text-sm text-gray-600">
                We prioritize events accessible to working-class Black queer communities in terms of cost, location, 
                and physical accessibility. Liberation must be accessible to all.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Anti-Oppressive</h4>
              <p className="text-sm text-gray-600">
                All content must actively challenge racism, queerphobia, capitalism, and other forms of oppression. 
                Harmful or discriminatory content undermines our liberation goals.
              </p>
            </div>
          </div>
          <div className="mt-6 p-4 bg-blkout-primary/10 border border-blkout-primary/30 rounded-lg">
            <p className="text-sm text-gray-800 flex items-center">
              <Mail className="w-4 h-4 mr-2" />
              Liberation questions? Reach our community at liberation@blkoutuk.com
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
                <span className="font-semibold text-lg">BLKOUT Liberation Calendar</span>
              </div>
            </div>
            <p className="text-sm text-gray-300 mb-2">
              Built with revolutionary love for Black queer liberation.
            </p>
            <p className="text-xs text-gray-400">
              Community sovereignty • Creator economy • Digital liberation
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;