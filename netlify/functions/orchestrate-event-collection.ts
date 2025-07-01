import { Handler } from '@netlify/functions';

interface CollectionResult {
  source: string;
  success: boolean;
  events_found: number;
  events_added: number;
  relevance_rate?: string;
  avg_relevance_score?: string;
  error?: string;
  duration_ms: number;
}

interface OrchestrationSummary {
  total_runtime_ms: number;
  sources_processed: number;
  sources_successful: number;
  total_events_found: number;
  total_events_added: number;
  overall_relevance_rate: string;
  avg_quality_score: string;
  deduplication_performed: boolean;
  duplicates_removed: number;
  final_unique_events: number;
  collection_results: CollectionResult[];
  errors: string[];
}

// Available event collection functions
const EVENT_SOURCES = [
  {
    name: 'eventbrite',
    function_name: 'scrape-eventbrite',
    description: 'Known QTIPOC+ organizations on Eventbrite',
    priority: 1,
    timeout_ms: 60000
  },
  {
    name: 'outsavvy',
    function_name: 'scrape-outsavvy',
    description: 'UK-focused search strategies on Outsavvy',
    priority: 1,
    timeout_ms: 60000
  },
  {
    name: 'rss_feeds',
    function_name: 'aggregate-rss-feeds',
    description: 'RSS feeds from QTIPOC+ organizations',
    priority: 2,
    timeout_ms: 45000
  },
  {
    name: 'web_scraping',
    function_name: 'scrape-broader-sources',
    description: 'Web scraping broader LGBTQ+ and Black cultural sources',
    priority: 3,
    timeout_ms: 120000
  }
];

async function callNetlifyFunction(functionName: string, timeout: number = 60000): Promise<CollectionResult> {
  const startTime = Date.now();
  
  try {
    console.log(`Calling ${functionName}...`);
    
    // Call the Netlify function endpoint
    const baseUrl = process.env.URL || 'http://localhost:8888';
    const functionUrl = `${baseUrl}/.netlify/functions/${functionName}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    const duration = Date.now() - startTime;
    
    return {
      source: functionName,
      success: result.success,
      events_found: result.events_found || 0,
      events_added: result.events_added || 0,
      relevance_rate: result.relevance_rate,
      avg_relevance_score: result.avg_relevance_score,
      error: result.success ? undefined : result.error,
      duration_ms: duration
    };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    return {
      source: functionName,
      success: false,
      events_found: 0,
      events_added: 0,
      error: error.message,
      duration_ms: duration
    };
  }
}

async function performDeduplication(): Promise<{ success: boolean; duplicates_removed: number; unique_events: number; error?: string }> {
  try {
    console.log('Performing event deduplication...');
    
    const baseUrl = process.env.URL || 'http://localhost:8888';
    const dedupeUrl = `${baseUrl}/.netlify/functions/deduplicate-events`;
    
    const response = await fetch(dedupeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`Deduplication failed: HTTP ${response.status}`);
    }
    
    const result = await response.json();
    
    return {
      success: result.success,
      duplicates_removed: result.total_duplicates_removed || 0,
      unique_events: result.unique_events_remaining || 0,
      error: result.success ? undefined : result.error
    };
    
  } catch (error) {
    return {
      success: false,
      duplicates_removed: 0,
      unique_events: 0,
      error: error.message
    };
  }
}

async function logOrchestrationSession(summary: OrchestrationSummary) {
  try {
    const googleApiKey = process.env.GOOGLE_API_KEY;
    const sheetId = process.env.GOOGLE_SHEET_ID;
    
    if (!googleApiKey || !sheetId) {
      console.warn('Google Sheets logging not configured');
      return;
    }
    
    // Log to OrchestrationLogs sheet
    const logUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/OrchestrationLogs:append?valueInputOption=RAW&key=${googleApiKey}`;
    const logValues = [[
      Date.now().toString(), // session_id
      new Date().toISOString(), // timestamp
      summary.total_runtime_ms,
      summary.sources_processed,
      summary.sources_successful,
      summary.total_events_found,
      summary.total_events_added,
      summary.overall_relevance_rate,
      summary.avg_quality_score,
      summary.deduplication_performed ? 'true' : 'false',
      summary.duplicates_removed,
      summary.final_unique_events,
      summary.errors.length > 0 ? summary.errors.join('; ') : '',
      'orchestrated_collection' // source type
    ]];
    
    await fetch(logUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: logValues })
    });
    
    console.log('Successfully logged orchestration session to Google Sheets');
  } catch (error) {
    console.warn('Failed to log orchestration session:', error.message);
  }
}

