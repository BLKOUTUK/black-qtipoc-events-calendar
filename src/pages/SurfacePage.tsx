import { useState, useEffect, lazy, Suspense } from 'react';
import { Settings, LogOut, BarChart3, Calendar, Users } from 'lucide-react';
import { Event } from '../types';
import { supabaseEventService } from '../services/supabaseEventService';
import { googleSheetsService } from '../services/googleSheetsService';
import { fetchGatherings, fetchOpenings, fetchPageNote } from '../services/surfaceService';
import { Gathering, Opening, PageNote } from '../types/surface';
import { publishedPlaces, heldPlacesCount } from '../data/places';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Surface } from '../components/surface/Surface';

// Deferred — loaded on demand (modals, admin panels).
const EventForm = lazy(() => import('../components/EventForm').then((m) => ({ default: m.EventForm })));
const OpeningForm = lazy(() => import('../components/OpeningForm').then((m) => ({ default: m.OpeningForm })));
const AuthModal = lazy(() => import('../components/AuthModal').then((m) => ({ default: m.AuthModal })));
const ModerationQueue = lazy(() => import('../components/ModerationQueue').then((m) => ({ default: m.ModerationQueue })));
const CommunityIntelligenceDashboard = lazy(() => import('../components/CommunityIntelligenceDashboard'));
const CalendarSyncDashboard = lazy(() =>
  import('../components/CalendarSyncDashboard').then((m) => ({ default: m.CalendarSyncDashboard }))
);
const FeaturedContentManager = lazy(() =>
  import('../components/FeaturedContentManager').then((m) => ({ default: m.FeaturedContentManager }))
);
const AnalyticsDashboard = lazy(() => import('../components/analytics').then((m) => ({ default: m.AnalyticsDashboard })));
const OrganizerDashboard = lazy(() => import('../components/organizer').then((m) => ({ default: m.OrganizerDashboard })));
const InstallPrompt = lazy(() => import('../components/pwa').then((m) => ({ default: m.InstallPrompt })));
const OfflineIndicator = lazy(() => import('../components/pwa').then((m) => ({ default: m.OfflineIndicator })));

function LazyFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="w-6 h-6 border-2 border-events border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

interface SurfacePageProps {
  /** Scrolled to on mount once the surface has rendered. */
  initialSection?: 'gatherings' | 'openings' | 'places';
  /** `/openings/submit` opens the opening form immediately. */
  openOpeningForm?: boolean;
}

