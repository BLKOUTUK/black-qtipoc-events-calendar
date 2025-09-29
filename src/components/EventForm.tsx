import React, { useState } from 'react';
import { X, Home } from 'lucide-react';
import { Event } from '../types';
import { supabaseEventService } from '../services/supabaseEventService';
import { googleSheetsService } from '../services/googleSheetsService';

interface EventFormProps {
  onSubmit: (event: Event) => void;
  onCancel: () => void;
}

export const EventForm: React.FC<EventFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    event_date: '',
    location: '',
    organizer_name: '',
    source_url: '',
    tags: '',
    price: '',
    contact_email: '',
    image_url: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Event title is required';
    if (!formData.description.trim()) newErrors.description = 'Event description is required';
    if (!formData.event_date) newErrors.event_date = 'Event date is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.organizer_name.trim()) newErrors.organizer_name = 'Organizer name is required';
    if (!formData.source_url.trim()) newErrors.source_url = 'Event URL is required';
    if (formData.contact_email && !/\S+@\S+\.\S+/.test(formData.contact_email)) {
      newErrors.contact_email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const tags = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);

      // Primary: Submit to Supabase database
      const newEvent = await supabaseEventService.addEvent({
        name: formData.name,
        description: formData.description,
        event_date: formData.event_date,
        location: formData.location,
        source: 'community' as const,
        source_url: formData.source_url,
        organizer_name: formData.organizer_name,
        tags,
        status: 'draft' as const,
        price: formData.price || undefined,
        contact_email: formData.contact_email || undefined,
        image_url: formData.image_url || undefined
      });

      if (newEvent) {
        // Secondary: Also save to Google Sheets for N8N bridge and transparency
        try {
          console.log('📊 BACKUP: Saving to Google Sheets for N8N bridge...');
          await googleSheetsService.addEvent({
            name: formData.name,
            description: formData.description,
            event_date: formData.event_date,
            location: formData.location,
            source: 'community' as const,
            source_url: formData.source_url,
            organizer_name: formData.organizer_name,
            tags,
            status: 'draft' as const,
            price: formData.price || undefined,
            contact_email: formData.contact_email || undefined,
            image_url: formData.image_url || undefined
          });
          console.log('✅ BACKUP: Event also saved to Google Sheets');
        } catch (sheetsError) {
          console.warn('⚠️ BACKUP: Google Sheets backup failed (non-critical):', sheetsError);
        }

        onSubmit(newEvent);
      } else {
        throw new Error('Failed to create event');
      }
    } catch (error) {
      console.error('Error submitting event:', error);
      setErrors({ submit: 'Failed to submit event. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Submit Community Event</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={onCancel}
                className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                title="Back to Home"
              >
                <Home className="w-4 h-4 mr-1" />
                Home
              </button>
              <button
                onClick={onCancel}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {errors.submit && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Google Sheets Notice */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">📊 Powered by Google Sheets</h4>
            <p className="text-sm text-blue-800">
              Your event will be added to our community Google Sheet for transparent moderation. 
              All submissions are reviewed before publication.
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Event Title *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              {errors.name && (
                <p id="name-error" className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Event Description *
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                aria-describedby={errors.description ? 'description-error' : undefined}
              />
              {errors.description && (
                <p id="description-error" className="text-red-500 text-sm mt-1">{errors.description}</p>
              )}
            </div>

            <div>
              <label htmlFor="event_date" className="block text-sm font-medium text-gray-700 mb-2">
                Event Date & Time *
              </label>
              <input
                type="datetime-local"
                id="event_date"
                name="event_date"
                value={formData.event_date}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.event_date ? 'border-red-500' : 'border-gray-300'
                }`}
                aria-describedby={errors.event_date ? 'event_date-error' : undefined}
              />
              {errors.event_date && (
                <p id="event_date-error" className="text-red-500 text-sm mt-1">{errors.event_date}</p>
              )}
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Brooklyn Community Center, NY"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.location ? 'border-red-500' : 'border-gray-300'
                }`}
                aria-describedby={errors.location ? 'location-error' : undefined}
              />
              {errors.location && (
                <p id="location-error" className="text-red-500 text-sm mt-1">{errors.location}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="organizer_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Organizer *
                </label>
                <input
                  type="text"
                  id="organizer_name"
                  name="organizer_name"
                  value={formData.organizer_name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.organizer_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  aria-describedby={errors.organizer_name ? 'organizer_name-error' : undefined}
                />
                {errors.organizer_name && (
                  <p id="organizer_name-error" className="text-red-500 text-sm mt-1">{errors.organizer_name}</p>
                )}
              </div>

              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                  Price
                </label>
                <input
                  type="text"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="e.g., Free, $15, Sliding scale $10-30"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="source_url" className="block text-sm font-medium text-gray-700 mb-2">
                Event URL *
              </label>
              <input
                type="url"
                id="source_url"
                name="source_url"
                value={formData.source_url}
                onChange={handleChange}
                placeholder="https://example.com/event"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.source_url ? 'border-red-500' : 'border-gray-300'
                }`}
                aria-describedby={errors.source_url ? 'source_url-error' : undefined}
              />
              {errors.source_url && (
                <p id="source_url-error" className="text-red-500 text-sm mt-1">{errors.source_url}</p>
              )}
            </div>

            <div>
              <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700 mb-2">
                Contact Email
              </label>
              <input
                type="email"
                id="contact_email"
                name="contact_email"
                value={formData.contact_email}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.contact_email ? 'border-red-500' : 'border-gray-300'
                }`}
                aria-describedby={errors.contact_email ? 'contact_email-error' : undefined}
              />
              {errors.contact_email && (
                <p id="contact_email-error" className="text-red-500 text-sm mt-1">{errors.contact_email}</p>
              )}
            </div>

            <div>
              <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-2">
                Event Image URL
              </label>
              <input
                type="url"
                id="image_url"
                name="image_url"
                value={formData.image_url}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="e.g., community, workshop, arts (comma-separated)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">Community Guidelines</h4>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• Events must be relevant to the Black QTIPOC+ community</li>
                <li>• Provide accurate and complete information</li>
                <li>• Ensure events are safe and inclusive spaces</li>
                <li>• All submissions are reviewed before publication</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Event'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};