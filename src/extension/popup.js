/**
 * BLKOUT Content Curator - Popup Interface
 * Main UI logic for team-based content submission and analysis
 */

// DOM Elements
let elements = {};
let currentUser = null;
let currentAnalysis = null;
let submissionStats = {
  today: 0,
  week: 0,
  total: 0
};

/**
 * Initialize popup interface
 */
document.addEventListener('DOMContentLoaded', async () => {
  console.log('BLKOUT Content Curator popup initializing...');

  initializeElements();
  setupEventListeners();
  await loadUserState();
  await loadSubmissionStats();
  await analyzeCurrentPage();

  console.log('Popup initialization complete');
});

/**
 * Cache DOM elements for performance
 */
function initializeElements() {
  elements = {
    // Authentication
    authSection: document.getElementById('authSection'),
    userProfile: document.getElementById('userProfile'),
    signInBtn: document.getElementById('signInBtn'),
    signOutBtn: document.getElementById('signOutBtn'),
    userName: document.getElementById('userName'),
    userEmail: document.getElementById('userEmail'),
    userTeam: document.getElementById('userTeam'),
    userAvatar: document.getElementById('userAvatar'),

    // Status
    connectionStatus: document.getElementById('connectionStatus'),

    // Main content
    mainContent: document.getElementById('mainContent'),

    // Analysis
    analysisResults: document.getElementById('analysisResults'),
    contentTypeResult: document.getElementById('contentTypeResult'),
    contentType: document.getElementById('contentType'),
    confidence: document.getElementById('confidence'),
    liberationScore: document.getElementById('liberationScore'),
    reanalyzeBtn: document.getElementById('reanalyzeBtn'),

    // Quick actions
    submitEventBtn: document.getElementById('submitEventBtn'),
    submitNewsBtn: document.getElementById('submitNewsBtn'),

    // Manual form
    manualForm: document.getElementById('manualForm'),
    submissionForm: document.getElementById('submissionForm'),
    closeFormBtn: document.getElementById('closeFormBtn'),
    cancelSubmissionBtn: document.getElementById('cancelSubmissionBtn'),
    submitContentBtn: document.getElementById('submitContentBtn'),

    // Form fields
    contentTypeRadios: document.querySelectorAll('input[name="contentType"]'),
    eventFields: document.getElementById('eventFields'),
    newsFields: document.getElementById('newsFields'),
    teamRadios: document.querySelectorAll('input[name="teamAssignment"]'),

    // Stats
    todaySubmissions: document.getElementById('todaySubmissions'),
    weekSubmissions: document.getElementById('weekSubmissions'),
    totalSubmissions: document.getElementById('totalSubmissions'),

    // Footer actions
    openOptionsBtn: document.getElementById('openOptionsBtn'),
    helpBtn: document.getElementById('helpBtn'),
    feedbackBtn: document.getElementById('feedbackBtn'),

    // Loading
    loadingOverlay: document.getElementById('loadingOverlay')
  };
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Authentication
  elements.signInBtn.addEventListener('click', handleSignIn);
  elements.signOutBtn.addEventListener('click', handleSignOut);

  // Analysis
  elements.reanalyzeBtn.addEventListener('click', handleReanalyze);

  // Quick actions
  elements.submitEventBtn.addEventListener('click', () => handleQuickSubmit('event'));
  elements.submitNewsBtn.addEventListener('click', () => handleQuickSubmit('news'));

  // Manual form
  elements.closeFormBtn.addEventListener('click', hideManualForm);
  elements.cancelSubmissionBtn.addEventListener('click', hideManualForm);
  elements.submissionForm.addEventListener('submit', handleFormSubmit);

  // Content type switching
  elements.contentTypeRadios.forEach(radio => {
    radio.addEventListener('change', handleContentTypeChange);
  });

  // Footer actions
  elements.openOptionsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  elements.helpBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://help.blkout.org/content-curator' });
  });

  elements.feedbackBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://feedback.blkout.org/content-curator' });
  });
}

/**
 * Load current user authentication state
 */
async function loadUserState() {
  try {
    updateConnectionStatus('connecting');

    const response = await sendMessage({ type: 'GET_USER_PROFILE' });

    if (response && response.userProfile && response.authToken) {
      currentUser = response.userProfile;
      displayUserProfile(currentUser);
      showMainContent();
      updateConnectionStatus('connected');
    } else {
      showAuthSection();
      updateConnectionStatus('disconnected');
    }

  } catch (error) {
    console.error('Failed to load user state:', error);
    showAuthSection();
    updateConnectionStatus('error');
  }
}

/**
 * Update connection status indicator
 */
