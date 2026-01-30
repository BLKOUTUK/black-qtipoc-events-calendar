import type { Request, Response } from 'express';

// Simple iCal generator for events
function generateICalEvent(event: any): string {
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const startDate = new Date(event.date || event.event_date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  // Generate unique ID based on event ID
  const uid = `${event.id}@events-blkout.vercel.app`;

  // Escape special characters in text fields
  const escapeText = (text: string) => {
    return (text || '')
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  };

  const title = escapeText(event.title || event.name || 'Event');
  const description = escapeText(event.description || '');
  const location = escapeText(event.location || '');
  const organizer = escapeText(event.organizer_name || event.organizer || '');

  return `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${now}
DTSTART:${startDate}
DTEND:${startDate}
SUMMARY:${title}
DESCRIPTION:${description}${organizer ? `\\nOrganizer: ${organizer}` : ''}
LOCATION:${location}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT`;
}

export default async function handler(req: Request, res: Response) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      // Fetch approved events from Supabase
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
      const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

      const todayDate = new Date().toISOString().split('T')[0];
      const url = `${supabaseUrl}/rest/v1/events?status=eq.approved&date=gte.${todayDate}&select=id,title,date,description,location,organizer&order=date.asc`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch events:', response.status, response.statusText);
        return res.status(500).send('Failed to fetch events');
      }

      const rawEvents = await response.json();

      // Deduplicate by title+date (scrapers insert same event with different IDs)
      const events = Array.from(
        new Map(rawEvents.map((e: any) => [`${(e.title || '').toLowerCase().trim()}|${e.date || ''}`, e])).values()
      );

      // Generate iCal format
      const icalEvents = events.map(generateICalEvent).join('\n');

      const icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//BLKOUT Events//BLKOUT Events Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:BLKOUT Liberation Events
X-WR-TIMEZONE:Europe/London
X-WR-CALDESC:Community-curated Black queer liberation events
${icalEvents}
END:VCALENDAR`;

      // Set headers for iCal download
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="blkout-events.ics"');

      return res.status(200).send(icalContent);
    } catch (error) {
      console.error('Error generating calendar:', error);
      return res.status(500).send('Internal server error');
    }
  }

  return res.status(405).send('Method not allowed');
}
