/**
 * Offline Indicator Component
 * Shows connectivity status for BLKOUT Events
 *
 * Liberation Feature: Transparent communication about app state
 */

import { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsReconnecting(false);
      // Show "back online" briefly
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!navigator.onLine) {
      setShowBanner(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    setIsReconnecting(true);

    try {
      // Try to fetch a small resource to check connectivity
      await fetch('/favicon-blkout.svg', { cache: 'no-store' });
      setIsOnline(true);
      setShowBanner(false);
    } catch {
      setIsOnline(false);
    } finally {
      setIsReconnecting(false);
    }
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 px-4 py-2 flex items-center justify-center gap-2 text-sm transition-colors ${
        isOnline
          ? 'bg-green-600 text-white'
          : 'bg-yellow-500 text-black'
      }`}
    >
      {isOnline ? (
        <>
          <Wifi size={16} />
          <span>Back online - events will refresh automatically</span>
        </>
      ) : (
        <>
          <WifiOff size={16} />
          <span>You're offline - viewing cached events</span>
          <button
            onClick={handleRetry}
            disabled={isReconnecting}
            className="ml-2 px-2 py-1 bg-black/20 rounded text-xs hover:bg-black/30 transition-colors flex items-center gap-1 disabled:opacity-50"
          >
            <RefreshCw size={12} className={isReconnecting ? 'animate-spin' : ''} />
            Retry
          </button>
        </>
      )}
    </div>
  );
}

export default OfflineIndicator;
