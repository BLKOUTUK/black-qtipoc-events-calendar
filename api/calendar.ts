import type { VercelRequest, VercelResponse } from '@vercel/node';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
      const supabaseUrl = 'https://bgjengudzfickgomjqmz.supabase.co';
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnamVuZ3VkemZpY2tnb21qcW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MTI3NjcsImV4cCI6MjA3MTE4ODc2N30.kYQ2oFuQBGmu4V_dnj_1zDMDVsd-qpDZJwNvswzO6M0';

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

      const events = await response.json();

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
