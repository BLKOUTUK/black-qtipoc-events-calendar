/**
 * Notification Preferences Component
 * Allows users to manage push notification settings
 *
 * Liberation Feature: User-controlled communication preferences
 */

import { useState, useEffect } from 'react';
import { Bell, BellOff, Calendar, Newspaper, Users, Clock, Loader2 } from 'lucide-react';

const IVOR_API = import.meta.env.VITE_IVOR_API_URL || 'https://ivor.blkoutuk.cloud';

interface NotificationPrefs {
  events: boolean;
  news: boolean;
  community: boolean;
  reminders: boolean;
}

interface NotificationPreferencesProps {
  onClose?: () => void;
}

export function NotificationPreferences({ onClose }: NotificationPreferencesProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<NotificationPrefs>({
    events: true,
    news: true,
    community: true,
    reminders: true
  });

  useEffect(() => {
    checkNotificationSupport();
  }, []);

  const checkNotificationSupport = async () => {
    setIsLoading(true);

    // Check if push notifications are supported
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setIsSupported(false);
      setIsLoading(false);
      return;
    }

    setIsSupported(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        setIsSubscribed(true);
        // Load preferences from API
        await loadPreferences(subscription.endpoint);
      }
    } catch (err) {
      console.error('[Notifications] Check support error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPreferences = async (endpoint: string) => {
    try {
      const response = await fetch(
        `${IVOR_API}/api/notifications/preferences?endpoint=${encodeURIComponent(endpoint)}`
      );
      const data = await response.json();

      if (data.success && data.preferences) {
        setPreferences(data.preferences);
      }
    } catch (err) {
      console.error('[Notifications] Load preferences error:', err);
    }
  };

  const handleSubscribe = async () => {
    setError(null);
    setIsSaving(true);

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        setError('Notification permission denied. Please enable in browser settings.');
        setIsSaving(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;

      // Create subscription (you'd normally use your VAPID public key)
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
        )
      });

      // Register with IVOR
      const response = await fetch(`${IVOR_API}/api/notifications/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          preferences
        })
      });

      const data = await response.json();

      if (data.success) {
        setIsSubscribed(true);
      } else {
        throw new Error(data.error || 'Failed to subscribe');
      }
    } catch (err: any) {
      console.error('[Notifications] Subscribe error:', err);
      setError(err.message || 'Failed to enable notifications');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnsubscribe = async () => {
    setError(null);
    setIsSaving(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from push
        await subscription.unsubscribe();

        // Remove from IVOR
        await fetch(`${IVOR_API}/api/notifications/unsubscribe`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint })
        });
      }

      setIsSubscribed(false);
    } catch (err: any) {
      console.error('[Notifications] Unsubscribe error:', err);
      setError(err.message || 'Failed to disable notifications');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreferenceChange = async (key: keyof NotificationPrefs) => {
    const newPreferences = {
      ...preferences,
      [key]: !preferences[key]
    };
    setPreferences(newPreferences);

    if (isSubscribed) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
          await fetch(`${IVOR_API}/api/notifications/preferences`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              endpoint: subscription.endpoint,
              preferences: newPreferences
            })
          });
        }
      } catch (err) {
        console.error('[Notifications] Save preferences error:', err);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-white/60" />
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="p-6 text-center">
        <BellOff className="w-12 h-12 mx-auto text-white/40 mb-4" />
        <h3 className="text-white font-semibold mb-2">
          Notifications Not Supported
        </h3>
        <p className="text-white/60 text-sm">
          Your browser doesn't support push notifications.
          Try using Chrome, Firefox, or Safari on mobile.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="w-6 h-6 text-yellow-500" />
        <h3 className="text-white font-bold text-lg">
          Notification Settings
        </h3>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
          {error}
        </div>
      )}

      {!isSubscribed ? (
        <div className="text-center py-4">
          <p className="text-white/70 mb-4">
            Enable notifications to stay updated on events and community news.
          </p>
          <button
            onClick={handleSubscribe}
            disabled={isSaving}
            className="px-6 py-3 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Bell className="w-5 h-5" />
            )}
            Enable Notifications
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-white/60 text-sm mb-4">
            Choose what notifications you'd like to receive:
          </p>

          <PreferenceToggle
            icon={<Calendar className="w-5 h-5" />}
            label="Event Updates"
            description="New events and changes"
            checked={preferences.events}
            onChange={() => handlePreferenceChange('events')}
          />

          <PreferenceToggle
            icon={<Newspaper className="w-5 h-5" />}
            label="News Updates"
            description="New stories and articles"
            checked={preferences.news}
            onChange={() => handlePreferenceChange('news')}
          />

          <PreferenceToggle
            icon={<Users className="w-5 h-5" />}
            label="Community"
            description="Community announcements"
            checked={preferences.community}
            onChange={() => handlePreferenceChange('community')}
          />

          <PreferenceToggle
            icon={<Clock className="w-5 h-5" />}
            label="Event Reminders"
            description="Reminders before events start"
            checked={preferences.reminders}
            onChange={() => handlePreferenceChange('reminders')}
          />

          <div className="pt-4 border-t border-white/10">
            <button
              onClick={handleUnsubscribe}
              disabled={isSaving}
              className="text-red-400 hover:text-red-300 text-sm flex items-center gap-2"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <BellOff className="w-4 h-4" />
              )}
              Disable all notifications
            </button>
          </div>
        </div>
      )}

      {onClose && (
        <button
          onClick={onClose}
          className="mt-6 w-full py-2 text-white/60 hover:text-white text-sm transition-colors"
        >
          Close
        </button>
      )}
    </div>
  );
}

interface PreferenceToggleProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}

function PreferenceToggle({ icon, label, description, checked, onChange }: PreferenceToggleProps) {
  return (
    <button
      onClick={onChange}
      className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors text-left"
    >
      <div className={`${checked ? 'text-yellow-500' : 'text-white/40'}`}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-white font-medium">{label}</div>
        <div className="text-white/60 text-sm">{description}</div>
      </div>
      <div
        className={`w-10 h-6 rounded-full transition-colors ${
          checked ? 'bg-yellow-500' : 'bg-white/20'
        } relative`}
      >
        <div
          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-1'
          }`}
        />
      </div>
    </button>
  );
}

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default NotificationPreferences;
