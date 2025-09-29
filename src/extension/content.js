/**
 * BLKOUT Content Curator - Content Script
 * Analyzes pages for events and news content, provides floating action button
 */

// Content script state
let isAnalyzing = false;
let currentAnalysis = null;
let floatingButton = null;
let userTeam = null;
let contentDetectionEnabled = true;

// Content detection patterns and thresholds
const DETECTION_CONFIG = {
  EVENT_INDICATORS: [
    'event', 'workshop', 'meetup', 'conference', 'webinar', 'seminar',
    'gathering', 'celebration', 'festival', 'march', 'rally', 'protest'
  ],
  NEWS_INDICATORS: [
    'news', 'article', 'story', 'report', 'breaking', 'update',
    'announcement', 'press release', 'editorial', 'opinion'
  ],
  LIBERATION_KEYWORDS: [
    'black', 'african', 'diaspora', 'afro', 'caribbean',
    'queer', 'lgbtq', 'trans', 'gay', 'lesbian', 'bisexual', 'non-binary',
    'liberation', 'justice', 'equity', 'empowerment', 'resistance',
    'community', 'mutual aid', 'solidarity', 'collective', 'cooperative',
    'anti-racist', 'decolonial', 'radical', 'revolutionary', 'activism'
  ],
  MIN_CONFIDENCE: 0.3,
  MIN_LIBERATION_SCORE: 0.4
};

/**
 * Initialize content script when DOM is ready
 */
function initializeContentScript() {
  console.log('BLKOUT Content Curator - Content script initializing...');

  // Load user settings
  loadUserSettings().then(() => {
    if (contentDetectionEnabled) {
      analyzeCurrentPage();
    }
  });

  // Listen for dynamic content changes
  observePageChanges();

  // Listen for messages from popup/background
  setupMessageListeners();
}

/**
 * Load user settings from storage
 */
async function loadUserSettings() {
  try {
    const result = await chrome.storage.sync.get([
      'teamAssignment',
      'contentDetectionEnabled',
      'liberationScoreThreshold'
    ]);

    userTeam = result.teamAssignment || 'events';
    contentDetectionEnabled = result.contentDetectionEnabled !== false;
    DETECTION_CONFIG.MIN_LIBERATION_SCORE = result.liberationScoreThreshold || 0.4;

    console.log('Content script settings loaded:', {
      userTeam,
      contentDetectionEnabled,
      liberationThreshold: DETECTION_CONFIG.MIN_LIBERATION_SCORE
    });

  } catch (error) {
    console.error('Failed to load user settings:', error);
  }
}

/**
 * Analyze current page for events and news content
 */
async function analyzeCurrentPage() {
  if (isAnalyzing) return;

  try {
    isAnalyzing = true;
    console.log('Analyzing current page:', window.location.href);

    // Extract page data
    const pageData = extractPageData();

    // Send to background script for analysis
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({
        type: 'ANALYZE_CONTENT',
        data: pageData
      }, resolve);
    });

    if (response && !response.error) {
      currentAnalysis = response;
      console.log('Page analysis complete:', currentAnalysis);

      // Show floating button if content meets criteria
      if (shouldShowFloatingButton(currentAnalysis)) {
        showFloatingButton(currentAnalysis);
      }
    } else {
      console.error('Analysis failed:', response?.error);
    }

  } catch (error) {
    console.error('Page analysis error:', error);
  } finally {
    isAnalyzing = false;
  }
}

/**
 * Extract relevant data from current page
 */
function extractPageData() {
  const data = {
    url: window.location.href,
    title: document.title,
    content: document.body.innerText,
    html: document.documentElement.outerHTML,
    meta: extractMetadata(),
    structured: extractStructuredData()
  };

  return data;
}

/**
 * Extract metadata from page
 */
function extractMetadata() {
  const meta = {};

  // Standard meta tags
  const metaTags = document.querySelectorAll('meta');
  metaTags.forEach(tag => {
    const name = tag.getAttribute('name') || tag.getAttribute('property');
    const content = tag.getAttribute('content');

    if (name && content) {
      meta[name] = content;
    }
  });

  // Open Graph and Twitter Card data
  const ogTags = document.querySelectorAll('meta[property^="og:"]');
  ogTags.forEach(tag => {
    const property = tag.getAttribute('property');
    const content = tag.getAttribute('content');
    if (property && content) {
      meta[property] = content;
    }
  });

  return meta;
}

/**
 * Extract structured data (JSON-LD, microdata)
 */