function updateConnectionStatus(status) {
  const statusDot = elements.connectionStatus.querySelector('.status-dot');
  const statusText = elements.connectionStatus.querySelector('.status-text');

  statusDot.className = `status-dot ${status}`;

  switch (status) {
    case 'connecting':
      statusText.textContent = 'Connecting...';
      break;
    case 'connected':
      statusText.textContent = 'Connected';
      break;
    case 'disconnected':
      statusText.textContent = 'Sign in required';
      break;
    case 'error':
      statusText.textContent = 'Connection error';
      break;
  }
}

/**
 * Display user profile information
 */
function displayUserProfile(user) {
  elements.userName.textContent = user.name || 'Unknown User';
  elements.userEmail.textContent = user.email || '';
  elements.userAvatar.src = user.picture || 'icons/icon32.png';

  // Load team assignment
  chrome.storage.sync.get(['teamAssignment'], (result) => {
    const team = result.teamAssignment || 'events';
    elements.userTeam.textContent = `${team.charAt(0).toUpperCase()}${team.slice(1)} Team`;

    // Update form default
    const teamRadio = document.querySelector(`input[name="teamAssignment"][value="${team}"]`);
    if (teamRadio) {
      teamRadio.checked = true;
    }
  });
}

/**
 * Show authentication section
 */
function showAuthSection() {
  elements.authSection.classList.remove('hidden');
  elements.userProfile.classList.add('hidden');
  elements.mainContent.classList.add('hidden');
}

/**
 * Show main content after authentication
 */
function showMainContent() {
  elements.authSection.classList.add('hidden');
  elements.userProfile.classList.remove('hidden');
  elements.mainContent.classList.remove('hidden');
}

/**
 * Handle user sign in
 */
async function handleSignIn() {
  try {
    showLoading('Signing in...');
    elements.signInBtn.disabled = true;

    const response = await sendMessage({ type: 'AUTHENTICATE_USER' });

    if (response && response.success) {
      currentUser = response.userProfile;
      displayUserProfile(currentUser);
      showMainContent();
      updateConnectionStatus('connected');

      // Trigger page analysis after successful auth
      await analyzeCurrentPage();

    } else {
      throw new Error(response?.error || 'Authentication failed');
    }

  } catch (error) {
    console.error('Sign in failed:', error);
    showError('Sign in failed: ' + error.message);
    updateConnectionStatus('error');
  } finally {
    hideLoading();
    elements.signInBtn.disabled = false;
  }
}

/**
 * Handle user sign out
 */
async function handleSignOut() {
  try {
    // Clear local state
    currentUser = null;
    currentAnalysis = null;

    // Clear storage
    await chrome.storage.sync.clear();
    await chrome.storage.local.clear();

    // Remove cached auth token
    chrome.identity.clearAllCachedAuthTokens();

    // Reset UI
    showAuthSection();
    updateConnectionStatus('disconnected');
    hideAnalysisResults();
    hideQuickActions();

  } catch (error) {
    console.error('Sign out error:', error);
  }
}

/**
 * Analyze current page content
 */
async function analyzeCurrentPage() {
  if (!currentUser) return;

  try {
    showAnalysisLoading();

    // Get current tab data
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      throw new Error('Unable to access current tab');
    }

    // Get page data from content script
    const pageData = await chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_DATA' });

    if (!pageData) {
      throw new Error('Unable to analyze page content');
    }

    // Send for analysis
    const response = await sendMessage({
      type: 'ANALYZE_CONTENT',
      data: pageData
    });

    if (response && !response.error) {
      currentAnalysis = response;
      displayAnalysisResults(currentAnalysis);
      updateQuickActions(currentAnalysis);
    } else {
      throw new Error(response?.error || 'Analysis failed');
    }

  } catch (error) {
    console.error('Page analysis failed:', error);
    showAnalysisError(error.message);
  }
}

/**
 * Display analysis results
 */
function displayAnalysisResults(analysis) {
  if (!analysis || (!analysis.contentType && analysis.confidence < 0.3)) {
    showNoContentDetected();
    return;
  }

  elements.contentTypeResult.classList.remove('hidden');
  elements.analysisResults.querySelector('.analysis-placeholder').style.display = 'none';

  // Content type
  const contentTypeText = analysis.contentType ?
    analysis.contentType.charAt(0).toUpperCase() + analysis.contentType.slice(1) :
    'Unknown';
  elements.contentType.textContent = contentTypeText;

  // Confidence
  const confidencePercent = Math.round(analysis.confidence * 100);
  elements.confidence.textContent = `${confidencePercent}%`;
  elements.confidence.className = `result-value ${getConfidenceClass(analysis.confidence)}`;

  // Liberation score
  const liberationPercent = Math.round(analysis.liberationScore * 100);
  elements.liberationScore.textContent = `${liberationPercent}%`;
  elements.liberationScore.className = `result-value ${getLiberationScoreClass(analysis.liberationScore)}`;
}

