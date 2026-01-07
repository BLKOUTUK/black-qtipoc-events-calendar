/**
 * Add to Calendar Dropdown Component
 * Provides calendar integration options for events
 *
 * Liberation Feature: Helps community stay connected to gatherings
 */

import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Download, ExternalLink } from 'lucide-react';

const IVOR_API = import.meta.env.VITE_IVOR_API_URL || 'https://ivor.blkoutuk.cloud';

interface Event {
  id: string;
  title: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  description?: string;
}

interface AddToCalendarProps {
  event: Event;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'button' | 'icon' | 'text';
}

interface CalendarLinks {
  google: string;
  apple: string;
  outlook: string;
  yahoo: string;
  ics: string;
}

export function AddToCalendar({
  event,
  size = 'md',
  variant = 'button'
}: AddToCalendarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [links, setLinks] = useState<CalendarLinks | null>(null);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // CRITICAL: Safety check - don't render if event is invalid
  if (!event || !event.id) {
    return null;
  }

  // Fetch calendar links
  useEffect(() => {
    const fetchLinks = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${IVOR_API}/api/calendar/links/${event.id}`);
        const data = await response.json();
        if (data.success) {
          setLinks(data.links);
        }
      } catch (err) {
        console.error('[AddToCalendar] Failed to fetch links:', err);
        // Generate fallback links client-side
        setLinks(generateFallbackLinks(event));
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && !links) {
      fetchLinks();
    }
  }, [isOpen, event.id, links]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Generate fallback links client-side
  const generateFallbackLinks = (evt: Event): CalendarLinks => {
    const title = encodeURIComponent(evt.title);
    const startDate = evt.start_time ? new Date(evt.start_time) : new Date();
    const endDate = evt.end_time ? new Date(evt.end_time) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    const location = encodeURIComponent(evt.location || '');
    const description = encodeURIComponent(evt.description || '');

    // Format dates for Google Calendar
    const formatGoogleDate = (date: Date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const googleStart = formatGoogleDate(startDate);
    const googleEnd = formatGoogleDate(endDate);

    // Format dates for Outlook/Yahoo
    const formatOutlookDate = (date: Date) => date.toISOString();

    return {
      google: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${googleStart}/${googleEnd}&location=${location}&details=${description}`,
      apple: `${IVOR_API}/api/calendar/event/${evt.id}.ics`,
      outlook: `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${formatOutlookDate(startDate)}&enddt=${formatOutlookDate(endDate)}&location=${location}&body=${description}`,
      yahoo: `https://calendar.yahoo.com/?v=60&title=${title}&st=${googleStart}&et=${googleEnd}&in_loc=${location}&desc=${description}`,
      ics: `${IVOR_API}/api/calendar/event/${evt.id}.ics`
    };
  };

  const calendarOptions = [
    {
      id: 'google',
      name: 'Google Calendar',
      icon: '📅',
      color: 'hover:bg-blue-500/20'
    },
    {
      id: 'apple',
      name: 'Apple Calendar',
      icon: '🍎',
      color: 'hover:bg-gray-500/20'
    },
    {
      id: 'outlook',
      name: 'Outlook',
      icon: '📧',
      color: 'hover:bg-blue-600/20'
    },
    {
      id: 'yahoo',
      name: 'Yahoo Calendar',
      icon: '🔮',
      color: 'hover:bg-purple-500/20'
    },
    {
      id: 'ics',
      name: 'Download .ics',
      icon: '⬇️',
      color: 'hover:bg-green-500/20',
      isDownload: true
    }
  ];

  const handleOptionClick = (optionId: string) => {
    if (!links) return;

    const url = links[optionId as keyof CalendarLinks];
    if (!url) return;

    if (optionId === 'ics') {
      // Download ICS file
      const link = document.createElement('a');
      link.href = url;
      link.download = `${event.title.replace(/[^a-z0-9]/gi, '-')}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (optionId === 'apple') {
      // Apple Calendar uses webcal:// protocol
      window.location.href = url.replace('https://', 'webcal://');
    } else {
      // Open in new tab
      window.open(url, '_blank', 'noopener,noreferrer');
    }

    setIsOpen(false);
  };

  // Size classes
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  // Render trigger based on variant
  const renderTrigger = () => {
    switch (variant) {
      case 'icon':
        return (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Add to calendar"
          >
            <Calendar className="w-5 h-5" />
          </button>
        );
      case 'text':
        return (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`${sizeClasses[size]} text-liberation-gold-divine hover:text-liberation-gold-divine/80 flex items-center gap-1 transition-colors`}
          >
            <Calendar className="w-4 h-4" />
            Add to calendar
          </button>
        );
      default:
        return (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`${sizeClasses[size]} px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg flex items-center gap-2 transition-colors`}
          >
            <Calendar className="w-4 h-4" />
            Add to Calendar
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        );
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {renderTrigger()}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-56 bg-liberation-black-power border border-white/20 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-white/10">
            <span className="text-xs text-white/50 px-2">Add to calendar</span>
          </div>

          <div className="py-1">
            {calendarOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleOptionClick(option.id)}
                disabled={loading || !links}
                className={`w-full px-4 py-2.5 flex items-center gap-3 text-white/80 hover:text-white ${option.color} transition-colors disabled:opacity-50`}
              >
                <span className="text-lg">{option.icon}</span>
                <span className="flex-1 text-left">{option.name}</span>
                {option.isDownload ? (
                  <Download className="w-4 h-4 text-white/40" />
                ) : (
                  <ExternalLink className="w-4 h-4 text-white/40" />
                )}
              </button>
            ))}
          </div>

          {/* Liberation footer */}
          <div className="px-4 py-2 border-t border-white/10 bg-white/5">
            <span className="text-xs text-white/40">
              🏴‍☠️ Never miss a community gathering
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddToCalendar;