export const handler: Handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  const orchestrationStart = Date.now();
  console.log('🚀 Starting orchestrated event collection...');

  try {
    const collectionResults: CollectionResult[] = [];
    const errors: string[] = [];
    
    // Get collection strategy from query parameters
    const queryParams = event.queryStringParameters || {};
    const strategy = queryParams.strategy || 'comprehensive'; // 'comprehensive', 'priority_only', 'fast'
    const forceDeduplication = queryParams.force_deduplication === 'true';
    
    let sourcesToProcess = EVENT_SOURCES;
    
    // Filter sources based on strategy
    switch (strategy) {
      case 'priority_only':
        sourcesToProcess = EVENT_SOURCES.filter(s => s.priority === 1);
        break;
      case 'fast':
        sourcesToProcess = EVENT_SOURCES.filter(s => s.priority <= 2);
        break;
      case 'comprehensive':
      default:
        // Use all sources
        break;
    }
    
    console.log(`Using strategy: ${strategy}, processing ${sourcesToProcess.length} sources`);
    
    // Collect events from all sources
    // Priority 1 sources run in parallel, then Priority 2, then Priority 3
    const priorityGroups = [1, 2, 3].map(priority => 
      sourcesToProcess.filter(source => source.priority === priority)
    ).filter(group => group.length > 0);
    
    for (const priorityGroup of priorityGroups) {
      console.log(`Processing priority ${priorityGroup[0].priority} sources...`);
      
      // Run sources in the same priority group in parallel
      const promises = priorityGroup.map(source => 
        callNetlifyFunction(source.function_name, source.timeout_ms)
      );
      
      const results = await Promise.all(promises);
      collectionResults.push(...results);
      
      // Collect errors
      results.forEach(result => {
        if (!result.success && result.error) {
          errors.push(`${result.source}: ${result.error}`);
        }
      });
      
      // Short delay between priority groups
      if (priorityGroups.indexOf(priorityGroup) < priorityGroups.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Calculate collection metrics
    const successfulSources = collectionResults.filter(r => r.success).length;
    const totalEventsFound = collectionResults.reduce((sum, r) => sum + r.events_found, 0);
    const totalEventsAdded = collectionResults.reduce((sum, r) => sum + r.events_added, 0);
    const overallRelevanceRate = totalEventsFound > 0 
      ? ((totalEventsAdded / totalEventsFound) * 100).toFixed(1) + '%' 
      : '0%';
    
    // Perform deduplication if we have events or if forced
    let deduplicationResult = {
      success: false,
      duplicates_removed: 0,
      unique_events: totalEventsAdded,
      error: 'Deduplication skipped - no events to process'
    };
    
    if (totalEventsAdded > 0 || forceDeduplication) {
      console.log('🔍 Starting deduplication process...');
      deduplicationResult = await performDeduplication();
      
      if (!deduplicationResult.success && deduplicationResult.error) {
        errors.push(`Deduplication: ${deduplicationResult.error}`);
      }
    }
    
    const totalRuntime = Date.now() - orchestrationStart;
    
    // Create orchestration summary
    const summary: OrchestrationSummary = {
      total_runtime_ms: totalRuntime,
      sources_processed: sourcesToProcess.length,
      sources_successful: successfulSources,
      total_events_found: totalEventsFound,
      total_events_added: totalEventsAdded,
      overall_relevance_rate: overallRelevanceRate,
      avg_quality_score: '0', // Would be calculated from deduplication results
      deduplication_performed: deduplicationResult.success,
      duplicates_removed: deduplicationResult.duplicates_removed,
      final_unique_events: deduplicationResult.unique_events,
      collection_results: collectionResults,
      errors: errors
    };
    
    // Log the orchestration session
    await logOrchestrationSession(summary);
    
    console.log(`✅ Orchestration completed in ${totalRuntime}ms`);
    console.log(`📊 Summary: ${totalEventsFound} found, ${totalEventsAdded} added, ${deduplicationResult.unique_events} unique`);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        strategy_used: strategy,
        orchestration_summary: summary,
        recommendations: generateRecommendations(summary)
      })
    };

  } catch (error) {
    console.error('❌ Orchestration failed:', error);
    
    const totalRuntime = Date.now() - orchestrationStart;
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        runtime_ms: totalRuntime,
        partial_results: collectionResults || []
      })
    };
  }
};

function generateRecommendations(summary: OrchestrationSummary): string[] {
  const recommendations: string[] = [];
  
  // Performance recommendations
  if (summary.total_runtime_ms > 180000) { // > 3 minutes
    recommendations.push('Consider using "fast" strategy for quicker results');
  }
  
  // Source reliability recommendations
  const failedSources = summary.collection_results.filter(r => !r.success);
  if (failedSources.length > 0) {
    recommendations.push(`${failedSources.length} sources failed - check API credentials and network connectivity`);
  }
  
  // Data quality recommendations
  if (summary.final_unique_events === 0) {
    recommendations.push('No events collected - verify API keys and search strategies');
  } else if (summary.duplicates_removed > summary.final_unique_events) {
    recommendations.push('High duplication rate - consider refining source selection');
  }
  
  // Collection efficiency recommendations
  const relevanceRate = parseFloat(summary.overall_relevance_rate);
  if (relevanceRate < 20) {
    recommendations.push('Low relevance rate - consider updating keyword strategies');
  } else if (relevanceRate > 80) {
    recommendations.push('High relevance rate - consider expanding search terms for broader coverage');
  }
  
  // Scheduling recommendations
  if (summary.sources_successful === summary.sources_processed && summary.final_unique_events > 0) {
    recommendations.push('Collection successful - consider scheduling regular runs');
  }
  
  return recommendations;
}