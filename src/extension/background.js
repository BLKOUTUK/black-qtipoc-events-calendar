/**
 * BLKOUT Content Curator - Background Service Worker
 * Handles authentication, API calls, and cross-tab communication
 */

// Configuration constants
const CONFIG = {
  GOOGLE_SHEETS_API: 'https://sheets.googleapis.com/v4/spreadsheets',
  BLKOUT_API_BASE: 'https://api.blkout.org', // Update with actual API endpoint
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
 * Submit content to appropriate team's Google Sheet
 */
async function handleContentSubmission(contentData) {
  if (!authToken) {
    throw new Error('User not authenticated');
  }

  try {
    console.log('Submitting content:', contentData);

    // Get team configuration
    const { teamAssignment } = await chrome.storage.sync.get(['teamAssignment']);
    const sheetId = await getTeamSheetId(teamAssignment);

    if (!sheetId) {
      throw new Error(`No sheet configured for team: ${teamAssignment}`);
    }

    // Prepare submission data based on content type
    const submissionData = prepareSubmissionData(contentData, teamAssignment);

    // Submit to Google Sheets
    const response = await submitToGoogleSheets(sheetId, submissionData);

    // Log submission for tracking
    await logSubmission(contentData, response);

    return {
      success: true,
      submissionId: response.spreadsheetId,
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
 * Get Google Sheet ID for team
 */
async function getTeamSheetId(teamId) {
  const { teamSheets } = await chrome.storage.sync.get(['teamSheets']);

  if (!teamSheets || !teamSheets[teamId]) {
    console.warn(`No sheet configured for team: ${teamId}`);
    return null;
  }

  return teamSheets[teamId];
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
 * Submit data to Google Sheets
 */
async function submitToGoogleSheets(sheetId, data) {
  if (!authToken) {
    throw new Error('No authentication token available');
  }

  const values = [Object.values(data)];
  const body = {
    values: values
  };

  const response = await fetch(
    `${CONFIG.GOOGLE_SHEETS_API}/${sheetId}/values/A1:append?valueInputOption=RAW`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Sheets API error: ${error}`);
  }

  return await response.json();
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