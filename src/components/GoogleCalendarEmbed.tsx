import React from 'react';
import { Calendar, ExternalLink } from 'lucide-react';
import { googleCalendarService } from '../services/googleCalendarService';

interface GoogleCalendarEmbedProps {
  calendarId?: string;
  height?: string;
  title?: string;
  showInNewTab?: boolean;
}

export const GoogleCalendarEmbed: React.FC<GoogleCalendarEmbedProps> = ({
  calendarId,
  height = '600px',
  title = 'BLKOUT Community Events Calendar',
  showInNewTab = true
}) => {
  const embedURL = googleCalendarService.generateEmbedURL(calendarId);
  const publicCalendarURL = `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(calendarId || import.meta.env.VITE_GOOGLE_CALENDAR_ID || 'primary')}&ctz=Europe/London`;

  return (
    <div className="bg-gray-800 border border-yellow-500/30 rounded-lg overflow-hidden shadow-xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-600 to-amber-500 p-4 flex items-center justify-between">
        <div className="flex items-center">
          <Calendar className="w-6 h-6 text-gray-900 mr-3" />
          <div>
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-800">View all upcoming community events</p>
          </div>
        </div>
        {showInNewTab && (
          <a
            href={publicCalendarURL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center px-4 py-2 bg-gray-900 text-yellow-500 rounded-lg hover:bg-gray-800 transition-colors duration-200 font-medium text-sm"
            title="Open in Google Calendar"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open in Google Calendar
          </a>
        )}
      </div>

      {/* Calendar Embed */}
      <div className="relative" style={{ height }}>
        <iframe
          src={embedURL}
          style={{ border: 0, width: '100%', height: '100%' }}
          frameBorder="0"
          scrolling="no"
          title={title}
          className="rounded-b-lg"
        />
      </div>

      {/* Footer with Subscribe Options */}
      <div className="bg-gray-700 p-4 border-t border-gray-600">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-300">
            <p className="font-medium text-yellow-500 mb-1">Subscribe to stay updated</p>
            <p className="text-xs">Add this calendar to your Google Calendar, Apple Calendar, or Outlook</p>
          </div>
          <a
            href={`https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(calendarId || import.meta.env.VITE_GOOGLE_CALENDAR_ID || 'primary')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center px-4 py-2 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-400 transition-colors duration-200 font-medium text-sm whitespace-nowrap"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Subscribe
          </a>
        </div>
      </div>
    </div>
  );
};