/**
 * Show loading state for analysis
 */
function showAnalysisLoading() {
  elements.analysisResults.querySelector('.analysis-placeholder .placeholder-text').textContent = 'Analyzing current page...';
  elements.contentTypeResult.classList.add('hidden');
}

/**
 * Show error state for analysis
 */
function showAnalysisError(message) {
  const placeholder = elements.analysisResults.querySelector('.analysis-placeholder');
  placeholder.querySelector('.placeholder-text').textContent = `Analysis failed: ${message}`;
  elements.contentTypeResult.classList.add('hidden');
}

/**
 * Show no content detected state
 */
function showNoContentDetected() {
  const placeholder = elements.analysisResults.querySelector('.analysis-placeholder');
  placeholder.querySelector('.placeholder-text').textContent = 'No relevant content detected on this page';
  elements.contentTypeResult.classList.add('hidden');
}

/**
 * Hide analysis results
 */
function hideAnalysisResults() {
  elements.contentTypeResult.classList.add('hidden');
  elements.analysisResults.querySelector('.analysis-placeholder').style.display = 'flex';
  elements.analysisResults.querySelector('.analysis-placeholder .placeholder-text').textContent = 'Analyzing current page...';
}

/**
 * Update quick action buttons based on analysis
 */
function updateQuickActions(analysis) {
  const shouldShow = analysis && analysis.contentType &&
    analysis.confidence >= 0.3 && analysis.liberationScore >= 0.4;

  if (shouldShow) {
    if (analysis.contentType === 'event') {
      elements.submitEventBtn.classList.remove('hidden');
      elements.submitNewsBtn.classList.add('hidden');
    } else if (analysis.contentType === 'news') {
      elements.submitNewsBtn.classList.remove('hidden');
      elements.submitEventBtn.classList.add('hidden');
    }
  } else {
    hideQuickActions();
  }
}

/**
 * Hide quick action buttons
 */
function hideQuickActions() {
  elements.submitEventBtn.classList.add('hidden');
  elements.submitNewsBtn.classList.add('hidden');
}

/**
 * Handle reanalyze button click
 */
async function handleReanalyze() {
  elements.reanalyzeBtn.disabled = true;
  await analyzeCurrentPage();
  elements.reanalyzeBtn.disabled = false;
}

/**
 * Handle quick submission
 */
async function handleQuickSubmit(contentType) {
  if (!currentAnalysis) {
    showError('No content analysis available');
    return;
  }

  try {
    showLoading('Submitting content...');

    // Prepare submission data
    const submissionData = prepareSubmissionData(contentType, currentAnalysis);

    const response = await sendMessage({
      type: 'SUBMIT_CONTENT',
      data: submissionData
    });

    if (response && response.success) {
      showSuccess(`Content submitted successfully to ${response.teamAssignment} team!`);
      await loadSubmissionStats();
      hideQuickActions(); // Hide buttons after successful submission
    } else {
      throw new Error(response?.error || 'Submission failed');
    }

  } catch (error) {
    console.error('Quick submission failed:', error);
    showError('Submission failed: ' + error.message);
  } finally {
    hideLoading();
  }
}

/**
 * Show manual submission form
 */
function showManualForm() {
  elements.manualForm.classList.remove('hidden');

  // Pre-fill form with analysis data if available
  if (currentAnalysis) {
    prefillFormFromAnalysis(currentAnalysis);
  }

  // Pre-fill source URL with current tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      document.getElementById('sourceUrl').value = tabs[0].url;
    }
  });
}

/**
 * Hide manual submission form
 */
function hideManualForm() {
  elements.manualForm.classList.add('hidden');
  elements.submissionForm.reset();
}

/**
 * Handle content type change in form
 */
function handleContentTypeChange(event) {
  const selectedType = event.target.value;

  if (selectedType === 'event') {
    elements.eventFields.classList.remove('hidden');
    elements.newsFields.classList.add('hidden');
  } else {
    elements.eventFields.classList.add('hidden');
    elements.newsFields.classList.remove('hidden');
  }
}

/**
 * Handle form submission
 */
async function handleFormSubmit(event) {
  event.preventDefault();

  if (!validateForm()) {
    return;
  }

  try {
    showSubmissionLoading();

    const formData = new FormData(elements.submissionForm);
    const submissionData = Object.fromEntries(formData.entries());

    // Add analysis data if available
    if (currentAnalysis) {
      submissionData.analysisData = currentAnalysis;
    }

    const response = await sendMessage({
      type: 'SUBMIT_CONTENT',
      data: submissionData
    });

    if (response && response.success) {
      showSuccess(`Content submitted successfully to ${response.teamAssignment} team!`);
      hideManualForm();
      await loadSubmissionStats();
    } else {
      throw new Error(response?.error || 'Submission failed');
    }

  } catch (error) {
    console.error('Form submission failed:', error);
    showError('Submission failed: ' + error.message);
  } finally {
    hideSubmissionLoading();
  }
}

