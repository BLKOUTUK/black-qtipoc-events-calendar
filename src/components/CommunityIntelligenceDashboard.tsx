import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, MapPin, BarChart3, Zap, Target, Award, Globe, Clock } from 'lucide-react';
import { jinaAIService } from '../services/jinaAIService';
import { enhancedDiscoveryEngine } from '../services/enhancedDiscoveryEngine';
import { googleSheetsService } from '../services/googleSheetsService';

interface CommunityIntelligence {
  trendingTopics: string[];
  emergingOrganizers: string[];
  locationHotspots: { location: string; count: number }[];
  accessibilityScore: number;
}

interface DiscoveryStats {
  totalRuns: number;
  averageEventsFound: number;
  averageQualityScore: number;
  knownOrganizations: number;
  cacheSize: number;
}

interface UsageStats {
  dailyBudget: number;
  usedBudget: number;
  remainingBudget: number;
  utilizationPercentage: number;
}

interface PartnershipOpportunity {
  organizer: string;
  eventCount: number;
  themes: string[];
  potentialValue: 'high' | 'medium' | 'low';
  contactStatus: 'identified' | 'contacted' | 'engaged';
}

export default function CommunityIntelligenceDashboard() {
  const [intelligence, setIntelligence] = useState<CommunityIntelligence | null>(null);
  const [discoveryStats, setDiscoveryStats] = useState<DiscoveryStats | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [partnerships, setPartnerships] = useState<PartnershipOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'discovery' | 'partnerships' | 'api'>('overview');
  const [discoveryStatus, setDiscoveryStatus] = useState<string>('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load all published events for analysis
      const events = await googleSheetsService.getPublishedEvents();
      
      // Generate community intelligence
      const communityData = await jinaAIService.generateCommunityIntelligence(events);
      setIntelligence(communityData);

      // Get discovery engine stats
      const discoveryData = enhancedDiscoveryEngine.getDiscoveryStats();
      setDiscoveryStats(discoveryData);

      // Get API usage stats
      const apiData = jinaAIService.getUsageStats();
      setUsageStats(apiData);

      // Generate partnership opportunities
      const partnershipData = generatePartnershipOpportunities(events);
      setPartnerships(partnershipData);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePartnershipOpportunities = (events: any[]): PartnershipOpportunity[] => {
    const organizerCounts = new Map<string, number>();
    const organizerThemes = new Map<string, Set<string>>();

    events.forEach(event => {
      if (event.organizer_name && event.organizer_name !== 'Community Organizer') {
        organizerCounts.set(event.organizer_name, (organizerCounts.get(event.organizer_name) || 0) + 1);
        
        if (!organizerThemes.has(event.organizer_name)) {
          organizerThemes.set(event.organizer_name, new Set());
        }
        
        event.tags?.forEach((tag: string) => {
          organizerThemes.get(event.organizer_name)?.add(tag);
        });
      }
    });

    return Array.from(organizerCounts.entries())
      .filter(([, count]) => count >= 2) // Organizations with 2+ events
      .map(([organizer, count]) => ({
        organizer,
        eventCount: count,
        themes: Array.from(organizerThemes.get(organizer) || []),
        potentialValue: count >= 5 ? 'high' as const : count >= 3 ? 'medium' as const : 'low' as const,
        contactStatus: 'identified' as const
      }))
      .sort((a, b) => b.eventCount - a.eventCount)
      .slice(0, 10);
  };

  const runDiscovery = async () => {
    try {
      setLoading(true);
      setDiscoveryStatus('Starting enhanced discovery...');
      console.log('Starting enhanced discovery...');
      
      // Add overall timeout to prevent infinite loading
      const discoveryPromise = (async () => {
        setDiscoveryStatus('Searching for QTIPOC+ events across the web...');
        const discoveredEvents = await enhancedDiscoveryEngine.runDiscovery('deep');
        console.log(`🎯 DASHBOARD: Discovery returned ${discoveredEvents.length} events`);
        console.log('🎯 DASHBOARD: Sample events:', discoveredEvents.slice(0, 2));
        
        // Save discovered events if any were found
        if (discoveredEvents.length > 0) {
          setDiscoveryStatus(`Found ${discoveredEvents.length} events, saving...`);
          console.log('💾 DASHBOARD: Saving discovered events...');
          let savedCount = 0;
          let savedLocally = 0;
          
          for (const event of discoveredEvents) {
            try {
              console.log(`💾 DASHBOARD: Attempting to save event: ${event.name}`);
              const result = await googleSheetsService.submitEvent(event);
              if (result) {
                savedCount++;
                console.log(`✅ DASHBOARD: Successfully saved event: ${event.name}`);
              } else {
                console.log(`⚠️ DASHBOARD: Failed to save event: ${event.name}`);
              }
              setDiscoveryStatus(`Saving events: ${savedCount}/${discoveredEvents.length}`);
            } catch (saveError) {
              console.error(`❌ DASHBOARD: Error saving event ${event.name}:`, saveError);
              // Try to save locally as backup
              try {
                const existingEvents = JSON.parse(localStorage.getItem('qtipoc-events') || '[]');
                existingEvents.push(event);
                localStorage.setItem('qtipoc-events', JSON.stringify(existingEvents));
                savedLocally++;
                console.log(`💾 DASHBOARD: Saved ${event.name} to localStorage as backup`);
              } catch (localError) {
                console.error(`❌ DASHBOARD: Failed to save locally:`, localError);
              }
            }
          }
          
          if (savedCount > 0) {
            setDiscoveryStatus(`✅ Successfully saved ${savedCount} events to Google Sheets!`);
          } else if (savedLocally > 0) {
            setDiscoveryStatus(`✅ Successfully saved ${savedLocally} events locally (Google Sheets unavailable)`);
          } else {
            setDiscoveryStatus(`❌ Failed to save events - check console for errors`);
          }
          console.log(`💾 DASHBOARD: Final result - Sheets: ${savedCount}, Local: ${savedLocally}`);
        } else {
          setDiscoveryStatus('❌ No new events discovered this time. Try again later.');
          console.log('No new events discovered this time');
        }
        
        return discoveredEvents;
      })();
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Discovery timeout - process took too long')), 120000) // 2 minute timeout
      );
      
      await Promise.race([discoveryPromise, timeoutPromise]);
      await loadDashboardData(); // Refresh data after discovery
    } catch (error) {
      console.error('Error running discovery:', error);
      if (error.message.includes('timeout')) {
        setDiscoveryStatus('❌ Discovery timed out. The process is taking too long. Try again later.');
      } else {
        setDiscoveryStatus('❌ Error during discovery. Check console for details.');
      }
    } finally {
      setLoading(false);
      setTimeout(() => setDiscoveryStatus(''), 8000); // Clear status after 8 seconds
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading community intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Community Intelligence Dashboard</h1>
          <p className="text-gray-600">Real-time insights into the Black QTIPOC+ community and event ecosystem</p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'discovery', label: 'Discovery Engine', icon: Zap },
              { id: 'partnerships', label: 'Partnerships', icon: Users },
              { id: 'api', label: 'API Usage', icon: Globe }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-yellow-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && intelligence && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Trending Topics */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center space-x-3 mb-4">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
                <h3 className="text-lg font-semibold text-gray-900">Trending Topics</h3>
              </div>
              <div className="space-y-2">
                {intelligence.trendingTopics.slice(0, 8).map((topic, index) => (
                  <div key={topic} className="flex items-center justify-between">
                    <span className="text-gray-700">{topic}</span>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                      #{index + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Location Hotspots */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center space-x-3 mb-4">
                <MapPin className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Location Hotspots</h3>
              </div>
              <div className="space-y-3">
                {intelligence.locationHotspots.slice(0, 6).map(location => (
                  <div key={location.location} className="flex items-center justify-between">
                    <span className="text-gray-700">{location.location}</span>
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        location.count > 10 ? 'bg-green-500' :
                        location.count > 5 ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}></div>
                      <span className="text-sm text-gray-600">{location.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Accessibility Score */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Award className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Accessibility Score</h3>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {Math.round(intelligence.accessibilityScore)}%
                </div>
                <p className="text-gray-600 text-sm">Events with accessibility features</p>
                <div className="mt-4 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${intelligence.accessibilityScore}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Emerging Organizers */}
            <div className="bg-white rounded-lg shadow-md p-6 md:col-span-2 lg:col-span-3">
              <div className="flex items-center space-x-3 mb-4">
                <Users className="w-6 h-6 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">Emerging Organizers</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {intelligence.emergingOrganizers.slice(0, 6).map(organizer => (
                  <div key={organizer} className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-1">{organizer}</h4>
                    <p className="text-sm text-gray-600">Active community organizer</p>
                    <div className="mt-2 flex space-x-2">
                      <button className="px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full hover:bg-purple-200 transition-colors">
                        View Profile
                      </button>
                      <button className="px-3 py-1 bg-gray-100 text-gray-800 text-xs rounded-full hover:bg-gray-200 transition-colors">
                        Contact
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Discovery Engine Tab */}
        {activeTab === 'discovery' && discoveryStats && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Discovery Engine Performance</h3>
                <button
                  onClick={runDiscovery}
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Zap className="w-4 h-4" />
                  <span>{loading ? 'Running...' : 'Run Discovery'}</span>
                </button>
              </div>
              
              {discoveryStatus && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 text-sm">{discoveryStatus}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{discoveryStats.totalRuns}</div>
                  <div className="text-sm text-gray-600">Total Runs</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(discoveryStats.averageEventsFound)}
                  </div>
                  <div className="text-sm text-gray-600">Avg Events Found</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(discoveryStats.averageQualityScore * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Quality Score</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{discoveryStats.knownOrganizations}</div>
                  <div className="text-sm text-gray-600">Known Orgs</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Partnerships Tab */}
        {activeTab === 'partnerships' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Partnership Opportunities</h3>
            <div className="space-y-4">
              {partnerships.map(partnership => (
                <div key={partnership.organizer} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{partnership.organizer}</h4>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        partnership.potentialValue === 'high' ? 'bg-green-100 text-green-800' :
                        partnership.potentialValue === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {partnership.potentialValue} potential
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {partnership.eventCount} events
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {partnership.themes.map(theme => (
                      <span key={theme} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {theme}
                      </span>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors">
                      Contact
                    </button>
                    <button className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors">
                      View Events
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* API Usage Tab */}
        {activeTab === 'api' && usageStats && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Jina AI API Usage</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{usageStats.dailyBudget}</div>
                <div className="text-sm text-gray-600">Daily Budget</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{usageStats.usedBudget}</div>
                <div className="text-sm text-gray-600">Used Today</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{usageStats.remainingBudget}</div>
                <div className="text-sm text-gray-600">Remaining</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(usageStats.utilizationPercentage)}%
                </div>
                <div className="text-sm text-gray-600">Utilization</div>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>API Usage Progress</span>
                <span>{Math.round(usageStats.utilizationPercentage)}%</span>
              </div>
              <div className="bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${
                    usageStats.utilizationPercentage > 80 ? 'bg-red-500' :
                    usageStats.utilizationPercentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(usageStats.utilizationPercentage, 100)}%` }}
                ></div>
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              <p>Budget resets daily. Consider upgrading if consistently hitting limits.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}