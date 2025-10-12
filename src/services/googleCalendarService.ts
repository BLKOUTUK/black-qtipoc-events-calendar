import { Event } from '../types';
import { google } from 'googleapis';

// Google Calendar Configuration
const CALENDAR_ID = import.meta.env.VITE_GOOGLE_CALENDAR_ID || 'primary';
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const REDIRECT_URI = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';

interface CalendarEvent {
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  source?: {
    url: string;
    title: string;
  };
  colorId?: string;
}

class GoogleCalendarService {
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;

  /**
   * Generate .ics file content for calendar export
   * This works universally without API calls
   */
  generateICSContent(event: Event): string {
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const escapeText = (text: string) => {
      return text.replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
    };

    const startDate = formatDate(event.event_date || event.start_date || new Date().toISOString());
    const endDate = event.end_date
      ? formatDate(event.end_date)
      : formatDate(new Date(new Date(startDate).getTime() + 2 * 60 * 60 * 1000).toISOString()); // +2 hours default

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//BLKOUT Events//Events Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${event.id}@blkout.org
DTSTAMP:${formatDate(new Date().toISOString())}
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:${escapeText(event.name || event.title || '')}
DESCRIPTION:${escapeText(event.description || '')}${event.source_url ? '\\n\\nMore info: ' + event.source_url : ''}
LOCATION:${escapeText(typeof event.location === 'string' ? event.location : event.address || 'TBD')}
ORGANIZER;CN=${escapeText(event.organizer_name || 'BLKOUT')}:mailto:events@blkout.org
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;

    return icsContent;
  }

