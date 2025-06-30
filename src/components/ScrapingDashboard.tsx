import React, { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, Target, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { googleSheetsService } from '../services/googleSheetsService';

interface ScrapingMetrics {
  totalEvents: number;
  relevantEvents: number;
  addedEvents: number;
  relevanceRate: string;
  avgRelevanceScore: string;
  lastScrapeTime: string;
  sources: {
    eventbrite: { found: number; added: number; status: string };
    facebook: { found: number; added: number; status: string };
    outsavvy: { found: number; added: number; status: string };
  };
}

export const ScrapingDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<ScrapingMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isScraping, setIsScraping] = useState(false);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setIsLoading(true);
    try {
      const logs = await googleSheetsService.getScrapingLogs();
      setMetrics({
        totalEvents: 150,
        relevantEvents: 45,
        addedEvents: 23,
        relevanceRate: '30.0%',
        avgRelevanceScore: '15.2',
        lastScrapeTime: logs[0]?.created_at || new Date().toISOString(),
        sources: {
          eventbrite: { found: 120, added: 18, status: 'success' },
          facebook: { found: 25, added: 4, status: 'partial' },
          outsavvy: { found: 5, added: 1, status: 'success' }
        }
      });
    } catch (error) {
      console.error('Error loading scraping metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScrapeAll = async () => {
    setIsScraping(true);
    try {
      await googleSheetsService.scrapeEvents();
      await loadMetrics();
    } catch (error) {
      console.error('Error scraping events:', error);
    } finally {
      setIsScraping(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'partial':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Target className="w-5 h-5 mr-2 text-teal-600" />
          Event Discovery Dashboard
        </h3>
        <button
          onClick={handleScrapeAll}
          disabled={isScraping}
          className={`flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors duration-200 ${
            isScraping ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isScraping ? 'animate-spin' : ''}`} />
          {isScraping ? 'Discovering...' : 'Discover Events'}
        </button>
      </div>

      {/* Google Sheets Integration Notice */}
      <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-medium text-green-900 mb-2">📊 Google Sheets Integration</h4>
        <p className="text-sm text-green-800">
          Discovered events are automatically added to the "Events" sheet, and scraping logs 
          are recorded in the "ScrapingLogs" sheet for full transparency.
        </p>
      </div>

      {metrics && (
        <>
          {/* Overall Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Events Found</p>
                  <p className="text-2xl font-bold text-blue-900">{metrics.totalEvents}</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center">
                <Target className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-green-800">Relevant</p>
                  <p className="text-2xl font-bold text-green-900">{metrics.relevantEvents}</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-purple-800">Added</p>
                  <p className="text-2xl font-bold text-purple-900">{metrics.addedEvents}</p>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-orange-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-orange-800">Relevance Rate</p>
                  <p className="text-2xl font-bold text-orange-900">{metrics.relevanceRate}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Source Breakdown */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Source Performance</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(metrics.sources).map(([source, data]) => (
                <div key={source} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-900 capitalize">{source}</h5>
                    {getStatusIcon(data.status)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Found:</span>
                      <span className="font-medium">{data.found}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Added:</span>
                      <span className="font-medium text-green-600">{data.added}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Rate:</span>
                      <span className="font-medium">
                        {data.found > 0 ? ((data.added / data.found) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Algorithm Insights */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Discovery Algorithm Insights</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600 mb-1">Average Relevance Score:</p>
                <p className="font-medium text-lg">{metrics.avgRelevanceScore}/100</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Last Discovery Run:</p>
                <p className="font-medium">
                  {new Date(metrics.lastScrapeTime).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-500">
              <p>
                The algorithm uses weighted keyword matching, community organization tracking, 
                and relevance scoring to identify Black QTIPOC+ events across multiple platforms.
                All results are stored in Google Sheets for community transparency.
              </p>
            </div>
          </div>

          {/* Demo Notice */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h5 className="font-medium text-blue-900 mb-2">Demo Mode</h5>
            <p className="text-sm text-blue-800">
              This is a demonstration of the event discovery system. In production, this would connect to 
              real APIs (Eventbrite, Facebook, Outsavvy) and automatically populate your Google Sheet with 
              discovered events for community moderation.
            </p>
          </div>
        </>
      )}
    </div>
  );
};