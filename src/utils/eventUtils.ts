import { Event } from '../types';

export const sanitizeEvents = (events: (Event | null | undefined)[]): Event[] => {
  return events.map((event, index) => {
    if (!event) return null;
    const defaultDate = new Date();
    return {
      id: event.id || `temp-id-${index}`,
      title: event.title || 'Untitled Event',
      date: event.date || event.event_date || defaultDate,
      location: event.location || 'TBA',
      description: event.description || '',
      // Ensure all other required Event properties are included with default values
      event_date: event.event_date || defaultDate,
      start_time: event.start_time || '',
      end_time: event.end_time || '',
      organizer: event.organizer || 'Unknown',
      url: event.url || '',
      image_url: event.image_url || '',
      tags: event.tags || [],
      status: event.status || 'pending',
    };
  }).filter((event): event is Event => event !== null);
};
