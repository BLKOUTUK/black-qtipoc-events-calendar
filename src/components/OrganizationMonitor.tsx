import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, ExternalLink, Calendar, AlertCircle, CheckCircle } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  type: 'community_center' | 'arts_collective' | 'advocacy' | 'faith_based' | 'youth' | 'health' | 'housing';
  location: string;
  website?: string;
  facebook_page?: string;
  eventbrite_organizer?: string;
  monitoring_frequency: 'weekly' | 'monthly' | 'quarterly';
  last_checked?: string;
  events_found_last_check?: number;
  status: 'active' | 'inactive' | 'needs_review';
  notes?: string;
}

const UK_QTIPOC_ORGANIZATIONS: Organization[] = [
  {
    id: '1',
    name: 'UK Black Pride',
    type: 'advocacy',
    location: 'London',
    website: 'ukblackpride.org.uk',
    facebook_page: 'UKBlackPride',
    monitoring_frequency: 'weekly',
    last_checked: '2024-02-15T10:00:00Z',
    events_found_last_check: 3,
    status: 'active',
    notes: 'Major annual event + year-round programming'
  },
  {
    id: '2',
    name: 'Rainbow Noir Manchester',
    type: 'community_center',
    location: 'Manchester',
    website: 'rainbownoir.org.uk',
    facebook_page: 'RainbowNoirMCR',
    monitoring_frequency: 'monthly',
    last_checked: '2024-02-10T14:00:00Z',
    events_found_last_check: 2,
    status: 'active',
    notes: 'Bi-monthly social and peer support (2nd Thursday each month)'
  },
  {
    id: '3',
    name: 'UNMUTED',
    type: 'advocacy',
    location: 'Birmingham',
    website: 'unmutedbrum.com',
    monitoring_frequency: 'monthly',
    last_checked: '2024-02-08T16:00:00Z',
    events_found_last_check: 1,
    status: 'active',
    notes: 'Monthly QTIPOC meetups, book clubs'
  },
  {
    id: '4',
    name: 'Pxssy Palace',
    type: 'arts_collective',
    location: 'London',
    website: 'pxssypalace.com',
    facebook_page: 'PxssyPalace',
    monitoring_frequency: 'weekly',
    last_checked: '2024-02-12T12:00:00Z',
    events_found_last_check: 5,
    status: 'active',
    notes: 'High-volume events, multiple venues'
  },
  {
    id: '5',
    name: 'Colours Youth Network',
    type: 'youth',
    location: 'UK-wide',
    website: 'coloursyouthuk.org',
    monitoring_frequency: 'monthly',
    last_checked: '2024-02-05T09:00:00Z',
    events_found_last_check: 2,
    status: 'active',
    notes: 'QTIPOC young people aged 16-25, festivals and residential programs'
  },
  {
    id: '6',
    name: 'Black Trans Alliance C.I.C',
    type: 'advocacy',
    location: 'UK-wide',
    monitoring_frequency: 'monthly',
    last_checked: '2024-01-28T11:00:00Z',
    events_found_last_check: 0,
    status: 'needs_review',
    notes: 'Mainly online services, may need different monitoring approach'
  }
];