  /**
   * Download ICS file for a single event
   * Works on all devices - iOS, Android, Desktop
   */
  downloadICSFile(event: Event): void {
    const icsContent = this.generateICSContent(event);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    const fileName = `${(event.name || event.title || 'event').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;

    link.href = window.URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }

  /**
   * Generate Google Calendar "Add to Calendar" URL
   * Opens Google Calendar with pre-filled event details
   */
  generateGoogleCalendarURL(event: Event): string {
    const formatDate = (dateStr: string) => {
      return new Date(dateStr).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const startDate = formatDate(event.event_date || event.start_date || new Date().toISOString());
    const endDate = event.end_date
      ? formatDate(event.end_date)
      : formatDate(new Date(new Date(startDate).getTime() + 2 * 60 * 60 * 1000).toISOString());

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.name || event.title || '',
      dates: `${startDate}/${endDate}`,
      details: event.description + (event.source_url ? `\n\nMore info: ${event.source_url}` : ''),
      location: typeof event.location === 'string' ? event.location : event.address || '',
      trp: 'false'
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  /**
   * Open Google Calendar in new tab with event pre-filled
   */
  addToGoogleCalendar(event: Event): void {
    const url = this.generateGoogleCalendarURL(event);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  /**
   * Get OAuth2 access token
   * Required for admin features like syncing to public calendar
   */
  private async getAccessToken(): Promise<string | null> {
    // Check if we have a valid cached token
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    // Try to load from localStorage
    const storedToken = localStorage.getItem('google_calendar_token');
    const storedExpiry = localStorage.getItem('google_calendar_token_expiry');

    if (storedToken && storedExpiry && Date.now() < parseInt(storedExpiry)) {
      this.accessToken = storedToken;
      this.tokenExpiry = parseInt(storedExpiry);
      return this.accessToken;
    }

    // Need to get new token via OAuth2
    console.log('🔐 CALENDAR: Need new OAuth2 token for admin features');
    return null;
  }

  /**
   * Initiate OAuth2 flow for admin calendar sync
   * Opens popup window for Google authentication
   */
  async authenticateForSync(): Promise<boolean> {
    if (!CLIENT_ID) {
      throw new Error('Google Calendar Client ID not configured. Set VITE_GOOGLE_CLIENT_ID in .env');
    }

    try {
      const scope = 'https://www.googleapis.com/auth/calendar';
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `response_type=token&` +
        `prompt=consent`;

      const popup = window.open(authUrl, 'google-calendar-oauth', 'width=500,height=600');

      return new Promise((resolve, reject) => {
        const checkForToken = setInterval(() => {
          try {
            if (popup?.closed) {
              clearInterval(checkForToken);
              reject(new Error('OAuth2 popup was closed'));
              return;
            }

            if (popup?.location?.hash) {
              const hash = popup.location.hash.substring(1);
              const params = new URLSearchParams(hash);
              const accessToken = params.get('access_token');
              const expiresIn = params.get('expires_in');

              if (accessToken) {
                // Store token
                this.accessToken = accessToken;
                this.tokenExpiry = Date.now() + (parseInt(expiresIn || '3600') * 1000);
                localStorage.setItem('google_calendar_token', accessToken);
                localStorage.setItem('google_calendar_token_expiry', this.tokenExpiry.toString());

                popup.close();
                clearInterval(checkForToken);
                console.log('✅ CALENDAR: OAuth2 authentication successful');
                resolve(true);
              }
            }
          } catch (e) {
            // Cross-origin error expected until redirect
          }
        }, 500);

        // Timeout after 2 minutes
        setTimeout(() => {
          clearInterval(checkForToken);
          if (!popup?.closed) popup?.close();
          reject(new Error('OAuth2 timeout'));
        }, 120000);
      });
    } catch (error) {
      console.error('❌ CALENDAR: OAuth2 flow failed:', error);
      return false;
    }
  }

  /**
   * Sync event to public BLKOUT Google Calendar
   * Requires admin authentication
   */
  async syncEventToCalendar(event: Event): Promise<boolean> {
    const token = await this.getAccessToken();

    if (!token) {
      console.log('🔐 CALENDAR: No access token, initiating authentication...');
      const authenticated = await this.authenticateForSync();
      if (!authenticated) {
        throw new Error('Failed to authenticate with Google Calendar');
      }
      return this.syncEventToCalendar(event); // Retry after auth
    }

    try {
      const calendarEvent: CalendarEvent = {
        summary: event.name || event.title || '',
        description: event.description +
          (event.source_url ? `\n\nMore info: ${event.source_url}` : '') +
          '\n\n🔗 Powered by BLKOUT Events: https://events.blkout.org',
        location: typeof event.location === 'string' ? event.location : event.address || '',
        start: {
          dateTime: event.event_date || event.start_date || new Date().toISOString(),
          timeZone: 'Europe/London'
        },
        end: {
          dateTime: event.end_date ||
            new Date(new Date(event.event_date || event.start_date).getTime() + 2 * 60 * 60 * 1000).toISOString(),
          timeZone: 'Europe/London'
        },
        source: event.source_url ? {
          url: event.source_url,
          title: event.organizer_name || 'Event Details'
        } : undefined,
        colorId: '9' // Blue color for BLKOUT events
      };

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(calendarEvent)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Calendar API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const result = await response.json();
      console.log('✅ CALENDAR: Event synced to Google Calendar:', result.htmlLink);
      return true;

    } catch (error) {
      console.error('❌ CALENDAR: Failed to sync event:', error);
      throw error;
    }
  }

  /**
   * Sync multiple events to calendar in batch
   */
  async syncEventsToCalendar(events: Event[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const event of events) {
      try {
        await this.syncEventToCalendar(event);
        success++;
      } catch (error) {
        console.error(`Failed to sync event ${event.id}:`, error);
        failed++;
      }
    }

    return { success, failed };
  }

  /**
   * Generate embeddable calendar iframe URL
   */
  generateEmbedURL(calendarId: string = CALENDAR_ID): string {
    const params = new URLSearchParams({
      src: calendarId,
      ctz: 'Europe/London',
      mode: 'AGENDA',
      showTitle: '1',
      showNav: '1',
      showDate: '1',
      showPrint: '0',
      showTabs: '1',
      showCalendars: '0',
      showTz: '0',
      bgcolor: '%23111827', // Dark gray background
      color: '%23EAB308' // Yellow accent (BLKOUT brand color)
    });

    return `https://calendar.google.com/calendar/embed?${params.toString()}`;
  }

  /**
   * Check if user is authenticated for admin features
   */
  isAuthenticated(): boolean {
    return this.accessToken !== null &&
           this.tokenExpiry !== null &&
           Date.now() < this.tokenExpiry;
  }

  /**
   * Sign out from calendar sync
   */
  signOut(): void {
    this.accessToken = null;
    this.tokenExpiry = null;
    localStorage.removeItem('google_calendar_token');
    localStorage.removeItem('google_calendar_token_expiry');
  }
}

export const googleCalendarService = new GoogleCalendarService();
