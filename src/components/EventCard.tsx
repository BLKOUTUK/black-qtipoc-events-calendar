import React, { useState } from 'react';
import { Calendar, MapPin, ExternalLink, Clock, User, Edit2, Save, X, Repeat, Download, Trash2 } from 'lucide-react';
import { Event, RecurrenceRule } from '../types';
import { RecurringEventForm } from './RecurringEventForm';
import { formatRecurrenceRule } from '../utils/recurringEvents';
import { googleCalendarService } from '../services/googleCalendarService';

interface EventCardProps {
  event: Event;
  showActions?: boolean;
  showDeleteOnly?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onEdit?: (id: string, edits: Partial<Event>) => void;
  onDelete?: (id: string) => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  showActions = false,
  showDeleteOnly = false,
  onApprove,
  onReject,
  onEdit,
  onDelete
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showRecurrenceForm, setShowRecurrenceForm] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Event>>({});
  const formatDate = (dateString: string, endDateString?: string | null) => {
    const startDate = new Date(dateString);
    const formattedStart = startDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    if (!endDateString) return formattedStart;

    const endDate = new Date(endDateString);
    const isSameMonth = startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear();
    const isSameYear = startDate.getFullYear() === endDate.getFullYear();

    if (isSameMonth) {
      // Same month: "Mon, Dec 5 - 15, 2025"
      return `${formattedStart.split(',')[0]}, ${formattedStart.split(',')[1].trim().split(' ')[0]} ${startDate.getDate()} - ${endDate.getDate()}, ${endDate.getFullYear()}`;
    } else if (isSameYear) {
      // Same year: "Mon, Dec 5 - Fri, Jan 15, 2025"
      const formattedEnd = endDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
      return `${formattedStart.replace(`, ${startDate.getFullYear()}`, '')} - ${formattedEnd}, ${endDate.getFullYear()}`;
    } else {
      // Different years: "Mon, Dec 5, 2025 - Fri, Jan 15, 2026"
      const formattedEnd = endDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      return `${formattedStart} - ${formattedEnd}`;
    }
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

  const [showCalendarOptions, setShowCalendarOptions] = useState(false);

  const addToGoogleCalendar = () => {
    googleCalendarService.addToGoogleCalendar(event);
    setShowCalendarOptions(false);
  };

  const downloadICSFile = () => {
    googleCalendarService.downloadICSFile(event);
    setShowCalendarOptions(false);
  };

  const locationStr = typeof event.location === 'string'
    ? event.location
    : JSON.stringify(event.location);

  const startEdit = () => {
    setIsEditing(true);
    setEditForm({
      name: event.name,
      description: event.description,
      event_date: event.event_date,
      end_date: event.end_date,
      start_time: event.start_time,
      location: locationStr,
      organizer_name: event.organizer_name,
      url: event.url,
      price: event.price || event.cost?.toString() || 'Free'
    });
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditForm({});
  };

  const saveEdit = () => {
    if (onEdit) {
      onEdit(event.id, editForm);
      setIsEditing(false);
      setEditForm({});
    }
  };

  const handleRecurrenceSave = (rule: RecurrenceRule | null) => {
    if (onEdit) {
      onEdit(event.id, { recurrence_rule: rule });
    }
    setShowRecurrenceForm(false);
  };

  if (isEditing) {
    return (
      <div className="bg-gray-800 border border-yellow-500/30 rounded-lg shadow-lg overflow-hidden p-6">
        <h3 className="text-lg font-bold text-yellow-500 mb-4">Edit Event</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Event Name</label>
            <input
              type="text"
              value={editForm.name || ''}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:border-yellow-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={editForm.description || ''}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:border-yellow-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
              <input
                type="date"
                value={editForm.event_date || ''}
                onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:border-yellow-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">End Date (optional)</label>
              <input
                type="date"
                value={editForm.end_date || ''}
                onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:border-yellow-500 focus:outline-none"
                placeholder="Leave blank for single-day events"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Start Time</label>
              <input
                type="time"
                value={editForm.start_time || ''}
                onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:border-yellow-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">End Time (optional)</label>
              <input
                type="time"
                value={editForm.end_time || ''}
                onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:border-yellow-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
            <input
              type="text"
              value={editForm.location as string || ''}
              onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:border-yellow-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Organizer</label>
            <input
              type="text"
              value={editForm.organizer_name || ''}
              onChange={(e) => setEditForm({ ...editForm, organizer_name: e.target.value })}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:border-yellow-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Event URL</label>
            <input
              type="url"
              value={editForm.url || ''}
              onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:border-yellow-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Cost/Price</label>
            <input
              type="text"
              value={editForm.price || ''}
              onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:border-yellow-500 focus:outline-none"
              placeholder="Free, £10, £5-£10, etc."
            />
          </div>

          <div className="flex gap-2 justify-between pt-2">
            <button
              onClick={() => setShowRecurrenceForm(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors inline-flex items-center gap-2"
              title="Set recurring pattern"
            >
              <Repeat className="w-4 h-4" />
              {event.recurrence_rule ? 'Edit Recurrence' : 'Make Recurring'}
            </button>
            <div className="flex gap-2">
              <button
                onClick={cancelEdit}
                className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors inline-flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="px-4 py-2 bg-yellow-500 text-gray-900 rounded-md hover:bg-yellow-400 transition-colors inline-flex items-center gap-2 font-medium"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if event has adult content tags
  const isAdultContent = event.tags?.some(tag =>
    ['adult', '18+', 'mature', 'nsfw', 'sex', 'sexual', 'xxx', '18 plus'].includes(tag.toLowerCase())
  );

  return (
    <>
      {/* Recurrence Form Modal */}
      {showRecurrenceForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <RecurringEventForm
            initialRule={event.recurrence_rule || undefined}
            onSave={handleRecurrenceSave}
            onCancel={() => setShowRecurrenceForm(false)}
          />
        </div>
      )}

      <div className="bg-gray-800 border border-yellow-500/30 rounded-lg shadow-lg overflow-hidden hover:shadow-xl hover:border-yellow-500/50 transition-all duration-300">

      {/* Adult Content Warning Banner */}
      {isAdultContent && (
        <div className="bg-purple-600 border-b-2 border-purple-800 px-4 py-2 flex items-center justify-center">
          <div className="flex items-center space-x-3">
            <span className="text-white font-black text-sm tracking-widest">XXX</span>
            <span className="text-white font-bold text-xs tracking-wide">SEX RATED</span>
            <span className="text-white font-black text-sm tracking-widest">XXX</span>
          </div>
        </div>
      )}

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
            <span>{formatDate(event.event_date, event.end_date)} at {formatTime(event.start_time)}</span>
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

        {/* Recurring Event Badge */}
        {event.recurrence_rule && (
          <div className="mb-3 flex items-center gap-2 p-2 bg-purple-500/20 border border-purple-500/30 rounded-md">
            <Repeat className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-300">
              Repeats {formatRecurrenceRule(event.recurrence_rule)}
            </span>
          </div>
        )}

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
          <div className="flex space-x-2 relative">
            {/* Calendar Options Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowCalendarOptions(!showCalendarOptions)}
                className="flex items-center px-3 py-2 bg-yellow-500 text-gray-900 text-sm rounded-lg hover:bg-yellow-400 transition-colors duration-200 font-medium"
                aria-label="Add to calendar"
              >
                <Calendar className="w-4 h-4 mr-1" />
                Add to Calendar
              </button>

              {/* Dropdown Menu */}
              {showCalendarOptions && (
                <div className="absolute left-0 mt-2 w-48 bg-gray-800 border border-yellow-500/30 rounded-lg shadow-xl z-10">
                  <button
                    onClick={addToGoogleCalendar}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 transition-colors duration-200 rounded-t-lg"
                  >
                    <Calendar className="w-4 h-4 mr-2 text-yellow-500" />
                    Google Calendar
                  </button>
                  <button
                    onClick={downloadICSFile}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 transition-colors duration-200 rounded-b-lg"
                  >
                    <Download className="w-4 h-4 mr-2 text-yellow-500" />
                    Download .ics
                  </button>
                </div>
              )}
            </div>

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
                onClick={startEdit}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-500 transition-colors duration-200"
                title="Edit"
              >
                <Edit2 className="w-4 h-4" />
              </button>
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
          {showDeleteOnly && (
            <div className="flex space-x-2">
              <button
                onClick={startEdit}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-500 transition-colors duration-200"
                title="Edit"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  if (confirm(`Are you sure you want to permanently delete "${event.name}"? This action cannot be undone.`)) {
                    onDelete?.(event.id);
                  }
                }}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-500 transition-colors duration-200 flex items-center gap-1"
                title="Delete permanently"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
};