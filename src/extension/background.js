/**
 * BLKOUT Content Curator - Background Service Worker
 * Handles authentication, API calls, and cross-tab communication
 */

// Configuration constants
const CONFIG = {
  SUPABASE_URL: 'https://bgjengudzfickgomjqmz.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnamVuZ3VkemZpY2tnb21qcW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MTI3NjcsImV4cCI6MjA3MTE4ODc2N30.kYQ2oFuQBGmu4V_dnj_1zDMDVsd-qpDZJwNvswzO6M0',
  IVOR_API_URL: 'https://ivor.blkoutuk.cloud',
  GOOGLE_SHEET_ID: '', // Will be set from storage or environment
  TEAMS: {
    EVENTS: 'events',
    NEWS: 'news',
    ADMIN: 'admin'
  },
  CONTENT_TYPES: {
    EVENT: 'event',
    NEWS: 'news',
    STORY: 'story'
  }
};

// Authentication state management
let authToken = null;
let userProfile = null;

/**
 * Initialize extension on startup
 */
chrome.runtime.onStartup.addListener(async () => {
  console.log('BLKOUT Content Curator starting up...');
  await initializeExtension();
});

chrome.runtime.onInstalled.addListener(async () => {
  console.log('BLKOUT Content Curator installed/updated');
  await initializeExtension();
});

/**
 * Initialize extension settings and user data
 */
async function initializeExtension() {
  try {
    // Load saved user profile and team assignment
    const result = await chrome.storage.sync.get(['userProfile', 'teamAssignment', 'authToken']);

    userProfile = result.userProfile || null;
    authToken = result.authToken || null;

    // Set default settings if first install
    if (!result.teamAssignment) {
      await chrome.storage.sync.set({
        teamAssignment: CONFIG.TEAMS.EVENTS, // Default to events team
        contentDetectionEnabled: true,
        autoSubmissionEnabled: false,
        liberationScoreThreshold: 0.7
      });
    }

    console.log('Extension initialized successfully');
  } catch (error) {
    console.error('Failed to initialize extension:', error);
  }
}

/**
 * Handle messages from content scripts and popup
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);

  switch (message.type) {
    case 'AUTHENTICATE_USER':
      handleAuthentication()
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true; // Indicates async response

    case 'SUBMIT_CONTENT':
      handleContentSubmission(message.data)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true;

    case 'GET_USER_PROFILE':
      sendResponse({ userProfile, authToken });
      break;

    case 'ANALYZE_CONTENT':
      analyzePageContent(message.data)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true;

    case 'UPDATE_TEAM_ASSIGNMENT':
      updateTeamAssignment(message.teamId)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true;

    default:
      console.warn('Unknown message type:', message.type);
      sendResponse({ error: 'Unknown message type' });
  }
});

/**
 * Handle external messages from BrowserAct automation
 */
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  console.log('[BrowserAct] External message received:', message, 'from:', sender.url);

  // Validate sender origin (security check)
  const allowedOrigins = [
    'https://blkout-events-calendar.netlify.app',
    'https://browseract.com',
    'https://www.browseract.com'
  ];

  const senderOrigin = new URL(sender.url || '').origin;
  if (!allowedOrigins.some(origin => senderOrigin.startsWith(origin))) {
    console.warn('[BrowserAct] Rejected message from unauthorized origin:', senderOrigin);
    sendResponse({ error: 'Unauthorized origin' });
    return;
  }

  if (message.action === 'submit_content' || message.action === 'submit_browseract_content') {
    handleBrowserActSubmission(message.data)
      .then(sendResponse)
      .catch(error => sendResponse({ error: error.message }));
    return true; // Indicates async response
  } else if (message.action === 'batch_submit') {
    handleBrowserActBatchSubmission(message.data)
      .then(sendResponse)
      .catch(error => sendResponse({ error: error.message }));
    return true;
  } else {
    console.warn('[BrowserAct] Unknown action:', message.action);
    sendResponse({ error: 'Unknown action' });
  }
});

/**
 * Handle Google OAuth authentication
 */
