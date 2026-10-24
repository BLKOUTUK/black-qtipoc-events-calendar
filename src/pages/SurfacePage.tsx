import { useState, useEffect, lazy, Suspense } from 'react';
import { googleSheetsService } from '../services/googleSheetsService';
import { fetchGatherings, fetchOpenings, fetchPageNote } from '../services/surfaceService';
import { Gathering, Opening, PageNote } from '../types/surface';
import { publishedPlaces, heldPlacesCount } from '../data/places';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Surface } from '../components/surface/Surface';

// Deferred — loaded on demand (modals).
const EventForm = lazy(() => import('../components/EventForm').then((m) => ({ default: m.EventForm })));
const OpeningForm = lazy(() => import('../components/OpeningForm').then((m) => ({ default: m.OpeningForm })));
const AuthModal = lazy(() => import('../components/AuthModal').then((m) => ({ default: m.AuthModal })));
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

  const [, setUser] = useState(null);

  const [showEventForm, setShowEventForm] = useState(false);
  const [showOpeningForm, setShowOpeningForm] = useState(openOpeningForm);
  const [showAuthModal, setShowAuthModal] = useState(false);

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

  const checkUser = async () => {
    const currentUser = await googleSheetsService.getCurrentUser();
    setUser(currentUser);
  };

  useEffect(() => {
    (async () => {
      await Promise.all([loadGatherings(), loadOpenings(), loadNote()]);
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
    await loadGatherings();
  };

  const handleOpeningSubmit = () => {
    loadOpenings();
  };

  const handleSignIn = async (email: string, password: string) => {
    const signedInUser = await googleSheetsService.signIn(email, password);
    setUser(signedInUser);
    setShowAuthModal(false);
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




  const places = publishedPlaces();
  const placesHeld = heldPlacesCount();

  return (
    <div className="min-h-screen bg-[#0a0a14] noise">
      <Header />
      <div className="h-16" />

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

      {/* PWA Components — lazy, non-blocking */}
      <Suspense fallback={null}>
        <OfflineIndicator />
        <InstallPrompt />
      </Suspense>
    </div>
  );
}
