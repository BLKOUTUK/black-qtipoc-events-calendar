import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { SurfacePage } from './pages/SurfacePage';

const QuickAddEventPage = lazy(() => import('./pages/QuickAddEventPage').then((m) => ({ default: m.QuickAddEventPage })));

function LazyFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// Moderation lives on the Comms dashboard (Rob, 24 Oct 2026). server.ts redirects full page loads;
// this covers in-app navigation.
function CommsModerationRedirect() {
  window.location.replace('https://comms.blkoutuk.com/admin/events');
  return null;
}

function App() {
  return (
    <Suspense fallback={<LazyFallback />}>
      <Routes>
        <Route path="/" element={<SurfacePage />} />
        <Route path="/gatherings" element={<SurfacePage initialSection="gatherings" />} />
        <Route path="/openings" element={<SurfacePage initialSection="openings" />} />
        <Route path="/places" element={<SurfacePage initialSection="places" />} />
        <Route path="/openings/submit" element={<SurfacePage initialSection="openings" openOpeningForm />} />
        {/* Shareable event-submission links — SurfacePage itself detects these paths. */}
        <Route path="/submit" element={<SurfacePage />} />
        <Route path="/add" element={<SurfacePage />} />
        <Route path="/moderation" element={<CommsModerationRedirect />} />
        <Route path="/quick-add" element={<QuickAddEventPage />} />
      </Routes>
    </Suspense>
  );
}

export default App;