/**
 * Validate form before submission
 */
function validateForm() {
  const contentType = document.querySelector('input[name="contentType"]:checked').value;

  if (contentType === 'event') {
    const title = document.getElementById('eventTitle').value.trim();
    const date = document.getElementById('eventDate').value;

    if (!title) {
      showError('Event title is required');
      return false;
    }

    if (!date) {
      showError('Event date is required');
      return false;
    }
  } else if (contentType === 'news') {
    const title = document.getElementById('articleTitle').value.trim();

    if (!title) {
      showError('Article title is required');
      return false;
    }
  }

  return true;
}

/**
 * Pre-fill form with analysis data
 */
function prefillFormFromAnalysis(analysis) {
  if (analysis.contentType === 'event' && analysis.extractedData) {
    const data = analysis.extractedData;

    if (data.title) document.getElementById('eventTitle').value = data.title;
    if (data.date) {
      const date = parseDate(data.date);
      if (date) document.getElementById('eventDate').value = date;
    }
    if (data.time) document.getElementById('eventTime').value = data.time;
    if (data.location) document.getElementById('eventLocation').value = data.location;
    if (data.organizer) document.getElementById('eventOrganizer').value = data.organizer;
    if (data.description) document.getElementById('description').value = data.description;
  } else if (analysis.contentType === 'news' && analysis.extractedData) {
    const data = analysis.extractedData;

    if (data.title) document.getElementById('articleTitle').value = data.title;
    if (data.author) document.getElementById('articleAuthor').value = data.author;
    if (data.publication) document.getElementById('publication').value = data.publication;
    if (data.excerpt) document.getElementById('description').value = data.excerpt;
  }
}

/**
 * Load submission statistics
 */
async function loadSubmissionStats() {
  try {
    const { submissionLog = [] } = await chrome.storage.local.get(['submissionLog']);

    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);

    submissionStats.today = submissionLog.filter(entry => entry.timestamp > oneDayAgo).length;
    submissionStats.week = submissionLog.filter(entry => entry.timestamp > oneWeekAgo).length;
    submissionStats.total = submissionLog.length;

    updateStatsDisplay();

  } catch (error) {
    console.error('Failed to load submission stats:', error);
  }
}

/**
 * Update statistics display
 */
function updateStatsDisplay() {
  elements.todaySubmissions.textContent = submissionStats.today;
  elements.weekSubmissions.textContent = submissionStats.week;
  elements.totalSubmissions.textContent = submissionStats.total;
}

/**
 * Prepare submission data from analysis
 */
function prepareSubmissionData(contentType, analysis) {
  const baseData = {
    contentType: contentType,
    url: analysis.url || window.location.href,
    confidence: analysis.confidence,
    liberationScore: analysis.liberationScore,
    submittedAt: Date.now()
  };

  if (analysis.extractedData) {
    Object.assign(baseData, analysis.extractedData);
  }

  return baseData;
}

/**
 * Utility functions
 */
function getConfidenceClass(confidence) {
  if (confidence >= 0.8) return 'text-success';
  if (confidence >= 0.5) return 'text-warning';
  return 'text-error';
}

function getLiberationScoreClass(score) {
  if (score >= 0.7) return 'text-success';
  if (score >= 0.4) return 'text-warning';
  return 'text-error';
}

function parseDate(dateString) {
  const date = new Date(dateString);
  if (isNaN(date)) return null;
  return date.toISOString().split('T')[0];
}

/**
 * UI State Management
 */
function showLoading(message = 'Loading...') {
  elements.loadingOverlay.classList.remove('hidden');
  elements.loadingOverlay.querySelector('.loading-text').textContent = message;
}

function hideLoading() {
  elements.loadingOverlay.classList.add('hidden');
}

function showSubmissionLoading() {
  elements.submitContentBtn.disabled = true;
  elements.submitContentBtn.querySelector('.btn-text').classList.add('hidden');
  elements.submitContentBtn.querySelector('.btn-spinner').classList.remove('hidden');
}

function hideSubmissionLoading() {
  elements.submitContentBtn.disabled = false;
  elements.submitContentBtn.querySelector('.btn-text').classList.remove('hidden');
  elements.submitContentBtn.querySelector('.btn-spinner').classList.add('hidden');
}

function showError(message) {
  console.error('UI Error:', message);
  // In a full implementation, you'd show a toast notification or alert
  alert('Error: ' + message);
}

function showSuccess(message) {
  console.log('UI Success:', message);
  // In a full implementation, you'd show a toast notification
  alert('Success: ' + message);
}

/**
 * Message sending utility
 */
async function sendMessage(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, resolve);
  });
}