function extractStructuredData() {
  const structured = [];

  // JSON-LD structured data
  const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
  jsonLdScripts.forEach(script => {
    try {
      const data = JSON.parse(script.textContent);
      structured.push(data);
    } catch (error) {
      console.warn('Failed to parse JSON-LD:', error);
    }
  });

  // Look for event-specific structured data
  const eventSelectors = [
    '[itemtype*="Event"]',
    '.event, .events',
    '.h-event', // microformats
    '[typeof="Event"]' // RDFa
  ];

  eventSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      structured.push(extractElementData(element, 'event'));
    });
  });

  // Look for article-specific structured data
  const articleSelectors = [
    '[itemtype*="Article"]',
    'article',
    '.article, .news-article',
    '.h-entry', // microformats
    '[typeof="Article"]' // RDFa
  ];

  articleSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      structured.push(extractElementData(element, 'article'));
    });
  });

  return structured;
}

/**
 * Extract data from specific DOM element
 */
function extractElementData(element, type) {
  const data = {
    type: type,
    text: element.innerText?.trim() || '',
    html: element.innerHTML,
    attributes: {}
  };

  // Extract common attributes
  const commonAttrs = ['class', 'id', 'itemtype', 'typeof', 'data-*'];
  commonAttrs.forEach(attr => {
    if (attr.includes('*')) {
      // Handle data-* attributes
      Array.from(element.attributes).forEach(attribute => {
        if (attribute.name.startsWith(attr.replace('*', ''))) {
          data.attributes[attribute.name] = attribute.value;
        }
      });
    } else {
      const value = element.getAttribute(attr);
      if (value) {
        data.attributes[attr] = value;
      }
    }
  });

  // Extract specific data based on type
  if (type === 'event') {
    data.eventData = extractEventFromElement(element);
  } else if (type === 'article') {
    data.articleData = extractArticleFromElement(element);
  }

  return data;
}

/**
 * Extract event-specific information from element
 */
function extractEventFromElement(element) {
  const eventData = {};

  // Try to find event details using various selectors
  const dateSelectors = ['.date', '.datetime', '[itemprop="startDate"]', '.event-date'];
  const timeSelectors = ['.time', '[itemprop="startTime"]', '.event-time'];
  const locationSelectors = ['.location', '.venue', '[itemprop="location"]', '.event-location'];
  const titleSelectors = ['.title', '.name', '.event-title', 'h1', 'h2', 'h3'];

  // Extract date
  for (const selector of dateSelectors) {
    const dateElement = element.querySelector(selector);
    if (dateElement) {
      eventData.date = dateElement.textContent?.trim();
      break;
    }
  }

  // Extract time
  for (const selector of timeSelectors) {
    const timeElement = element.querySelector(selector);
    if (timeElement) {
      eventData.time = timeElement.textContent?.trim();
      break;
    }
  }

  // Extract location
  for (const selector of locationSelectors) {
    const locationElement = element.querySelector(selector);
    if (locationElement) {
      eventData.location = locationElement.textContent?.trim();
      break;
    }
  }

  // Extract title
  for (const selector of titleSelectors) {
    const titleElement = element.querySelector(selector);
    if (titleElement) {
      eventData.title = titleElement.textContent?.trim();
      break;
    }
  }

  return eventData;
}

/**
 * Extract article-specific information from element
 */
function extractArticleFromElement(element) {
  const articleData = {};

  // Try to find article details
  const titleSelectors = ['.title', '.headline', '.article-title', 'h1', 'h2'];
  const authorSelectors = ['.author', '.byline', '[itemprop="author"]', '.article-author'];
  const dateSelectors = ['.date', '.published', '[itemprop="datePublished"]', '.article-date'];
  const excerptSelectors = ['.excerpt', '.summary', '.description', '.article-excerpt'];

  // Extract title
  for (const selector of titleSelectors) {
    const titleElement = element.querySelector(selector);
    if (titleElement) {
      articleData.title = titleElement.textContent?.trim();
      break;
    }
  }

  // Extract author
  for (const selector of authorSelectors) {
    const authorElement = element.querySelector(selector);
    if (authorElement) {
      articleData.author = authorElement.textContent?.trim();
      break;
    }
  }

  // Extract date
  for (const selector of dateSelectors) {
    const dateElement = element.querySelector(selector);
    if (dateElement) {
      articleData.publishDate = dateElement.textContent?.trim();
      break;
    }
  }

  // Extract excerpt
  for (const selector of excerptSelectors) {
    const excerptElement = element.querySelector(selector);
    if (excerptElement) {
      articleData.excerpt = excerptElement.textContent?.trim();
      break;
    }
  }

  return articleData;
}

/**
 * Determine if floating button should be shown based on analysis
 */
function shouldShowFloatingButton(analysis) {
  if (!analysis) return false;

  // Check minimum confidence threshold
  if (analysis.confidence < DETECTION_CONFIG.MIN_CONFIDENCE) {
    console.log('Content below confidence threshold:', analysis.confidence);
    return false;
  }

  // Check liberation score threshold
  if (analysis.liberationScore < DETECTION_CONFIG.MIN_LIBERATION_SCORE) {
    console.log('Content below liberation score threshold:', analysis.liberationScore);
    return false;
  }

  // Must have detected content type
  if (!analysis.contentType) {
    console.log('No content type detected');
    return false;
  }

  console.log('Content meets criteria for floating button display');
  return true;
}

