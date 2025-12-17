/**
 * PWA Install Prompt Component
 * Shows a customized install prompt for BLKOUT Events
 *
 * Liberation Feature: Enables offline access to community events
 */

import { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed recently
    const dismissedAt = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Show prompt after user has been on the site for a bit
      setTimeout(() => {
        setShowPrompt(true);
      }, 5000);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
    } catch (error) {
      console.error('[PWA] Install error:', error);
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-in slide-in-from-bottom duration-300">
      <div className="bg-black border border-white/20 rounded-lg shadow-xl p-4">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-white/60 hover:text-white transition-colors"
          aria-label="Dismiss"
        >
          <X size={18} />
        </button>

        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
            <Smartphone className="text-white" size={24} />
          </div>

          <div className="flex-1 pr-4">
            <h3 className="text-white font-semibold text-sm">
              Install BLKOUT Events
            </h3>
            <p className="text-white/70 text-xs mt-1">
              Access events offline and get notifications for community gatherings
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleDismiss}
            className="flex-1 px-3 py-2 text-white/70 hover:text-white text-sm transition-colors"
          >
            Not now
          </button>
          <button
            onClick={handleInstall}
            className="flex-1 px-3 py-2 bg-white text-black rounded-md font-medium text-sm hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
          >
            <Download size={16} />
            Install
          </button>
        </div>

        <p className="text-white/40 text-xs text-center mt-3">
          🏴‍☠️ Liberation technology for your pocket
        </p>
      </div>
    </div>
  );
}

export default InstallPrompt;