async function handleAuthentication() {
  try {
    console.log('Starting authentication process...');

    // Use Chrome identity API for OAuth
    const token = await new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(token);
        }
      });
    });

    if (!token) {
      throw new Error('Failed to obtain authentication token');
    }

    // Get user profile information
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!userInfoResponse.ok) {
      throw new Error('Failed to fetch user profile');
    }

    const userInfo = await userInfoResponse.json();

    // Store authentication data
    authToken = token;
    userProfile = {
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      authenticatedAt: Date.now()
    };

    await chrome.storage.sync.set({
      authToken: token,
      userProfile: userProfile
    });

    console.log('Authentication successful:', userProfile);

    return {
      success: true,
      userProfile: userProfile
    };

  } catch (error) {
    console.error('Authentication failed:', error);
    throw error;
  }
}

/**
 * Submit content to Supabase database
 */
async function handleContentSubmission(contentData) {
  try {
    console.log('Submitting content to Supabase:', contentData);

    // Get team configuration
    const { teamAssignment } = await chrome.storage.sync.get(['teamAssignment']);

    // Prepare submission data based on content type
    const submissionData = prepareSubmissionData(contentData, teamAssignment);

    // Submit to Supabase
    const response = await submitToSupabase(submissionData, teamAssignment);

    // Log submission for tracking
    await logSubmission(contentData, response);

    return {
      success: true,
      submissionId: response.id,
      teamAssignment: teamAssignment,
      timestamp: Date.now()
    };

  } catch (error) {
    console.error('Content submission failed:', error);
    throw error;
  }
}

/**
 * Analyze page content for events and news
 */
async function analyzePageContent(pageData) {
  try {
    console.log('Analyzing page content:', pageData.url);

    const analysis = {
      contentType: null,
      confidence: 0,
      liberationScore: 0,
      extractedData: {},
      detectedElements: []
    };

    // Event detection patterns
    const eventPatterns = [
      /event|workshop|meetup|conference|gathering|celebration/i,
      /date|time|location|venue|address/i,
      /register|rsvp|tickets|admission/i
    ];

    // News detection patterns
    const newsPatterns = [
      /article|news|story|report|editorial/i,
      /published|author|journalist|reporter/i,
      /breaking|update|announcement/i
    ];

    // Liberation values patterns
    const liberationPatterns = [
      /black|african|diaspora|afro/i,
      /queer|lgbtq|trans|gay|lesbian|bisexual/i,
      /justice|liberation|equity|empowerment/i,
      /community|mutual aid|solidarity|collective/i,
      /anti-racist|decolonial|radical|revolutionary/i
    ];

    const content = pageData.content.toLowerCase();

    // Calculate pattern matches
    const eventScore = countPatternMatches(content, eventPatterns);
    const newsScore = countPatternMatches(content, newsPatterns);
    const liberationScore = countPatternMatches(content, liberationPatterns) / liberationPatterns.length;

    // Determine content type
    if (eventScore > newsScore) {
      analysis.contentType = CONFIG.CONTENT_TYPES.EVENT;
      analysis.confidence = Math.min(eventScore / eventPatterns.length, 1);
      analysis.extractedData = extractEventData(pageData);
    } else if (newsScore > 0) {
      analysis.contentType = CONFIG.CONTENT_TYPES.NEWS;
      analysis.confidence = Math.min(newsScore / newsPatterns.length, 1);
      analysis.extractedData = extractNewsData(pageData);
    }

    analysis.liberationScore = Math.min(liberationScore, 1);
    analysis.detectedElements = findRelevantElements(pageData);

    console.log('Content analysis complete:', analysis);
    return analysis;

  } catch (error) {
    console.error('Content analysis failed:', error);
    throw error;
  }
}

/**
 * Count pattern matches in content
 */
function countPatternMatches(content, patterns) {
  return patterns.reduce((count, pattern) => {
    const matches = content.match(pattern);
    return count + (matches ? matches.length : 0);
  }, 0);
}

/**
 * Extract event-specific data from page
 */
