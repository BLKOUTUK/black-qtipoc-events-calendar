import { Handler } from '@netlify/functions';

interface Event {
  id: string;
  name: string;
  description: string;
  event_date: string;
  location: string;
  source: string;
  source_url: string;
  organizer_name: string;
  tags: string;
  status: string;
  price: string;
  image_url: string;
  scraped_date: string;
  relevance_score?: number;
}

interface DeduplicationResult {
  duplicates: Event[][];
  unique_events: Event[];
  quality_scores: { [key: string]: number };
  merge_suggestions: Array<{
    primary_event: Event;
    duplicate_events: Event[];
    confidence: number;
  }>;
}

// Fuzzy string matching for deduplication
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  
  const maxLength = Math.max(s1.length, s2.length);
  if (maxLength === 0) return 1;
  
  const distance = levenshteinDistance(s1, s2);
  return (maxLength - distance) / maxLength;
}

// Extract date components for comparison
function normalizeDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  try {
    // Try parsing as ISO string first
    let date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date;
    }
    
    // Try common date formats
    const formats = [
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/,  // MM/DD/YYYY or DD/MM/YYYY
      /(\d{1,2})(st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
      /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/  // YYYY-MM-DD
    ];
    
    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        // Basic date parsing - in production would use a proper date parsing library
        date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

function dateSimilarity(date1Str: string, date2Str: string): number {
  const date1 = normalizeDate(date1Str);
  const date2 = normalizeDate(date2Str);
  
  if (!date1 || !date2) return 0;
  
  const timeDiff = Math.abs(date1.getTime() - date2.getTime());
  const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
  
  // Same day = 1.0, 1 day apart = 0.5, 7 days apart = 0.1, etc.
  if (daysDiff === 0) return 1.0;
  if (daysDiff <= 1) return 0.8;
  if (daysDiff <= 7) return 0.3;
  return 0;
}

// Location similarity with fuzzy matching
function locationSimilarity(loc1: string, loc2: string): number {
  if (!loc1 || !loc2) return 0;
  
  const l1 = loc1.toLowerCase().trim();
  const l2 = loc2.toLowerCase().trim();
  
  // Exact match
  if (l1 === l2) return 1.0;
  
  // Check if one location contains the other
  if (l1.includes(l2) || l2.includes(l1)) return 0.8;
  
  // Extract common location indicators
  const commonAreas = ['london', 'manchester', 'birmingham', 'bristol', 'leeds', 'brighton'];
  const area1 = commonAreas.find(area => l1.includes(area));
  const area2 = commonAreas.find(area => l2.includes(area));
  
  if (area1 && area2 && area1 === area2) return 0.6;
  
  // Fuzzy string similarity for addresses
  return calculateSimilarity(l1, l2);
}

// Calculate overall similarity between two events
function calculateEventSimilarity(event1: Event, event2: Event): number {
  const titleSim = calculateSimilarity(event1.name, event2.name);
  const descSim = calculateSimilarity(event1.description, event2.description);
  const dateSim = dateSimilarity(event1.event_date, event2.event_date);
  const locationSim = locationSimilarity(event1.location, event2.location);
  const organizerSim = calculateSimilarity(event1.organizer_name, event2.organizer_name);
  
  // Weighted similarity calculation
  const weights = {
    title: 0.35,
    description: 0.20,
    date: 0.25,
    location: 0.15,
    organizer: 0.05
  };
  
  const totalSimilarity = 
    (titleSim * weights.title) +
    (descSim * weights.description) +
    (dateSim * weights.date) +
    (locationSim * weights.location) +
    (organizerSim * weights.organizer);
  
  return totalSimilarity;
}

// Calculate quality score for an event
function calculateQualityScore(event: Event): number {
  let score = 0;
  
  // Content completeness
  if (event.name && event.name.length > 10) score += 20;
  if (event.description && event.description.length > 50) score += 15;
  if (event.event_date) score += 15;
  if (event.location && event.location !== 'Location TBD') score += 10;
  if (event.organizer_name) score += 10;
  if (event.source_url && event.source_url.startsWith('http')) score += 10;
  if (event.price && event.price !== 'See event page') score += 5;
  if (event.image_url) score += 5;
  if (event.tags) score += 5;
  
  // Source credibility
  const sourceCredibility = {
    'eventbrite': 15,
    'outsavvy': 15,
    'rss_feed': 12,
    'web_scraping': 8
  };
  score += sourceCredibility[event.source] || 5;
  
  // Relevance score bonus
  if (event.relevance_score) {
    score += Math.min(event.relevance_score / 2, 15);
  }
  
  return Math.min(score, 100); // Cap at 100
}

// Find duplicate events using similarity threshold
function findDuplicates(events: Event[], threshold: number = 0.7): Event[][] {
  const duplicateGroups: Event[][] = [];
  const processed = new Set<string>();
  
  for (let i = 0; i < events.length; i++) {
    if (processed.has(events[i].id)) continue;
    
    const currentGroup = [events[i]];
    processed.add(events[i].id);
    
    for (let j = i + 1; j < events.length; j++) {
      if (processed.has(events[j].id)) continue;
      
      const similarity = calculateEventSimilarity(events[i], events[j]);
      
      if (similarity >= threshold) {
        currentGroup.push(events[j]);
        processed.add(events[j].id);
      }
    }
    
    if (currentGroup.length > 1) {
      duplicateGroups.push(currentGroup);
    }
  }
  
  return duplicateGroups;
}

// Select the best event from a group of duplicates
function selectBestEvent(events: Event[]): Event {
  const eventScores = events.map(event => ({
    event,
    quality: calculateQualityScore(event)
  }));
  
  // Sort by quality score (descending)
  eventScores.sort((a, b) => b.quality - a.quality);
  
  return eventScores[0].event;
}

// Merge information from duplicate events
function mergeEventInformation(primaryEvent: Event, duplicates: Event[]): Event {
  const merged = { ...primaryEvent };
  
  // Use the most complete information from any duplicate
  for (const duplicate of duplicates) {
    if (!merged.description && duplicate.description) {
      merged.description = duplicate.description;
    }
    if (!merged.image_url && duplicate.image_url) {
      merged.image_url = duplicate.image_url;
    }
    if (!merged.price && duplicate.price && duplicate.price !== 'See event page') {
      merged.price = duplicate.price;
    }
    
    // Combine tags
    const existingTags = merged.tags ? merged.tags.split(', ') : [];
    const newTags = duplicate.tags ? duplicate.tags.split(', ') : [];
    const combinedTags = [...new Set([...existingTags, ...newTags])];
    merged.tags = combinedTags.join(', ');
  }
  
  return merged;
}

async function fetchEventsFromGoogleSheets(): Promise<Event[]> {
  const googleApiKey = process.env.GOOGLE_API_KEY;
  const sheetId = process.env.GOOGLE_SHEET_ID;
  
  if (!googleApiKey || !sheetId) {
    throw new Error('Google Sheets credentials not configured');
  }
  
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Events?key=${googleApiKey}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google Sheets API error: ${response.status}`);
    }
    
    const data = await response.json();
    const rows = data.values || [];
    
    if (rows.length <= 1) return []; // No data or just headers
    
    // Skip header row and convert to Event objects
    return rows.slice(1).map((row, index) => ({
      id: row[0] || `row_${index}`,
      name: row[1] || '',
      description: row[2] || '',
      event_date: row[3] || '',
      location: row[4] || '',
      source: row[5] || '',
      source_url: row[6] || '',
      organizer_name: row[7] || '',
      tags: row[8] || '',
      status: row[9] || 'draft',
      price: row[10] || '',
      image_url: row[11] || '',
      scraped_date: row[12] || '',
      relevance_score: parseFloat(row[13]) || undefined
    }));
  } catch (error) {
    console.error('Error fetching events from Google Sheets:', error);
    throw error;
  }
}

async function updateGoogleSheetsWithDeduplication(deduplicationResult: DeduplicationResult) {
  const googleApiKey = process.env.GOOGLE_API_KEY;
  const sheetId = process.env.GOOGLE_SHEET_ID;
  
  if (!googleApiKey || !sheetId) {
    console.warn('Google Sheets credentials not configured');
    return;
  }
  
  try {
    // Clear existing Events sheet
    const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Events:clear?key=${googleApiKey}`;
    await fetch(clearUrl, { method: 'POST' });
    
    // Add header row and unique events
    const headers = [
      'ID', 'Name', 'Description', 'Event Date', 'Location', 'Source', 'Source URL',
      'Organizer Name', 'Tags', 'Status', 'Price', 'Image URL', 'Scraped Date',
      'Relevance Score', 'Quality Score', 'Is Merged'
    ];
    
    const values = [headers];
    
    deduplicationResult.unique_events.forEach(event => {
      const qualityScore = deduplicationResult.quality_scores[event.id] || 0;
      const isMerged = deduplicationResult.merge_suggestions.some(
        suggestion => suggestion.primary_event.id === event.id
      );
      
      values.push([
        event.id,
        event.name,
        event.description,
        event.event_date,
        event.location,
        event.source,
        event.source_url,
        event.organizer_name,
        event.tags,
        event.status,
        event.price,
        event.image_url,
        event.scraped_date,
        event.relevance_score?.toString() || '',
        qualityScore.toString(),
        isMerged ? 'true' : 'false'
      ]);
    });
    
    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Events?valueInputOption=RAW&key=${googleApiKey}`;
    await fetch(updateUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values })
    });
    
    console.log('Successfully updated Google Sheets with deduplicated events');
  } catch (error) {
    console.error('Error updating Google Sheets:', error);
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

  try {
    console.log('Fetching events from Google Sheets...');
    const events = await fetchEventsFromGoogleSheets();
    
    if (events.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'No events found to deduplicate',
          events_processed: 0,
          duplicates_found: 0,
          unique_events: 0
        })
      };
    }
    
    console.log(`Processing ${events.length} events for deduplication...`);
    
    // Find duplicate groups
    const duplicateGroups = findDuplicates(events, 0.7);
    
    // Calculate quality scores for all events
    const qualityScores: { [key: string]: number } = {};
    events.forEach(event => {
      qualityScores[event.id] = calculateQualityScore(event);
    });
    
    // Create merge suggestions and unique events list
    const mergeSuggestions = [];
    const uniqueEvents: Event[] = [];
    const processedIds = new Set<string>();
    
    // Process duplicate groups
    for (const group of duplicateGroups) {
      const bestEvent = selectBestEvent(group);
      const otherEvents = group.filter(e => e.id !== bestEvent.id);
      const mergedEvent = mergeEventInformation(bestEvent, otherEvents);
      
      mergeSuggestions.push({
        primary_event: mergedEvent,
        duplicate_events: otherEvents,
        confidence: group.length > 2 ? 0.9 : 0.8
      });
      
      uniqueEvents.push(mergedEvent);
      group.forEach(e => processedIds.add(e.id));
    }
    
    // Add non-duplicate events
    events.forEach(event => {
      if (!processedIds.has(event.id)) {
        uniqueEvents.push(event);
      }
    });
    
    const deduplicationResult: DeduplicationResult = {
      duplicates: duplicateGroups,
      unique_events: uniqueEvents,
      quality_scores: qualityScores,
      merge_suggestions: mergeSuggestions
    };
    
    // Update Google Sheets with deduplicated results
    await updateGoogleSheetsWithDeduplication(deduplicationResult);
    
    // Calculate statistics
    const totalDuplicates = duplicateGroups.reduce((sum, group) => sum + group.length - 1, 0);
    const avgQualityScore = Object.values(qualityScores).reduce((a, b) => a + b, 0) / Object.values(qualityScores).length;
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        events_processed: events.length,
        duplicate_groups_found: duplicateGroups.length,
        total_duplicates_removed: totalDuplicates,
        unique_events_remaining: uniqueEvents.length,
        merge_suggestions: mergeSuggestions.length,
        avg_quality_score: avgQualityScore.toFixed(1),
        deduplication_rate: events.length > 0 ? (totalDuplicates / events.length * 100).toFixed(1) + '%' : '0%',
        high_quality_events: Object.values(qualityScores).filter(score => score >= 70).length
      })
    };

  } catch (error) {
    console.error('Deduplication error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        events_processed: 0,
        duplicates_found: 0
      })
    };
  }
};