export const OrganizationMonitor: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>(UK_QTIPOC_ORGANIZATIONS);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const getTypeColor = (type: Organization['type']) => {
    const colors = {
      community_center: 'bg-blue-100 text-blue-800',
      arts_collective: 'bg-purple-100 text-purple-800',
      advocacy: 'bg-green-100 text-green-800',
      faith_based: 'bg-yellow-100 text-yellow-800',
      youth: 'bg-pink-100 text-pink-800',
      health: 'bg-red-100 text-red-800',
      housing: 'bg-gray-100 text-gray-800'
    };
    return colors[type];
  };

  const getStatusIcon = (status: Organization['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'inactive':
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
      case 'needs_review':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getFrequencyColor = (frequency: Organization['monitoring_frequency']) => {
    const colors = {
      weekly: 'bg-red-100 text-red-800',
      monthly: 'bg-blue-100 text-blue-800',
      quarterly: 'bg-green-100 text-green-800'
    };
    return colors[frequency];
  };

  const handleMonitorAll = async () => {
    setIsMonitoring(true);
    try {
      // Simulate monitoring process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Update last checked times
      setOrganizations(orgs => 
        orgs.map(org => ({
          ...org,
          last_checked: new Date().toISOString(),
          events_found_last_check: Math.floor(Math.random() * 5)
        }))
      );
    } catch (error) {
      console.error('Error monitoring organizations:', error);
    } finally {
      setIsMonitoring(false);
    }
  };

  const formatLastChecked = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const activeOrgs = organizations.filter(org => org.status === 'active');
  const weeklyOrgs = organizations.filter(org => org.monitoring_frequency === 'weekly');
  const totalEventsFound = organizations.reduce((sum, org) => sum + (org.events_found_last_check || 0), 0);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Users className="w-5 h-5 mr-2 text-orange-600" />
          Organization Monitor
        </h3>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Organization
          </button>
          <button
            onClick={handleMonitorAll}
            disabled={isMonitoring}
            className={`flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 ${
              isMonitoring ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Calendar className={`w-4 h-4 mr-2 ${isMonitoring ? 'animate-spin' : ''}`} />
            {isMonitoring ? 'Monitoring...' : 'Check All'}
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-blue-800">Total Organizations</p>
              <p className="text-2xl font-bold text-blue-900">{organizations.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-green-800">Active</p>
              <p className="text-2xl font-bold text-green-900">{activeOrgs.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-red-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-red-800">Weekly Monitoring</p>
              <p className="text-2xl font-bold text-red-900">{weeklyOrgs.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-purple-800">Events Found</p>
              <p className="text-2xl font-bold text-purple-900">{totalEventsFound}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Organizations List */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Organization
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Frequency
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Check
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Events Found
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {organizations.map((org) => (
              <tr key={org.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{org.name}</div>
                    {org.notes && (
                      <div className="text-xs text-gray-500 mt-1">{org.notes}</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(org.type)}`}>
                    {org.type.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {org.location}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getFrequencyColor(org.monitoring_frequency)}`}>
                    {org.monitoring_frequency}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatLastChecked(org.last_checked)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {org.events_found_last_check || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getStatusIcon(org.status)}
                    <span className="ml-2 text-sm text-gray-500 capitalize">
                      {org.status.replace('_', ' ')}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    {org.website && (
                      <a
                        href={`https://${org.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-900"
                        title="Visit website"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => setEditingOrg(org)}
                      className="text-gray-600 hover:text-gray-900"
                      title="Edit organization"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setOrganizations(orgs => orgs.filter(o => o.id !== org.id));
                      }}
                      className="text-red-600 hover:text-red-900"
                      title="Remove organization"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Monitoring Strategy Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Monitoring Strategy</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
          <div>
            <h5 className="font-medium mb-1">Weekly (High Volume)</h5>
            <ul className="text-xs space-y-1">
              <li>• Major event organizers</li>
              <li>• Active arts collectives</li>
              <li>• Large community centers</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium mb-1">Monthly (Regular)</h5>
            <ul className="text-xs space-y-1">
              <li>• Most community organizations</li>
              <li>• Advocacy groups</li>
              <li>• Youth organizations</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium mb-1">Quarterly (Seasonal)</h5>
            <ul className="text-xs space-y-1">
              <li>• Annual event organizers</li>
              <li>• Smaller local groups</li>
              <li>• Seasonal programs</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Integration Notice */}
      <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
        <h5 className="font-medium text-green-900 mb-2">Google Sheets Integration</h5>
        <p className="text-sm text-green-800">
          Organization monitoring data is stored in the "OrganizationsToMonitor" sheet. 
          Scraping functions read from this sheet to determine which organizations to check for new events.
        </p>
      </div>
    </div>
  );
};