/**
 * Show floating action button for content submission
 */
function showFloatingButton(analysis) {
  // Remove existing button if present
  if (floatingButton) {
    floatingButton.remove();
  }

  // Create floating button
  floatingButton = document.createElement('div');
  floatingButton.className = 'blkout-curator-float';
  floatingButton.innerHTML = `
    <div class="blkout-curator-button">
      <div class="blkout-curator-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
      </div>
      <div class="blkout-curator-label">
        ${analysis.contentType === 'event' ? 'Add Event' : 'Add News'}
      </div>
      <div class="blkout-curator-score">
        Liberation Score: ${Math.round(analysis.liberationScore * 100)}%
      </div>
    </div>
  `;

  // Add click handler
  floatingButton.addEventListener('click', () => {
    handleFloatingButtonClick(analysis);
  });

  // Add to page
  document.body.appendChild(floatingButton);

  // Animate in
  setTimeout(() => {
    floatingButton.classList.add('blkout-curator-visible');
  }, 100);

  console.log('Floating button displayed');
}

/**
 * Handle floating button click
 */
async function handleFloatingButtonClick(analysis) {
  try {
    console.log('Floating button clicked, opening submission form...');

    // Show loading state
    floatingButton.classList.add('blkout-curator-loading');

    // Open popup with pre-filled data
    const response = await chrome.runtime.sendMessage({
      type: 'OPEN_SUBMISSION_FORM',
      data: {
        analysis: analysis,
        pageData: extractPageData()
      }
    });

    if (response && response.success) {
      // Hide button temporarily after successful interaction
      hideFloatingButton();
    }

  } catch (error) {
    console.error('Failed to handle button click:', error);
  } finally {
    floatingButton?.classList.remove('blkout-curator-loading');
  }
}

/**
 * Hide floating button
 */
function hideFloatingButton() {
  if (floatingButton) {
    floatingButton.classList.remove('blkout-curator-visible');
    setTimeout(() => {
      if (floatingButton) {
        floatingButton.remove();
        floatingButton = null;
      }
    }, 300);
  }
}

/**
 * Observe page changes for dynamic content
 */
function observePageChanges() {
  const observer = new MutationObserver((mutations) => {
    let shouldReanalyze = false;

    mutations.forEach((mutation) => {
      // Check if significant content was added
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        const hasSignificantContent = Array.from(mutation.addedNodes).some(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node;
            return element.innerHTML && element.innerHTML.length > 100;
          }
          return false;
        });

        if (hasSignificantContent) {
          shouldReanalyze = true;
        }
      }
    });

    // Debounced reanalysis
    if (shouldReanalyze && contentDetectionEnabled) {
      clearTimeout(observer.reanalysisTimer);
      observer.reanalysisTimer = setTimeout(() => {
        console.log('Page content changed, reanalyzing...');
        analyzeCurrentPage();
      }, 2000);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

/**
 * Setup message listeners for communication with background script
 */
function setupMessageListeners() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Content script received message:', message);

    switch (message.type) {
      case 'GET_PAGE_DATA':
        sendResponse(extractPageData());
        break;

      case 'REANALYZE_PAGE':
        analyzeCurrentPage().then(() => {
          sendResponse({ success: true });
        });
        return true; // Async response

      case 'TOGGLE_CONTENT_DETECTION':
        contentDetectionEnabled = message.enabled;
        if (!contentDetectionEnabled && floatingButton) {
          hideFloatingButton();
        }
        sendResponse({ success: true, enabled: contentDetectionEnabled });
        break;

      case 'SHOW_SUCCESS_NOTIFICATION':
        showSuccessNotification(message.data);
        break;

      default:
        console.warn('Unknown message type:', message.type);
    }
  });
}

/**
 * Show success notification after content submission
 */
function showSuccessNotification(data) {
  const notification = document.createElement('div');
  notification.className = 'blkout-curator-notification success';
  notification.innerHTML = `
    <div class="notification-content">
      <div class="notification-icon">✓</div>
      <div class="notification-text">
        Content submitted successfully!<br>
        <small>Team: ${data.team} | ID: ${data.submissionId}</small>
      </div>
    </div>
  `;

  document.body.appendChild(notification);

  // Animate in
  setTimeout(() => {
    notification.classList.add('visible');
  }, 100);

  // Remove after delay
  setTimeout(() => {
    notification.classList.remove('visible');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 4000);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeContentScript);
} else {
  initializeContentScript();
}

// Handle page navigation in SPAs
let currentUrl = window.location.href;
setInterval(() => {
  if (window.location.href !== currentUrl) {
    currentUrl = window.location.href;
    console.log('URL changed, reanalyzing page...');
    setTimeout(() => {
      if (contentDetectionEnabled) {
        analyzeCurrentPage();
      }
    }, 1000);
  }
}, 1000);