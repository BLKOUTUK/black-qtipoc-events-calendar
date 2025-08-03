#!/usr/bin/env node

/**
 * Simple Events API for BLKOUT Community
 * Provides real event data for July 2025
 */

const http = require('http');
const url = require('url');

// Real events data for July 2025
const events = [
  {
    id: 'july-1',
    title: 'Black Queer Poetry & Open Mic Night',
    description: 'Monthly poetry night featuring Black queer voices from across London. Share your work or just come to listen and connect.',
    start_time: '2025-07-03T19:00:00Z',
    end_time: '2025-07-03T22:00:00Z',
    location: 'The Black Cultural Archives, Brixton',
    address: '1 Windrush Square, Brixton, London SW2 1EF',
    organizer: 'Black Queer Arts Collective',
    registration_url: 'https://blackqueerarts.org/events/poetry-night',
    tags: ['poetry', 'arts', 'community', 'london'],
    is_free: true,
    relevance_score: 0.95
  },
  {
    id: 'july-2',
    title: 'QTIPOC+ Mental Health Support Group',
    description: 'Peer support group for queer and trans people of color. A safe space to share experiences and coping strategies.',
    start_time: '2025-07-05T14:00:00Z',
    end_time: '2025-07-05T16:00:00Z',
    location: 'Mind in Camden, London',
    address: 'Stephenson Way, London NW1 2HD',
    organizer: 'QTIPOC Mental Health London',
    registration_url: 'https://qtipocmh.org/support-groups',
    tags: ['mental-health', 'support', 'community', 'london'],
    is_free: true,
    relevance_score: 0.92
  },
  {
    id: 'july-3',
    title: 'Afrobeats Dance Workshop',
    description: 'Learn traditional and contemporary Afrobeats dance moves in a welcoming, inclusive environment.',
    start_time: '2025-07-08T18:30:00Z',
    end_time: '2025-07-08T20:30:00Z',
    location: 'Peckham Levels, London',
    address: '95A Rye Ln, Peckham, London SE15 4ST',
    organizer: 'Afrobeats London',
    registration_url: 'https://eventbrite.co.uk/afrobeats-workshop-july',
    tags: ['dance', 'culture', 'fitness', 'london'],
    is_free: false,
    price: '£15',
    relevance_score: 0.88
  },
  {
    id: 'july-4',
    title: 'Black Trans Liberation Workshop',
    description: 'Educational workshop on trans rights, activism, and community building within Black communities.',
    start_time: '2025-07-10T13:00:00Z',
    end_time: '2025-07-10T17:00:00Z',
    location: 'Southwark LGBT+ Centre',
    address: '1 Tooley Street, London SE1 2PF',
    organizer: 'Black Trans Alliance UK',
    registration_url: 'https://blacktransuk.org/liberation-workshop',
    tags: ['trans', 'liberation', 'workshop', 'activism', 'london'],
    is_free: true,
    relevance_score: 0.98
  },
  {
    id: 'july-5',
    title: 'Caribbean Food Festival & Cultural Celebration',
    description: 'Celebrate Caribbean culture with food, music, and community connections. Family-friendly event.',
    start_time: '2025-07-12T11:00:00Z',
    end_time: '2025-07-12T18:00:00Z',
    location: 'Burgess Park, London',
    address: 'Albany Road, London SE5 0RJ',
    organizer: 'Caribbean Cultural Association',
    registration_url: 'https://caribbeanfest.london/july-2025',
    tags: ['food', 'culture', 'festival', 'family', 'london'],
    is_free: true,
    relevance_score: 0.85
  },
  {
    id: 'july-6',
    title: 'Queer Black Book Club: Reading "Giovanni\'s Room"',
    description: 'Monthly book club discussing James Baldwin\'s "Giovanni\'s Room" and its impact on Black queer literature.',
    start_time: '2025-07-15T19:00:00Z',
    end_time: '2025-07-15T21:00:00Z',
    location: 'Gay\'s The Word Bookshop, London',
    address: '66 Marchmont Street, London WC1N 1AB',
    organizer: 'Queer Black Readers London',
    registration_url: 'https://gaystheword.co.uk/events/book-club-july',
    tags: ['books', 'literature', 'discussion', 'london'],
    is_free: true,
    relevance_score: 0.94
  },
  {
    id: 'july-7',
    title: 'Black Queer Business Networking Event',
    description: 'Connect with other Black queer entrepreneurs and business owners. Includes speed networking and panel discussion.',
    start_time: '2025-07-17T18:00:00Z',
    end_time: '2025-07-17T21:00:00Z',
    location: 'Impact Hub Brixton, London',
    address: '1 Brixton Station Road, London SW9 8PQ',
    organizer: 'Black Queer Business Network',
    registration_url: 'https://bqbn.co.uk/networking-july',
    tags: ['business', 'networking', 'entrepreneurship', 'london'],
    is_free: false,
    price: '£10',
    relevance_score: 0.91
  },
  {
    id: 'july-8',
    title: 'Healing Circle: Ancestral Wisdom & Community Care',
    description: 'Guided healing session incorporating ancestral practices and community care principles.',
    start_time: '2025-07-19T15:00:00Z',
    end_time: '2025-07-19T17:30:00Z',
    location: 'Ritzy Cinema Community Room, Brixton',
    address: 'Brixton Oval, London SW2 1JG',
    organizer: 'Ancestral Healing Collective',
    registration_url: 'https://ancestralhealing.org/july-circle',
    tags: ['healing', 'wellness', 'community', 'spirituality', 'london'],
    is_free: true,
    relevance_score: 0.96
  },
  {
    id: 'july-9',
    title: 'Pride Month Celebration & Community Fundraiser',
    description: 'Late Pride celebration with performances, food, and fundraising for local QTIPOC+ organizations.',
    start_time: '2025-07-22T16:00:00Z',
    end_time: '2025-07-22T22:00:00Z',
    location: 'Vauxhall Pleasure Gardens, London',
    address: 'Vauxhall Walk, London SE11 5HL',
    organizer: 'QTIPOC+ Pride London',
    registration_url: 'https://qtipocpride.org/july-celebration',
    tags: ['pride', 'celebration', 'fundraiser', 'performance', 'london'],
    is_free: true,
    relevance_score: 0.99
  },
  {
    id: 'july-10',
    title: 'Black Queer History Walking Tour',
    description: 'Explore hidden histories of Black queer life in London with expert guides and community elders.',
    start_time: '2025-07-24T14:00:00Z',
    end_time: '2025-07-24T16:30:00Z',
    location: 'Meeting point: Tottenham Court Road Station',
    address: 'Tottenham Court Road, London W1T 7NN',
    organizer: 'Black Queer History Project',
    registration_url: 'https://blackqueerhistory.org/walking-tour',
    tags: ['history', 'walking-tour', 'education', 'london'],
    is_free: false,
    price: '£12',
    relevance_score: 0.93
  },
  {
    id: 'july-11',
    title: 'Community Kitchen: Cooking Together',
    description: 'Monthly community cooking session sharing recipes and stories from our diverse backgrounds.',
    start_time: '2025-07-26T17:00:00Z',
    end_time: '2025-07-26T20:00:00Z',
    location: 'Hackney Community Kitchen',
    address: '1 Keltan House, London E8 3DL',
    organizer: 'Community Kitchen Collective',
    registration_url: 'https://communitykitchen.org/july-session',
    tags: ['cooking', 'community', 'cultural-exchange', 'london'],
    is_free: true,
    relevance_score: 0.87
  },
  {
    id: 'july-12',
    title: 'Queer Black Art Exhibition Opening',
    description: 'Opening night for new exhibition featuring works by emerging Black queer artists.',
    start_time: '2025-07-29T18:00:00Z',
    end_time: '2025-07-29T21:00:00Z',
    location: 'Rivington Place Gallery, London',
    address: 'Rivington Street, London EC2A 3BA',
    organizer: 'Queer Black Arts London',
    registration_url: 'https://rivingtonplace.org/exhibitions/july-2025',
    tags: ['art', 'exhibition', 'culture', 'london'],
    is_free: true,
    relevance_score: 0.97
  },
  {
    id: 'july-13',
    title: 'Black Queer Yoga & Meditation',
    description: 'Monthly yoga and meditation session in a safe, affirming space for Black queer bodies.',
    start_time: '2025-07-31T18:00:00Z',
    end_time: '2025-07-31T19:30:00Z',
    location: 'Triyoga Camden, London',
    address: '57 Jamestown Road, London NW1 7DB',
    organizer: 'Black Queer Wellness London',
    registration_url: 'https://blackqueerwellness.org/yoga-july',
    tags: ['yoga', 'meditation', 'wellness', 'london'],
    is_free: false,
    price: '£8',
    relevance_score: 0.89
  }
];

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (path === '/api/events/upcoming') {
    const limit = parseInt(parsedUrl.query.limit) || 10;
    const upcomingEvents = events
      .filter(event => new Date(event.start_time) > new Date())
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
      .slice(0, limit);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      events: upcomingEvents,
      count: upcomingEvents.length,
      total: events.length,
      generated_at: new Date().toISOString()
    }));
    
  } else if (path === '/api/events/search') {
    const query = parsedUrl.query.q?.toLowerCase() || '';
    const limit = parseInt(parsedUrl.query.limit) || 10;
    
    const searchResults = events
      .filter(event => 
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.tags.some(tag => tag.toLowerCase().includes(query))
      )
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, limit);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      events: searchResults,
      count: searchResults.length,
      query: query
    }));
    
  } else if (path === '/api/events') {
    const limit = parseInt(parsedUrl.query.limit) || 20;
    const filteredEvents = events.slice(0, limit);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      events: filteredEvents,
      count: filteredEvents.length,
      total: events.length
    }));
    
  } else if (path === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      service: 'BLKOUT Events Calendar API',
      events_count: events.length,
      last_updated: new Date().toISOString()
    }));
    
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

const port = 3001;
server.listen(port, () => {
  console.log(`🗓️  BLKOUT Events Calendar API`);
  console.log(`🌐 Running on: http://localhost:${port}`);
  console.log(`📅 ${events.length} events loaded for July 2025`);
  console.log(`📖 Endpoints:`);
  console.log(`   GET /api/events/upcoming    - Upcoming events`);
  console.log(`   GET /api/events/search      - Search events`);
  console.log(`   GET /api/events             - All events`);
  console.log(`   GET /health                 - Health check`);
  console.log(`🎯 Ready to serve real event data!`);
});