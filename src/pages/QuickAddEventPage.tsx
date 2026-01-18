import React, { useState } from 'react';
import { Plus, ExternalLink } from 'lucide-react';

interface QuickEvent {
  title: string;
  date: string;
  url: string;
  location: string;
  description: string;
  organizer: string;
  tags: string;
}

export const QuickAddEventPage: React.FC = () => {
  // Pre-fill from URL parameters (for bookmarklet)
  const urlParams = new URLSearchParams(window.location.search);
  const [event, setEvent] = useState<QuickEvent>({
    title: urlParams.get('title') || '',
    date: urlParams.get('date') || '',
    url: urlParams.get('url') || '',
    location: urlParams.get('location') || '',
    description: urlParams.get('description') || '',
    organizer: urlParams.get('organizer') || '',
    tags: urlParams.get('tags') || 'lgbtq, community'
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          title: event.title,
          date: event.date,
          url: event.url,
          location: event.location,
          description: event.description,
          organizer: event.organizer,
          tags: event.tags.split(',').map(t => t.trim()),
          status: 'approved', // Auto-approve admin submissions
          source: 'admin-quick-add',
          created_at: new Date().toISOString()
        })
      });

      if (response.ok) {
        setStatus('success');
        setMessage('Event added successfully!');
        // Reset form
        setEvent({
          title: '',
          date: '',
          url: '',
          location: '',
          description: '',
          organizer: '',
          tags: 'lgbtq, community'
        });
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        throw new Error('Failed to add event');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Error adding event. Please try again.');
    }
  };

  const fillFromURL = () => {
    const url = event.url;
    if (url.includes('outsavvy.com')) {
      // Try to parse Outsavvy URL format
      const matches = url.match(/\/event\/([^\/]+)/);
      if (matches) {
        setEvent(prev => ({
          ...prev,
          title: matches[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        }));
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">🏴‍☠️ Quick Add Event</h1>
          <p className="text-gray-400">Fast event submission for admins</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* URL Field with Auto-fill */}
          <div>
            <label className="block text-sm font-medium mb-1">Event URL *</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={event.url}
                onChange={(e) => setEvent({ ...event, url: e.target.value })}
                onBlur={fillFromURL}
                className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-yellow-500"
                placeholder="https://www.outsavvy.com/event/..."
                required
              />
              <button
                type="button"
                onClick={fillFromURL}
                className="px-4 py-2 bg-gray-800 rounded hover:bg-gray-700"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input
              type="text"
              value={event.title}
              onChange={(e) => setEvent({ ...event, title: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-yellow-500"
              required
            />
          </div>

          {/* Date and Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date *</label>
              <input
                type="date"
                value={event.date}
                onChange={(e) => setEvent({ ...event, date: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-yellow-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Location *</label>
              <input
                type="text"
                value={event.location}
                onChange={(e) => setEvent({ ...event, location: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-yellow-500"
                placeholder="London"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">Description *</label>
            <textarea
              value={event.description}
              onChange={(e) => setEvent({ ...event, description: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-yellow-500 h-24"
              required
            />
          </div>

          {/* Organizer and Tags */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Organizer *</label>
              <input
                type="text"
                value={event.organizer}
                onChange={(e) => setEvent({ ...event, organizer: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-yellow-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tags</label>
              <input
                type="text"
                value={event.tags}
                onChange={(e) => setEvent({ ...event, tags: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-yellow-500"
                placeholder="lgbtq, community, party"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={status === 'loading'}
              className="flex-1 bg-yellow-500 text-black font-semibold py-3 rounded hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {status === 'loading' ? 'Adding...' : 'Add Event'}
            </button>
          </div>

          {/* Status Message */}
          {status !== 'idle' && (
            <div className={`p-4 rounded ${
              status === 'success' ? 'bg-green-900 text-green-100' :
              status === 'error' ? 'bg-red-900 text-red-100' :
              'bg-gray-800'
            }`}>
              {message}
            </div>
          )}
        </form>

        {/* Quick Tips */}
        <div className="mt-8 p-4 bg-gray-900 rounded">
          <h3 className="font-semibold mb-2">💡 Quick Tips:</h3>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Paste Outsavvy URL first - it'll try to auto-fill the title</li>
            <li>• Events are auto-approved for immediate visibility</li>
            <li>• Tags are comma-separated: "lgbtq, community, party"</li>
            <li>• Bookmark this page for quick access</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
