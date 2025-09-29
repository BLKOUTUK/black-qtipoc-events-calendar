import React from 'react';
import { Calendar, MapPin, ExternalLink, Clock, DollarSign, User } from 'lucide-react';
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

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getSourceColor = (source: string) => {
    const colors = {
      eventbrite: 'bg-orange-100 text-orange-800',
      community: 'bg-purple-100 text-purple-800',
      outsavvy: 'bg-teal-100 text-teal-800',
      facebook: 'bg-blue-100 text-blue-800'
    };
    return colors[source as keyof typeof colors] || 'bg-gray-100 text-gray-800';
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
    <div className="bg-liberation-black-power border border-liberation-sovereignty-gold/20 rounded-lg shadow-lg overflow-hidden hover:shadow-xl hover:border-liberation-sovereignty-gold/40 transition-all duration-300">
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
          <h3 className="text-xl font-bold text-liberation-sovereignty-gold leading-tight">{event.name}</h3>
          {!event.image_url && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSourceColor(event.source)} ml-2`}>
              {event.source}
            </span>
          )}
        </div>

        <p className="text-liberation-silver mb-4 line-clamp-2">{event.description}</p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-liberation-silver/80">
            <Calendar className="w-4 h-4 mr-2 text-blkout-primary" />
            <span>{formatDate(event.event_date)} at {formatTime(event.event_date)}</span>
          </div>
          
          <div className="flex items-center text-sm text-liberation-silver/80">
            <MapPin className="w-4 h-4 mr-2 text-blkout-accent" />
            <span>{locationStr}</span>
          </div>

          <div className="flex items-center text-sm text-liberation-silver/80">
            <User className="w-4 h-4 mr-2 text-blkout-warm" />
            <span>{event.organizer_name || 'Unknown Organizer'}</span>
          </div>

          {event.price && (
            <div className="flex items-center text-sm text-liberation-silver/80">
              <DollarSign className="w-4 h-4 mr-2 text-blkout-secondary" />
              <span>{event.price}</span>
            </div>
          )}
        </div>

        {event.tags && event.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {event.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                #{tag}
              </span>
            ))}
            {event.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                +{event.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              onClick={addToCalendar}
              className="flex items-center px-3 py-2 bg-blkout-primary text-white text-sm rounded-lg hover:bg-blkout-warm transition-colors duration-200"
              aria-label="Add to calendar"
            >
              <Calendar className="w-4 h-4 mr-1" />
              Add to Calendar
            </button>
            
            {event.source_url && (
              <a
                href={event.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors duration-200"
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
                className="px-3 py-1 bg-blkout-accent text-white text-sm rounded hover:bg-blkout-accent/80 transition-colors duration-200"
              >
                Approve
              </button>
              <button
                onClick={() => onReject?.(event.id)}
                className="px-3 py-1 bg-blkout-primary text-white text-sm rounded hover:bg-blkout-warm transition-colors duration-200"
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