function extractEventData(pageData) {
  const data = {
    title: pageData.title || '',
    description: '',
    date: null,
    time: null,
    location: '',
    organizer: '',
    accessibility: '',
    cost: 'Free', // Default assumption for community events
    tags: []
  };

  // Extract date patterns
  const datePatterns = [
    /(\w+,?\s+)?(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}/i,
    /\d{1,2}\/\d{1,2}\/\d{2,4}/,
    /\d{4}-\d{2}-\d{2}/
  ];

  const content = pageData.content;
  for (const pattern of datePatterns) {
    const match = content.match(pattern);
    if (match) {
      data.date = match[0];
      break;
    }
  }

  // Extract time patterns
  const timePatterns = [
    /\d{1,2}:\d{2}\s*(am|pm)/i,
    /\d{1,2}\s*(am|pm)/i
  ];

  for (const pattern of timePatterns) {
    const match = content.match(pattern);
    if (match) {
      data.time = match[0];
      break;
    }
  }

  // Extract location information
  const locationPatterns = [
    /at\s+([^,\n]+)/i,
    /location:?\s*([^,\n]+)/i,
    /venue:?\s*([^,\n]+)/i
  ];

  for (const pattern of locationPatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      data.location = match[1].trim();
      break;
    }
  }

  // Extract cost/price information
  const costPatterns = [
    /price:?\s*([^,\n]+)/i,
    /cost:?\s*([^,\n]+)/i,
    /tickets?:?\s*([£$€]\d+(?:\.\d{2})?(?:\s*-\s*[£$€]\d+(?:\.\d{2})?)?)/i,
    /([£$€]\d+(?:\.\d{2})?(?:\s*-\s*[£$€]\d+(?:\.\d{2})?)?)/,
    /pay what you can/i,
    /donation/i,
    /free entry/i,
    /free admission/i
  ];

  for (const pattern of costPatterns) {
    const match = content.match(pattern);
    if (match) {
      const matchText = match[1] || match[0];
      if (/free/i.test(matchText)) {
        data.cost = 'Free';
      } else if (/pay what you can|donation/i.test(matchText)) {
        data.cost = 'Pay What You Can';
      } else {
        data.cost = matchText.trim();
      }
      break;
    }
  }

  return data;
}

/**
 * Extract news-specific data from page
 */
function extractNewsData(pageData) {
  const data = {
    title: pageData.title || '',
    author: '',
    publication: '',
    publishDate: null,
    excerpt: '',
    category: '',
    tags: []
  };

  // Extract author information
  const authorPatterns = [
    /by\s+([^,\n]+)/i,
    /author:?\s*([^,\n]+)/i,
    /written by\s+([^,\n]+)/i
  ];

  const content = pageData.content;
  for (const pattern of authorPatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      data.author = match[1].trim();
      break;
    }
  }

  // Extract publication date
  const datePatterns = [
    /published\s+([^,\n]+)/i,
    /\d{1,2}\/\d{1,2}\/\d{2,4}/,
    /\d{4}-\d{2}-\d{2}/
  ];

  for (const pattern of datePatterns) {
    const match = content.match(pattern);
    if (match) {
      data.publishDate = match[0];
      break;
    }
  }

  // Create excerpt from first paragraph or meta description
  const paragraphs = content.match(/<p[^>]*>([^<]+)<\/p>/gi);
  if (paragraphs && paragraphs.length > 0) {
    data.excerpt = paragraphs[0].replace(/<[^>]*>/g, '').trim().substring(0, 200) + '...';
  }

  return data;
}

/**
 * Find relevant DOM elements for content extraction
 */
function findRelevantElements(pageData) {
  const elements = [];

  // Common selectors for events and news
  const selectors = [
    '.event, .events',
    '.news, .article',
    '.date, .datetime',
    '.location, .venue',
    '.title, .headline',
    '.description, .summary',
    '.author, .byline',
    '.price, .cost'
  ];

  // This would be enhanced in the content script with actual DOM access
  elements.push({
    type: 'placeholder',
    selector: 'body',
    confidence: 0.5
  });

  return elements;
}


/**
 * Prepare submission data based on team and content type
 */
