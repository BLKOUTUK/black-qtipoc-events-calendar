import React from 'react';
import { Calendar, MapPin, ExternalLink, Clock, User } from 'lucide-react';
import { Event } from '../types';

interface EventCardProps {
  event: Event;
  showActions?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ 
  event, 
  showActions = false, 
  onApprove, 
  onReject 
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString?: string | null) => {
    if (!timeString) return 'Time TBA';

    // Parse time string (format: HH:MM:SS)
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes), 0);

    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getSourceColor = (source: string) => {
    const colors = {
      eventbrite: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
      community: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
      outsavvy: 'bg-teal-500/20 text-teal-300 border border-teal-500/30',
      facebook: 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
    };
    return colors[source as keyof typeof colors] || 'bg-gray-500/20 text-gray-300 border border-gray-500/30';
  };

  const addToCalendar = () => {
    const startDate = new Date(event.event_date);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // Default 2 hours
    
    const formatDateForCalendar = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const locationStr = typeof event.location === 'string' 
      ? event.location 
      : JSON.stringify(event.location);

    const calendarData = {
      text: event.name,
      dates: `${formatDateForCalendar(startDate)}/${formatDateForCalendar(endDate)}`,
      details: event.description,
      location: locationStr
    };

    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(calendarData.text)}&dates=${calendarData.dates}&details=${encodeURIComponent(calendarData.details)}&location=${encodeURIComponent(calendarData.location)}`;
    window.open(calendarUrl, '_blank');
  };

  const locationStr = typeof event.location === 'string' 
    ? event.location 
    : JSON.stringify(event.location);

  return (
    <div className="bg-gray-800 border border-yellow-500/30 rounded-lg shadow-lg overflow-hidden hover:shadow-xl hover:border-yellow-500/50 transition-all duration-300">
      {event.image_url && (
        <div className="relative h-48 overflow-hidden">
          <img 
            src={event.image_url} 
            alt={event.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 right-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSourceColor(event.source)}`}>
              {event.source}
            </span>
          </div>
        </div>
      )}
      
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-bold text-yellow-500 leading-tight">{event.name}</h3>
          {!event.image_url && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSourceColor(event.source)} ml-2`}>
              {event.source}
            </span>
          )}
        </div>

        <p className="text-gray-200 mb-4 line-clamp-2">{event.description}</p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-300">
            <Calendar className="w-4 h-4 mr-2 text-yellow-500" />
            <span>{formatDate(event.event_date)} at {formatTime(event.start_time)}</span>
          </div>

          <div className="flex items-center text-sm text-gray-300">
            <MapPin className="w-4 h-4 mr-2 text-yellow-500" />
            <span>{locationStr}</span>
          </div>

          <div className="flex items-center text-sm text-gray-300">
            <User className="w-4 h-4 mr-2 text-yellow-500" />
            <span>{event.organizer_name || 'Unknown Organizer'}</span>
          </div>
        </div>

        {event.tags && event.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {event.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="px-2 py-1 bg-yellow-500/20 text-yellow-500 text-xs rounded-full border border-yellow-500/30">
                #{tag}
              </span>
            ))}
            {event.tags.length > 3 && (
              <span className="px-2 py-1 bg-yellow-500/20 text-yellow-500 text-xs rounded-full border border-yellow-500/30">
                +{event.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              onClick={addToCalendar}
              className="flex items-center px-3 py-2 bg-yellow-500 text-gray-900 text-sm rounded-lg hover:bg-yellow-400 transition-colors duration-200 font-medium"
              aria-label="Add to calendar"
            >
              <Calendar className="w-4 h-4 mr-1" />
              Add to Calendar
            </button>
            
            {event.url && (
              <a
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-3 py-2 border border-gray-600 text-gray-200 text-sm rounded-lg hover:bg-gray-700 transition-colors duration-200"
                aria-label="View original event"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                View
              </a>
            )}
          </div>

          {showActions && (
            <div className="flex space-x-2">
              <button
                onClick={() => onApprove?.(event.id)}
                className="px-3 py-1 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-500 transition-colors duration-200"
              >
                Approve
              </button>
              <button
                onClick={() => onReject?.(event.id)}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-500 transition-colors duration-200"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};