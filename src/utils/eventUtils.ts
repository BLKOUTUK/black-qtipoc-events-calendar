import { Event } from '../types';

export const sanitizeEvents = (events: (Event | null | undefined)[]): Event[] => {
  return (
    events
      // 1. Filter out any null or undefined event objects
      .filter((event): event is Event => !!event)
      // 2. Map over the valid events to sanitize and provide defaults
      .map((event, index) => {
        const nowISO = new Date().toISOString();
        const startDate = event.start_date || event.event_date || nowISO;
        const title = event.title || event.name || 'Untitled Event';

        return {
          // Spread the original event to preserve all its properties
          ...event,

          // Provide sensible defaults for required fields to ensure type safety
          id: event.id || `temp-id-${index}`,
          title: title,
          description: event.description || '',
          start_date: startDate,
          end_date: event.end_date || startDate,
          location: event.location || 'TBA',
          event_type: event.event_type || 'meetup',
          organizer_id: event.organizer_id || 'unknown-organizer',
          registration_required: event.registration_required ?? false,
          cost: event.cost ?? 0,
          tags: event.tags || [],
          status: event.status || 'published',
          created_at: event.created_at || nowISO,
          updated_at: event.updated_at || nowISO,

          // Ensure legacy/computed fields are consistent for rendering
          name: title,
          event_date: startDate,
          image_url: event.image_url || event.featured_image,
        };
      })
  );
};