function prepareSubmissionData(contentData, teamId) {
  const baseData = {
    submittedBy: userProfile?.email || 'unknown',
    submittedAt: new Date().toISOString(),
    sourceUrl: contentData.url,
    liberationScore: contentData.liberationScore || 0,
    team: teamId
  };

  if (teamId === CONFIG.TEAMS.EVENTS) {
    return {
      ...baseData,
      eventTitle: contentData.title || '',
      eventDate: contentData.date || '',
      eventTime: contentData.time || '',
      eventLocation: contentData.location || '',
      eventDescription: contentData.description || '',
      eventOrganizer: contentData.organizer || '',
      eventCost: contentData.cost || 'Free',
      accessibility: contentData.accessibility || '',
      status: 'pending_review'
    };
  } else if (teamId === CONFIG.TEAMS.NEWS) {
    return {
      ...baseData,
      articleTitle: contentData.title || '',
      articleAuthor: contentData.author || '',
      publication: contentData.publication || '',
      publishDate: contentData.publishDate || '',
      excerpt: contentData.excerpt || '',
      category: contentData.category || 'community',
      status: 'pending_review'
    };
  }

  return baseData;
}

/**
 * Submit data to Supabase
 */
async function submitToSupabase(data, teamId) {
  try {
    let endpoint;
    let payload;

    if (teamId === CONFIG.TEAMS.EVENTS) {
      // Submit event to events table
      endpoint = `${CONFIG.SUPABASE_URL}/rest/v1/events`;
      payload = {
        title: data.eventTitle || '',
        date: data.eventDate || new Date().toISOString().split('T')[0],
        description: data.eventDescription || '',
        location: data.eventLocation || '',
        organizer: data.eventOrganizer || data.submittedBy || '',
        source: 'chrome-extension',
        url: data.sourceUrl || '',
        cost: data.eventCost || 'Free',
        tags: [],
        status: 'draft',
        submitted_by: data.submittedBy || 'chrome-extension'
      };
    } else if (teamId === CONFIG.TEAMS.NEWS) {
      // Submit article to articles table
      endpoint = `${CONFIG.SUPABASE_URL}/rest/v1/articles`;
      payload = {
        title: data.articleTitle || '',
        content: data.excerpt || '',
        author: data.articleAuthor || data.submittedBy || '',
        source_url: data.sourceUrl || '',
        status: 'draft',
        submitted_by: data.submittedBy || 'chrome-extension',
        published_at: data.publishDate || new Date().toISOString()
      };
    } else {
      throw new Error(`Unsupported team: ${teamId}`);
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'apikey': CONFIG.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Supabase API error: ${response.status} - ${error}`);
    }

    const result = await response.json();
    console.log('Supabase submission successful:', result);

    return Array.isArray(result) ? result[0] : result;

  } catch (error) {
    console.error('Supabase submission failed:', error);
    throw error;
  }
}

/**
 * Log submission for tracking and analytics
 */
async function logSubmission(contentData, response) {
  try {
    const { submissionLog = [] } = await chrome.storage.local.get(['submissionLog']);

    const logEntry = {
      id: `submission_${Date.now()}`,
      timestamp: Date.now(),
      url: contentData.url,
      contentType: contentData.contentType,
      liberationScore: contentData.liberationScore,
      team: contentData.team,
      success: true,
      responseId: response.spreadsheetId
    };

    submissionLog.push(logEntry);

    // Keep only last 100 submissions
    const trimmedLog = submissionLog.slice(-100);

    await chrome.storage.local.set({ submissionLog: trimmedLog });

    console.log('Submission logged:', logEntry);

  } catch (error) {
    console.error('Failed to log submission:', error);
  }
}

/**
 * Update user's team assignment
 */
async function updateTeamAssignment(teamId) {
  if (!Object.values(CONFIG.TEAMS).includes(teamId)) {
    throw new Error(`Invalid team ID: ${teamId}`);
  }

  await chrome.storage.sync.set({ teamAssignment: teamId });

  return {
    success: true,
    teamAssignment: teamId,
    timestamp: Date.now()
  };
}

/**
 * Handle BrowserAct content submission with IVOR AI moderation
 */
async function handleBrowserActSubmission(contentData) {
  try {
    console.log('[BrowserAct] Processing submission:', contentData.title);

    // Call IVOR API for moderation
    const ivorResult = await moderateWithIVOR(contentData);

    console.log('[BrowserAct] IVOR moderation result:', ivorResult);

    // Determine routing based on IVOR confidence
    let moderationStatus;
    if (ivorResult.recommendation === 'auto-approve' && ivorResult.confidence >= 0.90) {
      moderationStatus = 'auto-approved';
    } else if (ivorResult.confidence >= 0.70) {
      moderationStatus = 'review-quick';
    } else {
      moderationStatus = 'review-deep';
    }

    // Enrich content data with IVOR analysis
    const enrichedData = {
      ...contentData,
      ivor_confidence: (ivorResult.confidence * 100).toFixed(0) + '%',
      ivor_reasoning: ivorResult.reasoning,
      liberation_score: (ivorResult.liberation_score * 100).toFixed(0) + '%',
      moderation_status: moderationStatus,
      relevance: ivorResult.relevance,
      quality: ivorResult.quality,
      submitted_by: 'browseract-automation',
      submitted_at: new Date().toISOString(),
      flags: ivorResult.flags?.join(', ') || ''
    };

    // Write to Google Sheets (implementation depends on having sheets integration)
    // For now, submit to Supabase as fallback
    const submissionResult = await submitToSupabase(enrichedData, CONFIG.TEAMS.EVENTS);

    return {
      success: true,
      submission_id: submissionResult.id,
      moderation_status: moderationStatus,
      ivor_confidence: ivorResult.confidence,
      recommendation: ivorResult.recommendation,
      timestamp: Date.now()
    };

  } catch (error) {
    console.error('[BrowserAct] Submission failed:', error);
    throw error;
  }
}

/**
 * Handle batch submission from BrowserAct
 */
async function handleBrowserActBatchSubmission(eventsData) {
  try {
    console.log('[BrowserAct] Processing batch submission:', eventsData.length, 'events');

    const results = await Promise.all(
      eventsData.map(async (eventData) => {
        try {
          return await handleBrowserActSubmission(eventData);
        } catch (error) {
          return {
            success: false,
            title: eventData.title,
            error: error.message
          };
        }
      })
    );

    const stats = {
      total: results.length,
      auto_approved: results.filter(r => r.moderation_status === 'auto-approved').length,
      review_quick: results.filter(r => r.moderation_status === 'review-quick').length,
      review_deep: results.filter(r => r.moderation_status === 'review-deep').length,
      failed: results.filter(r => !r.success).length
    };

    console.log('[BrowserAct] Batch processing complete:', stats);

    return {
      success: true,
      stats,
      results
    };

  } catch (error) {
    console.error('[BrowserAct] Batch submission failed:', error);
    throw error;
  }
}

/**
 * Call IVOR AI API for content moderation
 */
async function moderateWithIVOR(content) {
  try {
    const response = await fetch(`${CONFIG.IVOR_API_URL}/api/moderate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: {
          type: content.type || 'event',
          title: content.title,
          description: content.description,
          organizer_name: content.organizer_name,
          tags: content.tags,
          source_url: content.source_url,
          location: content.location,
          event_date: content.event_date
        },
        moderation_type: content.type === 'news' ? 'news_relevance' : 'event_relevance'
      })
    });

    if (!response.ok) {
      console.error('[IVOR] API error:', response.status);
      // Return fallback moderation result
      return {
        confidence: 0,
        relevance: 'low',
        quality: 'low',
        liberation_score: 0,
        reasoning: 'AI moderation failed - requires manual review',
        recommendation: 'review',
        flags: ['error']
      };
    }

    const result = await response.json();
    return result;

  } catch (error) {
    console.error('[IVOR] Moderation failed:', error);
    // Return conservative fallback
    return {
      confidence: 0,
      relevance: 'low',
      quality: 'low',
      liberation_score: 0,
      reasoning: 'AI moderation failed - requires manual review',
      recommendation: 'review',
      flags: ['error']
    };
  }
}

/**
 * Handle extension uninstall
 */
chrome.runtime.onSuspend.addListener(() => {
  console.log('BLKOUT Content Curator suspending...');

  // Clear sensitive data
  if (authToken) {
    chrome.identity.removeCachedAuthToken({ token: authToken });
  }
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CONFIG,
    handleAuthentication,
    analyzePageContent,
    extractEventData,
    extractNewsData
  };
}