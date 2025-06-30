import React, { useState } from 'react';
import { RefreshCw, CheckCircle, AlertCircle, XCircle, Target, TrendingUp } from 'lucide-react';
import { supabaseEventService } from '../services/supabaseEventService';

interface TestResult {
  source: string;
  success: boolean;
  events_found: number;
  events_added: number;
  relevance_rate?: string;
  avg_relevance_score?: string;
  error?: string;
  duration: number;
}

export const ScrapingTestDashboard: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isTestingAll, setIsTestingAll] = useState(false);
  const [isTesting, setIsTesting] = useState<Record<string, boolean>>({});

  const testSingleSource = async (source: string) => {
    setIsTesting(prev => ({ ...prev, [source]: true }));
    const startTime = Date.now();

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scrape-${source}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      const duration = Date.now() - startTime;

      const result: TestResult = {
        source,
        success: data.success,
        events_found: data.events_found || 0,
        events_added: data.events_added || 0,
        relevance_rate: data.relevance_rate,
        avg_relevance_score: data.avg_relevance_score,
        error: data.error,
        duration
      };

      setTestResults(prev => {
        const filtered = prev.filter(r => r.source !== source);
        return [...filtered, result].sort((a, b) => a.source.localeCompare(b.source));
      });

    } catch (error) {
      const result: TestResult = {
        source,
        success: false,
        events_found: 0,
        events_added: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      };

      setTestResults(prev => {
        const filtered = prev.filter(r => r.source !== source);
        return [...filtered, result];
      });
    } finally {
      setIsTesting(prev => ({ ...prev, [source]: false }));
    }
  };

  const testAllSources = async () => {
    setIsTestingAll(true);
    setTestResults([]);

    try {
      const response = await supabaseEventService.scrapeEvents();
      // The scrapeEvents method calls the combined scraper
      // Results will be populated by individual source tests
    } catch (error) {
      console.error('Error testing all sources:', error);
    } finally {
      setIsTestingAll(false);
    }
  };

  const getStatusIcon = (result: TestResult) => {
    if (result.success && result.events_added > 0) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    } else if (result.success && result.events_found > 0) {
      return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    } else if (result.success) {
      return <AlertCircle className="w-5 h-5 text-blue-600" />;
    } else {
      return <XCircle className="w-5 h-5 text-red-600" />;
    }
  };

  const getStatusMessage = (result: TestResult) => {
    if (result.success && result.events_added > 0) {
      return `Success: Added ${result.events_added} events`;
    } else if (result.success && result.events_found > 0) {
      return `Found ${result.events_found} events, none were relevant enough`;
    } else if (result.success) {
      return 'Connected successfully, no events found';
    } else {
      return `Error: ${result.error}`;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Target className="w-5 h-5 mr-2 text-teal-600" />
          Scraping System Test Dashboard
        </h3>
        <button
          onClick={testAllSources}
          disabled={isTestingAll}
          className={`flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors duration-200 ${
            isTestingAll ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isTestingAll ? 'animate-spin' : ''}`} />
          {isTestingAll ? 'Testing All...' : 'Test All Sources'}
        </button>
      </div>

      {/* Individual Source Tests */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {['eventbrite', 'outsavvy', 'facebook'].map(source => (
          <div key={source} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900 capitalize">{source}</h4>
              <button
                onClick={() => testSingleSource(source)}
                disabled={isTesting[source]}
                className={`flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200 ${
                  isTesting[source] ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${isTesting[source] ? 'animate-spin' : ''}`} />
                {isTesting[source] ? 'Testing...' : 'Test'}
              </button>
            </div>

            {testResults.find(r => r.source === source) && (
              <div className="space-y-2">
                <div className="flex items-center">
                  {getStatusIcon(testResults.find(r => r.source === source)!)}
                  <span className="ml-2 text-sm text-gray-600">
                    {getStatusMessage(testResults.find(r => r.source === source)!)}
                  </span>
                </div>
                
                {testResults.find(r => r.source === source)!.success && (
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>Duration: {testResults.find(r => r.source === source)!.duration}ms</div>
                    {testResults.find(r => r.source === source)!.relevance_rate && (
                      <div>Relevance: {testResults.find(r => r.source === source)!.relevance_rate}</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Test Results Summary */}
      {testResults.length > 0 && (
        <div className="border-t pt-6">
          <h4 className="font-medium text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-4 h-4 mr-2" />
            Test Results Summary
          </h4>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Found
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Added
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Relevance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {testResults.map((result) => (
                  <tr key={result.source}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                      {result.source}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        {getStatusIcon(result)}
                        <span className="ml-2">
                          {result.success ? 'Success' : 'Failed'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {result.events_found}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={result.events_added > 0 ? 'text-green-600 font-medium' : ''}>
                        {result.events_added}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {result.relevance_rate || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(result.duration / 1000).toFixed(1)}s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Configuration Status */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h5 className="font-medium text-gray-900 mb-2">Configuration Status</h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center">
            <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
            <span>Eventbrite API: Configured</span>
          </div>
          <div className="flex items-center">
            <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
            <span>Outsavvy API: Configured</span>
          </div>
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 text-yellow-600 mr-2" />
            <span>Facebook API: Pending Review</span>
          </div>
        </div>
      </div>

      {/* Testing Tips */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h5 className="font-medium text-blue-900 mb-2">Testing Tips</h5>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Test individual sources first to isolate any issues</li>
          <li>• Check Supabase Edge Functions logs for detailed error messages</li>
          <li>• Verify API tokens are set in Supabase environment variables</li>
          <li>• Monitor rate limits - Eventbrite allows 1000 requests/hour</li>
          <li>• Review relevance scores to fine-tune keyword matching</li>
        </ul>
      </div>
    </div>
  );
};