export function SurfacePage({ initialSection, openOpeningForm = false }: SurfacePageProps) {
  const [pageLoading, setPageLoading] = useState(true);
  const [gatherings, setGatherings] = useState<Gathering[]>([]);
  const [openings, setOpenings] = useState<Opening[]>([]);
  const [note, setNote] = useState<PageNote | null>(null);
  const [noteError, setNoteError] = useState<string | null>(null);

  const [events, setEvents] = useState<Event[]>([]); // admin-only: feeds Calendar Sync
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });

  const [showEventForm, setShowEventForm] = useState(false);
  const [showOpeningForm, setShowOpeningForm] = useState(openOpeningForm);
  const [showModerationQueue, setShowModerationQueue] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showIntelligenceDashboard, setShowIntelligenceDashboard] = useState(false);
  const [showCalendarSync, setShowCalendarSync] = useState(false);
  const [showFeaturedManager, setShowFeaturedManager] = useState(false);
  const [showAnalyticsDashboard, setShowAnalyticsDashboard] = useState(false);
  const [showOrganizerDashboard, setShowOrganizerDashboard] = useState(false);

  const loadGatherings = async () => {
    const { data } = await fetchGatherings();
    setGatherings(data);
  };

  const loadOpenings = async () => {
    const { data } = await fetchOpenings();
    setOpenings(data);
  };

  const loadNote = async () => {
    const { data, error } = await fetchPageNote();
    setNote(data);
    setNoteError(error);
  };

  const loadEvents = async () => {
    try {
      const allEvents = await supabaseEventService.getPublishedEvents();
      setEvents((allEvents || []).filter((e) => e && e.id));
    } catch (error) {
      console.error('Error loading events:', error);
      setEvents([]);
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

  const checkUser = async () => {
    const currentUser = await googleSheetsService.getCurrentUser();
    setUser(currentUser);
  };

  useEffect(() => {
    (async () => {
      await Promise.all([loadGatherings(), loadOpenings(), loadNote(), loadEvents()]);
      setPageLoading(false);
    })();
    checkUser();
  }, []);

  // Shareable submission link. The "Add Your Event" button is state-only, so partners could
  // only be told "go to the site and find the button" — no URL to hand them. These paths let
  // an invitation carry a link that opens the form directly.
  useEffect(() => {
    const path = window.location.pathname.replace(/\/+$/, '');
    const opensForm =
      path === '/submit' || path === '/add' || new URLSearchParams(window.location.search).has('submit');
    if (opensForm) setShowEventForm(true);
  }, []);

  // Honour `?login=open` so MC and other admin entry points can deep-link straight
  // into the auth flow regardless of session state. After successful sign-in,
  // `?next=/path` (if present) navigates to that path.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('login') === 'open') {
      setShowAuthModal(true);
    }
  }, []);

  // Scroll to the section this route names, once the surface has rendered.
  useEffect(() => {
    if (!initialSection || pageLoading) return;
    document.getElementById(initialSection)?.scrollIntoView({ block: 'start' });
  }, [initialSection, pageLoading]);

  const handleEventSubmit = async () => {
    setShowEventForm(false);
    await Promise.all([loadEvents(), loadGatherings()]);
    if (user) await loadStats();
  };

  const handleOpeningSubmit = () => {
    loadOpenings();
  };

  const handleSignIn = async (email: string, password: string) => {
    const signedInUser = await googleSheetsService.signIn(email, password);
    setUser(signedInUser);
    setShowAuthModal(false);
    await loadStats();
    const params = new URLSearchParams(window.location.search);
    const next = params.get('next');
    if (next && next.startsWith('/')) {
      window.location.assign(next);
    } else if (params.has('login')) {
      params.delete('login');
      const qs = params.toString();
      window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : ''));
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

  const places = publishedPlaces();
  const placesHeld = heldPlacesCount();

  return (
    <div className="min-h-screen bg-[#0a0a14] noise">
      <Header />
      <div className="h-16" />

      {/* Admin Controls — authed only. Unchanged from the previous home surface. */}
      {user && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="bg-liberation-black-power rounded-xl p-6 mb-8 border-2 border-events">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="text-events">
                <h3 className="text-lg font-bold">Admin Controls</h3>
                <p className="text-sm text-gray-200">Manage liberation events and community content</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleModerationClick}
                  className="relative flex items-center px-4 py-2 bg-events text-liberation-black-power rounded-lg hover:bg-events/90 transition-colors duration-200 font-medium"
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
                  onClick={() => setShowAnalyticsDashboard(true)}
                  className="flex items-center px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 font-medium"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analytics
                </button>
                <button
                  onClick={() => setShowOrganizerDashboard(true)}
                  className="flex items-center px-4 py-2 bg-orange-700 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200 font-medium"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Organizer
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
        </div>
      )}

      {pageLoading ? (
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 border-2 border-events border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <Surface
          gatherings={gatherings}
          openings={openings}
          places={places}
          placesHeld={placesHeld}
          note={note}
          state={{ noteError }}
          onOpenEventForm={() => setShowEventForm(true)}
          onOpenOpeningForm={() => setShowOpeningForm(true)}
        />
      )}

      <Footer />

      {/* Modals — lazy-loaded on demand */}
      <Suspense fallback={<LazyFallback />}>
        {showEventForm && <EventForm onSubmit={handleEventSubmit} onCancel={() => setShowEventForm(false)} />}
        {showOpeningForm && (
          <OpeningForm onSubmit={handleOpeningSubmit} onCancel={() => setShowOpeningForm(false)} />
        )}
        {showAuthModal && <AuthModal onSignIn={handleSignIn} onClose={() => setShowAuthModal(false)} />}
      </Suspense>

      <Suspense fallback={null}>
        {showModerationQueue && user && <ModerationQueue onClose={() => setShowModerationQueue(false)} />}
        {/* CommunityIntelligenceDashboard takes no props (pre-existing — it had no working
            close button in the original App.tsx either; out of scope to fix here). */}
        {showIntelligenceDashboard && user && <CommunityIntelligenceDashboard />}
        {showCalendarSync && user && (
          <CalendarSyncDashboard events={events} onClose={() => setShowCalendarSync(false)} />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {showFeaturedManager && user && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-purple-500/30">
              <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Featured Content Manager</h2>
                  <p className="text-sm text-gray-100">Manage hero carousel and featured images</p>
                </div>
                <button
                  onClick={() => setShowFeaturedManager(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <FeaturedContentManager />
              </div>
            </div>
          </div>
        )}

        {showAnalyticsDashboard && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-blue-500/30">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-500 p-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Analytics Dashboard</h2>
                <button onClick={() => setShowAnalyticsDashboard(false)} className="text-white hover:text-gray-200">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <AnalyticsDashboard isAdmin={!!user} />
              </div>
            </div>
          </div>
        )}

        {showOrganizerDashboard && user && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-orange-500/30">
              <div className="bg-gradient-to-r from-orange-600 to-red-500 p-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Organizer Dashboard</h2>
                <button onClick={() => setShowOrganizerDashboard(false)} className="text-white hover:text-gray-200">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <OrganizerDashboard userId="demo-user" />
              </div>
            </div>
          </div>
        )}
      </Suspense>

      {/* PWA Components — lazy, non-blocking */}
      <Suspense fallback={null}>
        <OfflineIndicator />
        <InstallPrompt />
      </Suspense>
    </div>
  );
}
