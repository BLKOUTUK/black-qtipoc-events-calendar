/**
 * Community Groups Component
 * Browse and join community groups
 *
 * Liberation Feature: Collective organizing spaces
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Users, Search, MapPin, Plus, Check, Clock,
  Loader2, ChevronRight, Shield, Globe, Lock
} from 'lucide-react';

const IVOR_API = import.meta.env.VITE_IVOR_API_URL || 'https://ivor.blkoutuk.cloud';

interface Group {
  id: string;
  name: string;
  slug: string;
  description: string;
  visibility: 'public' | 'private' | 'hidden';
  join_policy: 'open' | 'approval' | 'invite';
  category: string;
  location_focus: string;
  member_count: number;
  event_count: number;
  liberation_aligned: boolean;
  membership?: {
    role: string;
    joined_at: string;
  };
}

interface CommunityGroupsProps {
  userId?: string;
  onGroupClick?: (groupId: string) => void;
  showCreateButton?: boolean;
}

export function CommunityGroups({
  userId,
  onGroupClick,
  showCreateButton = true
}: CommunityGroupsProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'discover' | 'my-groups'>('discover');

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (selectedCategory) params.set('category', selectedCategory);

      const response = await fetch(`${IVOR_API}/api/groups?${params}`);
      const data = await response.json();

      if (data.success) {
        setGroups(data.groups);
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('[CommunityGroups] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory]);

  const fetchMyGroups = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch(`${IVOR_API}/api/groups/user/${userId}`);
      const data = await response.json();

      if (data.success) {
        setMyGroups(data.groups);
      }
    } catch (err) {
      console.error('[CommunityGroups] My groups error:', err);
    }
  }, [userId]);

  useEffect(() => {
    fetchGroups();
    if (userId) fetchMyGroups();
  }, [fetchGroups, fetchMyGroups, userId]);

  const handleJoin = async (groupId: string) => {
    if (!userId) return;

    try {
      const response = await fetch(`${IVOR_API}/api/groups/${groupId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();

      if (data.success) {
        // Refresh groups
        fetchGroups();
        fetchMyGroups();
      }
    } catch (err) {
      console.error('[CommunityGroups] Join error:', err);
    }
  };

  const handleLeave = async (groupId: string) => {
    if (!userId) return;

    try {
      const response = await fetch(`${IVOR_API}/api/groups/${groupId}/leave`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();

      if (data.success) {
        fetchGroups();
        fetchMyGroups();
      }
    } catch (err) {
      console.error('[CommunityGroups] Leave error:', err);
    }
  };

  const isInGroup = (groupId: string) => {
    return myGroups.some(g => g.id === groupId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Community Groups</h2>
          <p className="text-white/60 text-sm mt-1">
            Connect with Black queer communities
          </p>
        </div>
        {showCreateButton && userId && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-liberation-gold-divine text-liberation-black-power font-medium rounded-lg"
          >
            <Plus className="w-4 h-4" />
            Create Group
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/10">
        <button
          onClick={() => setActiveTab('discover')}
          className={`pb-2 px-1 border-b-2 transition-colors ${
            activeTab === 'discover'
              ? 'border-liberation-gold-divine text-liberation-gold-divine'
              : 'border-transparent text-white/60'
          }`}
        >
          Discover
        </button>
        <button
          onClick={() => setActiveTab('my-groups')}
          className={`pb-2 px-1 border-b-2 transition-colors ${
            activeTab === 'my-groups'
              ? 'border-liberation-gold-divine text-liberation-gold-divine'
              : 'border-transparent text-white/60'
          }`}
        >
          My Groups ({myGroups.length})
        </button>
      </div>

      {/* Discover Tab */}
      {activeTab === 'discover' && (
        <>
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search groups..."
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-liberation-gold-divine"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                  !selectedCategory
                    ? 'bg-liberation-gold-divine text-liberation-black-power'
                    : 'bg-white/10 text-white/60'
                }`}
              >
                All
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-liberation-gold-divine text-liberation-black-power'
                      : 'bg-white/10 text-white/60'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Groups Grid */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-liberation-gold-divine" />
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-white/30 mb-4" />
              <p className="text-white/60">No groups found</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {groups.map(group => (
                <GroupCard
                  key={group.id}
                  group={group}
                  isMember={isInGroup(group.id)}
                  onJoin={() => handleJoin(group.id)}
                  onLeave={() => handleLeave(group.id)}
                  onClick={() => onGroupClick?.(group.id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* My Groups Tab */}
      {activeTab === 'my-groups' && (
        <div className="space-y-4">
          {myGroups.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-white/30 mb-4" />
              <p className="text-white/60 mb-4">You haven't joined any groups yet</p>
              <button
                onClick={() => setActiveTab('discover')}
                className="px-4 py-2 bg-liberation-gold-divine/20 text-liberation-gold-divine rounded-lg"
              >
                Discover Groups
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {myGroups.map(group => (
                <GroupCard
                  key={group.id}
                  group={group}
                  isMember={true}
                  showRole={true}
                  onLeave={() => handleLeave(group.id)}
                  onClick={() => onGroupClick?.(group.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateGroupModal
          userId={userId!}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchGroups();
            fetchMyGroups();
          }}
        />
      )}
    </div>
  );
}

// Group Card Component
function GroupCard({
  group,
  isMember,
  showRole,
  onJoin,
  onLeave,
  onClick
}: {
  group: Group;
  isMember: boolean;
  showRole?: boolean;
  onJoin?: () => void;
  onLeave?: () => void;
  onClick?: () => void;
}) {
  const visibilityIcons = {
    public: Globe,
    private: Lock,
    hidden: Shield
  };
  const VisibilityIcon = visibilityIcons[group.visibility];

  return (
    <div
      className="bg-liberation-black-power/50 rounded-xl border border-liberation-gold-divine/20 p-4 hover:border-liberation-gold-divine/40 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="cursor-pointer flex-1" onClick={onClick}>
          <div className="flex items-center gap-2">
            <h3 className="text-white font-medium">{group.name}</h3>
            <VisibilityIcon className="w-4 h-4 text-white/40" />
          </div>
          <p className="text-white/60 text-sm mt-1 line-clamp-2">{group.description}</p>
        </div>
        {group.liberation_aligned && (
          <span className="text-green-400 text-sm">✊</span>
        )}
      </div>

      <div className="flex items-center gap-4 mt-3 text-sm text-white/40">
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {group.member_count}
        </span>
        <span className="flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {group.location_focus}
        </span>
        <span className="px-2 py-0.5 bg-white/10 rounded text-xs">
          {group.category}
        </span>
      </div>

      {showRole && group.membership && (
        <div className="mt-2 text-xs text-liberation-gold-divine">
          {group.membership.role === 'owner' ? '👑 Owner' :
           group.membership.role === 'admin' ? '⭐ Admin' :
           group.membership.role === 'moderator' ? '🛡️ Moderator' : '👤 Member'}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        {isMember ? (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-green-400 text-sm">
              <Check className="w-4 h-4" />
              Joined
            </span>
            {group.membership?.role === 'member' && (
              <button
                onClick={(e) => { e.stopPropagation(); onLeave?.(); }}
                className="text-white/40 text-sm hover:text-red-400"
              >
                Leave
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onJoin?.(); }}
            className="px-3 py-1 bg-liberation-gold-divine text-liberation-black-power text-sm font-medium rounded"
          >
            {group.join_policy === 'open' ? 'Join' :
             group.join_policy === 'approval' ? 'Request to Join' : 'Request Invite'}
          </button>
        )}
        <button
          onClick={onClick}
          className="text-white/40 hover:text-white"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// Create Group Modal
function CreateGroupModal({
  userId,
  onClose,
  onCreated
}: {
  userId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    visibility: 'public',
    joinPolicy: 'open',
    category: 'Social',
    locationFocus: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${IVOR_API}/api/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          createdBy: userId
        })
      });

      const data = await response.json();

      if (data.success) {
        onCreated();
      }
    } catch (err) {
      console.error('[CreateGroup] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-liberation-black-power border border-liberation-gold-divine/20 rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-4">Create Group</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white/60 text-sm mb-1">Group Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            />
          </div>

          <div>
            <label className="block text-white/60 text-sm mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white/60 text-sm mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              >
                <option value="Regional">Regional</option>
                <option value="Interest">Interest</option>
                <option value="Wellness">Wellness</option>
                <option value="Professional">Professional</option>
                <option value="Social">Social</option>
              </select>
            </div>

            <div>
              <label className="block text-white/60 text-sm mb-1">Location Focus</label>
              <input
                type="text"
                value={formData.locationFocus}
                onChange={(e) => setFormData({ ...formData, locationFocus: e.target.value })}
                placeholder="e.g., London, UK-wide"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white/60 text-sm mb-1">Visibility</label>
              <select
                value={formData.visibility}
                onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>

            <div>
              <label className="block text-white/60 text-sm mb-1">Join Policy</label>
              <select
                value={formData.joinPolicy}
                onChange={(e) => setFormData({ ...formData, joinPolicy: e.target.value })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              >
                <option value="open">Open</option>
                <option value="approval">Requires Approval</option>
                <option value="invite">Invite Only</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-white/20 text-white rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name}
              className="flex-1 px-4 py-2 bg-liberation-gold-divine text-liberation-black-power font-medium rounded-lg disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CommunityGroups;
