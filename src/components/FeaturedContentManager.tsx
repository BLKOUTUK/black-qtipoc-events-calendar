import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Image as ImageIcon } from 'lucide-react';
import { FeaturedContent } from '../types';
import { supabase } from '../lib/supabase';

export const FeaturedContentManager: React.FC = () => {
  const [featuredContent, setFeaturedContent] = useState<FeaturedContent[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<FeaturedContent>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedContent();
  }, []);

  const loadFeaturedContent = async () => {
    try {
      const { data, error } = await supabase
        .from('weekly_featured_content')
        .select('*')
        .order('week_start', { ascending: false })
        .order('display_order', { ascending: true });

      if (error) throw error;
      setFeaturedContent(data || []);
    } catch (error) {
      console.error('Error loading featured content:', error);
    } finally {
      setLoading(false);
    }
  };

  const startNew = () => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));

    setEditForm({
      title: '',
      caption: '',
      image_url: '',
      link_url: '',
      week_start: monday.toISOString().split('T')[0],
      display_order: 1,
      status: 'active'
    });
    setIsEditing(true);
  };

  const startEdit = (content: FeaturedContent) => {
    setEditForm(content);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditForm({});
  };

  const saveContent = async () => {
    try {
      if (editForm.id) {
        // Update existing
        const { error } = await supabase
          .from('weekly_featured_content')
          .update({
            ...editForm,
            updated_at: new Date().toISOString()
          })
          .eq('id', editForm.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('weekly_featured_content')
          .insert([editForm]);

        if (error) throw error;
      }

      await loadFeaturedContent();
      cancelEdit();
    } catch (error) {
      console.error('Error saving featured content:', error);
      alert('Failed to save. Please try again.');
    }
  };

  const deleteContent = async (id: string) => {
    if (!confirm('Delete this featured content?')) return;

    try {
      const { error } = await supabase
        .from('weekly_featured_content')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadFeaturedContent();
    } catch (error) {
      console.error('Error deleting featured content:', error);
      alert('Failed to delete. Please try again.');
    }
  };

  if (loading) {
    return <div className="text-white">Loading featured content...</div>;
  }

  if (isEditing) {
    return (
      <div className="bg-gray-800 border border-purple-500/30 rounded-lg p-6">
        <h3 className="text-lg font-bold text-purple-500 mb-4">
          {editForm.id ? 'Edit Featured Content' : 'Add Featured Content'}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
            <input
              type="text"
              value={editForm.title || ''}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:border-purple-500 focus:outline-none"
              placeholder="e.g., Community Highlight"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Caption</label>
            <textarea
              value={editForm.caption || ''}
              onChange={(e) => setEditForm({ ...editForm, caption: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:border-purple-500 focus:outline-none"
              placeholder="Caption for the image..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Image URL</label>
            <input
              type="url"
              value={editForm.image_url || ''}
              onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:border-purple-500 focus:outline-none"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Link URL (Optional)</label>
            <input
              type="url"
              value={editForm.link_url || ''}
              onChange={(e) => setEditForm({ ...editForm, link_url: e.target.value })}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:border-purple-500 focus:outline-none"
              placeholder="https://... (optional)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Week Start (Monday)</label>
              <input
                type="date"
                value={editForm.week_start || ''}
                onChange={(e) => setEditForm({ ...editForm, week_start: e.target.value })}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Display Order</label>
              <input
                type="number"
                min="1"
                value={editForm.display_order || 1}
                onChange={(e) => setEditForm({ ...editForm, display_order: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
            <select
              value={editForm.status || 'active'}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value as 'active' | 'archived' | 'draft' })}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:border-purple-500 focus:outline-none"
            >
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              onClick={cancelEdit}
              className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors inline-flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={saveContent}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors inline-flex items-center gap-2 font-medium"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-purple-500">Featured Content</h3>
        <button
          onClick={startNew}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Featured Content
        </button>
      </div>

      {featuredContent.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 border border-gray-700 rounded-lg">
          <ImageIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No featured content yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {featuredContent.map((content) => (
            <div
              key={content.id}
              className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-start justify-between"
            >
              <div className="flex gap-4 flex-1">
                {content.image_url && (
                  <img
                    src={content.image_url}
                    alt={content.title}
                    className="w-24 h-24 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <h4 className="font-bold text-white">{content.title}</h4>
                  <p className="text-sm text-gray-400 mt-1">{content.caption}</p>
                  <div className="flex gap-3 mt-2 text-xs text-gray-500">
                    <span>Week: {new Date(content.week_start).toLocaleDateString()}</span>
                    <span>Order: {content.display_order}</span>
                    <span className={`capitalize ${
                      content.status === 'active' ? 'text-green-400' :
                      content.status === 'draft' ? 'text-yellow-400' :
                      'text-gray-400'
                    }`}>
                      {content.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(content)}
                  className="p-2 text-blue-400 hover:bg-gray-700 rounded transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteContent(content.id)}
                  className="p-2 text-red-400 hover:bg-gray-700 rounded transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
