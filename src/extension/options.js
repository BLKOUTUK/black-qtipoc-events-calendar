/**
 * BLKOUT Content Curator - Options Page Logic
 * Settings management and team configuration interface
 */

// DOM Elements
let elements = {};
let currentUser = null;
let isDirty = false;

/**
 * Initialize options page
 */
document.addEventListener('DOMContentLoaded', async () => {
  console.log('BLKOUT Content Curator options page initializing...');

  initializeElements();
  setupEventListeners();
  await loadSettings();
  await loadUserProfile();
  await loadSubmissionStats();

  console.log('Options page initialization complete');
});

/**
 * Cache DOM elements
 */
function initializeElements() {
  elements = {
    // User profile
    userProfile: document.getElementById('userProfile'),
    userName: document.getElementById('userName'),
    userEmail: document.getElementById('userEmail'),
    userAvatar: document.getElementById('userAvatar'),
    currentTeam: document.getElementById('currentTeam'),
    signInBtn: document.getElementById('signInBtn'),
    signOutBtn: document.getElementById('signOutBtn'),

    // Settings form elements
    teamRadios: document.querySelectorAll('input[name="teamAssignment"]'),
    contentDetectionEnabled: document.getElementById('contentDetectionEnabled'),
    floatingButtonEnabled: document.getElementById('floatingButtonEnabled'),
    autoSubmissionEnabled: document.getElementById('autoSubmissionEnabled'),
    liberationScoreThreshold: document.getElementById('liberationScoreThreshold'),
    liberationScoreValue: document.getElementById('liberationScoreValue'),
    confidenceThreshold: document.getElementById('confidenceThreshold'),
    confidenceValue: document.getElementById('confidenceValue'),

    // Sheets configuration
    eventsSheetId: document.getElementById('eventsSheetId'),
    newsSheetId: document.getElementById('newsSheetId'),
    testEventsSheet: document.getElementById('testEventsSheet'),
    testNewsSheet: document.getElementById('testNewsSheet'),
    eventsSheetStatus: document.getElementById('eventsSheetStatus'),
    newsSheetStatus: document.getElementById('newsSheetStatus'),

    // Advanced settings
    debugMode: document.getElementById('debugMode'),
    analyticsEnabled: document.getElementById('analyticsEnabled'),
    customKeywords: document.getElementById('customKeywords'),

    // Stats display
    totalSubmissions: document.getElementById('totalSubmissions'),
    weekSubmissions: document.getElementById('weekSubmissions'),
    storageUsed: document.getElementById('storageUsed'),

    // Actions
    saveAllBtn: document.getElementById('saveAllBtn'),
    exportDataBtn: document.getElementById('exportDataBtn'),
    clearDataBtn: document.getElementById('clearDataBtn'),

    // Status and loading
    statusMessage: document.getElementById('statusMessage'),
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

  // Team assignment change
  elements.teamRadios.forEach(radio => {
    radio.addEventListener('change', handleTeamChange);
  });

  // Settings change tracking
  const settingsInputs = [
    elements.contentDetectionEnabled,
    elements.floatingButtonEnabled,
    elements.autoSubmissionEnabled,
    elements.liberationScoreThreshold,
    elements.confidenceThreshold,
    elements.debugMode,
    elements.analyticsEnabled,
    elements.customKeywords,
    elements.eventsSheetId,
    elements.newsSheetId
  ];

  settingsInputs.forEach(input => {
    const eventType = input.type === 'checkbox' ? 'change' :
                     input.type === 'range' ? 'input' :
                     'input';

    input.addEventListener(eventType, () => {
      markDirty();
      if (input.type === 'range') {
        updateRangeDisplay(input);
      }
    });
  });

  // Range sliders
  elements.liberationScoreThreshold.addEventListener('input', (e) => {
    elements.liberationScoreValue.textContent = `${e.target.value}%`;
  });

  elements.confidenceThreshold.addEventListener('input', (e) => {
    elements.confidenceValue.textContent = `${e.target.value}%`;
  });

  // Sheet testing
  elements.testEventsSheet.addEventListener('click', () => testSheetConnection('events'));
  elements.testNewsSheet.addEventListener('click', () => testSheetConnection('news'));

  // Actions
  elements.saveAllBtn.addEventListener('click', saveAllSettings);
  elements.exportDataBtn.addEventListener('click', exportData);
  elements.clearDataBtn.addEventListener('click', clearAllData);

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveAllSettings();
    }
  });

  // Warn before leaving with unsaved changes
  window.addEventListener('beforeunload', (e) => {
    if (isDirty) {
      e.preventDefault();
      e.returnValue = '';
      return '';
    }
  });
}

/**
 * Load user profile from background script
 */
async function loadUserProfile() {
  try {
    const response = await sendMessage({ type: 'GET_USER_PROFILE' });

    if (response && response.userProfile && response.authToken) {
      currentUser = response.userProfile;
      displayUserProfile(currentUser);
    } else {
      showSignInRequired();
    }

  } catch (error) {
    console.error('Failed to load user profile:', error);
    showSignInRequired();
  }
}

/**
 * Display user profile information
 */
function displayUserProfile(user) {
  elements.userName.textContent = user.name || 'Unknown User';
  elements.userEmail.textContent = user.email || '';
  elements.userAvatar.src = user.picture || 'icons/icon32.png';

  elements.signInBtn.classList.add('hidden');
  elements.signOutBtn.classList.remove('hidden');

  // Load team assignment
  chrome.storage.sync.get(['teamAssignment'], (result) => {
    const team = result.teamAssignment || 'events';
    elements.currentTeam.textContent = `${team.charAt(0).toUpperCase()}${team.slice(1)} Team`;
  });
}

/**
 * Show sign-in required state
 */
function showSignInRequired() {
  elements.userName.textContent = 'Not signed in';
  elements.userEmail.textContent = 'Sign in to configure team settings';
  elements.currentTeam.textContent = '';
  elements.userAvatar.src = 'icons/icon32.png';

  elements.signInBtn.classList.remove('hidden');
  elements.signOutBtn.classList.add('hidden');
}

/**
 * Load all settings from storage
 */
async function loadSettings() {
  try {
    showLoading('Loading settings...');

    const syncSettings = await chrome.storage.sync.get([
      'teamAssignment',
      'contentDetectionEnabled',
      'floatingButtonEnabled',
      'autoSubmissionEnabled',
      'liberationScoreThreshold',
      'confidenceThreshold',
      'debugMode',
      'analyticsEnabled',
      'customKeywords',
      'teamSheets'
    ]);

    // Team assignment
    const teamAssignment = syncSettings.teamAssignment || 'events';
    const teamRadio = document.querySelector(`input[name="teamAssignment"][value="${teamAssignment}"]`);
    if (teamRadio) {
      teamRadio.checked = true;
    }

    // Boolean settings
    elements.contentDetectionEnabled.checked = syncSettings.contentDetectionEnabled !== false;
    elements.floatingButtonEnabled.checked = syncSettings.floatingButtonEnabled !== false;
    elements.autoSubmissionEnabled.checked = syncSettings.autoSubmissionEnabled === true;
    elements.debugMode.checked = syncSettings.debugMode === true;
    elements.analyticsEnabled.checked = syncSettings.analyticsEnabled !== false;

    // Range settings
    const liberationThreshold = syncSettings.liberationScoreThreshold || 70;
    elements.liberationScoreThreshold.value = liberationThreshold;
    elements.liberationScoreValue.textContent = `${liberationThreshold}%`;

    const confidenceThreshold = syncSettings.confidenceThreshold || 30;
    elements.confidenceThreshold.value = confidenceThreshold;
    elements.confidenceValue.textContent = `${confidenceThreshold}%`;

    // Text settings
    elements.customKeywords.value = syncSettings.customKeywords || '';

    // Sheet configuration
    const teamSheets = syncSettings.teamSheets || {};
    elements.eventsSheetId.value = teamSheets.events || '';
    elements.newsSheetId.value = teamSheets.news || '';

    // Update sheet status
    updateSheetStatus('events', teamSheets.events);
    updateSheetStatus('news', teamSheets.news);

    console.log('Settings loaded successfully');

  } catch (error) {
    console.error('Failed to load settings:', error);
    showError('Failed to load settings: ' + error.message);
  } finally {
    hideLoading();
    isDirty = false;
    updateSaveButton();
  }
}

/**
 * Save all settings to storage
 */
async function saveAllSettings() {
  if (!validateSettings()) {
    return;
  }

  try {
    showLoading('Saving settings...');

    // Gather all settings
    const settings = {
      teamAssignment: document.querySelector('input[name="teamAssignment"]:checked')?.value || 'events',
      contentDetectionEnabled: elements.contentDetectionEnabled.checked,
      floatingButtonEnabled: elements.floatingButtonEnabled.checked,
      autoSubmissionEnabled: elements.autoSubmissionEnabled.checked,
      liberationScoreThreshold: parseInt(elements.liberationScoreThreshold.value),
      confidenceThreshold: parseInt(elements.confidenceThreshold.value),
      debugMode: elements.debugMode.checked,
      analyticsEnabled: elements.analyticsEnabled.checked,
      customKeywords: elements.customKeywords.value.trim(),
      teamSheets: {
        events: elements.eventsSheetId.value.trim(),
        news: elements.newsSheetId.value.trim()
      }
    };

    // Save to chrome storage
    await chrome.storage.sync.set(settings);

    // Update team assignment in background if changed
    if (currentUser) {
      await sendMessage({
        type: 'UPDATE_TEAM_ASSIGNMENT',
        teamId: settings.teamAssignment
      });
    }

    // Update UI
    if (currentUser && elements.currentTeam) {
      const team = settings.teamAssignment;
      elements.currentTeam.textContent = `${team.charAt(0).toUpperCase()}${team.slice(1)} Team`;
    }

    isDirty = false;
    updateSaveButton();
    showSuccess('Settings saved successfully!');

    console.log('Settings saved:', settings);

  } catch (error) {
    console.error('Failed to save settings:', error);
    showError('Failed to save settings: ' + error.message);
  } finally {
    hideLoading();
  }
}

/**
 * Validate settings before saving
 */
function validateSettings() {
  // Validate sheet IDs if provided
  const eventsSheetId = elements.eventsSheetId.value.trim();
  const newsSheetId = elements.newsSheetId.value.trim();

  const sheetIdPattern = /^[a-zA-Z0-9-_]{44}$/;

  if (eventsSheetId && !sheetIdPattern.test(eventsSheetId)) {
    showError('Events Sheet ID format is invalid');
    elements.eventsSheetId.focus();
    return false;
  }

  if (newsSheetId && !sheetIdPattern.test(newsSheetId)) {
    showError('News Sheet ID format is invalid');
    elements.newsSheetId.focus();
    return false;
  }

  // Validate threshold ranges
  const liberationThreshold = parseInt(elements.liberationScoreThreshold.value);
  if (liberationThreshold < 0 || liberationThreshold > 100) {
    showError('Liberation score threshold must be between 0 and 100');
    return false;
  }

  const confidenceThreshold = parseInt(elements.confidenceThreshold.value);
  if (confidenceThreshold < 0 || confidenceThreshold > 100) {
    showError('Confidence threshold must be between 0 and 100');
    return false;
  }

  return true;
}

/**
 * Handle team assignment change
 */
function handleTeamChange(event) {
  const newTeam = event.target.value;
  console.log('Team assignment changed to:', newTeam);

  // Update current team display immediately
  if (elements.currentTeam) {
    elements.currentTeam.textContent = `${newTeam.charAt(0).toUpperCase()}${newTeam.slice(1)} Team`;
  }

  markDirty();
}

/**
 * Test Google Sheets connection
 */
async function testSheetConnection(teamType) {
  const sheetIdInput = teamType === 'events' ? elements.eventsSheetId : elements.newsSheetId;
  const statusElement = teamType === 'events' ? elements.eventsSheetStatus : elements.newsSheetStatus;
  const testButton = teamType === 'events' ? elements.testEventsSheet : elements.testNewsSheet;

  const sheetId = sheetIdInput.value.trim();

  if (!sheetId) {
    showWarning(`Please enter a ${teamType} sheet ID first`);
    sheetIdInput.focus();
    return;
  }

  try {
    testButton.disabled = true;
    testButton.textContent = 'Testing...';
    statusElement.textContent = 'Testing connection...';
    statusElement.className = 'status-value warning';

    // Test connection through background script
    const response = await sendMessage({
      type: 'TEST_SHEET_CONNECTION',
      sheetId: sheetId,
      teamType: teamType
    });

    if (response && response.success) {
      statusElement.textContent = 'Connected';
      statusElement.className = 'status-value success';
      showSuccess(`${teamType.charAt(0).toUpperCase()}${teamType.slice(1)} sheet connection successful!`);
    } else {
      throw new Error(response?.error || 'Connection test failed');
    }

  } catch (error) {
    console.error(`Sheet connection test failed for ${teamType}:`, error);
    statusElement.textContent = 'Connection failed';
    statusElement.className = 'status-value error';
    showError(`Sheet connection test failed: ${error.message}`);
  } finally {
    testButton.disabled = false;
    testButton.textContent = 'Test';
  }
}

/**
 * Update sheet status display
 */
function updateSheetStatus(teamType, sheetId) {
  const statusElement = teamType === 'events' ? elements.eventsSheetStatus : elements.newsSheetStatus;

  if (sheetId && sheetId.trim()) {
    statusElement.textContent = 'Configured';
    statusElement.className = 'status-value success';
  } else {
    statusElement.textContent = 'Not configured';
    statusElement.className = 'status-value';
  }
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
      showSuccess('Signed in successfully!');
    } else {
      throw new Error(response?.error || 'Authentication failed');
    }

  } catch (error) {
    console.error('Sign in failed:', error);
    showError('Sign in failed: ' + error.message);
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

    // Clear storage
    await chrome.storage.sync.clear();
    await chrome.storage.local.clear();

    // Clear cached auth tokens
    chrome.identity.clearAllCachedAuthTokens();

    // Reset UI
    showSignInRequired();
    await loadSettings(); // Reload default settings
    showSuccess('Signed out successfully');

  } catch (error) {
    console.error('Sign out error:', error);
    showError('Sign out failed: ' + error.message);
  }
}

/**
 * Load submission statistics
 */
async function loadSubmissionStats() {
  try {
    const localStorage = await chrome.storage.local.get(['submissionLog']);
    const submissionLog = localStorage.submissionLog || [];

    const now = Date.now();
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);

    const weekSubmissions = submissionLog.filter(entry => entry.timestamp > oneWeekAgo).length;
    const totalSubmissions = submissionLog.length;

    elements.weekSubmissions.textContent = weekSubmissions;
    elements.totalSubmissions.textContent = totalSubmissions;

    // Calculate storage usage
    const syncStorage = await chrome.storage.sync.getBytesInUse();
    const localStorage2 = await chrome.storage.local.getBytesInUse();
    const totalBytes = syncStorage + localStorage2;
    const storageKB = Math.round(totalBytes / 1024 * 100) / 100;

    elements.storageUsed.textContent = `${storageKB} KB`;

  } catch (error) {
    console.error('Failed to load submission stats:', error);
  }
}

/**
 * Export user data
 */
async function exportData() {
  try {
    showLoading('Preparing data export...');

    const syncData = await chrome.storage.sync.get();
    const localStorage = await chrome.storage.local.get();

    const exportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      userProfile: currentUser,
      settings: syncData,
      submissionLog: localStorage.submissionLog || [],
      statistics: {
        totalSubmissions: parseInt(elements.totalSubmissions.textContent) || 0,
        weekSubmissions: parseInt(elements.weekSubmissions.textContent) || 0,
        storageUsed: elements.storageUsed.textContent
      }
    };

    // Create and download file
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `blkout-curator-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    URL.revokeObjectURL(url);
    showSuccess('Data exported successfully!');

  } catch (error) {
    console.error('Data export failed:', error);
    showError('Data export failed: ' + error.message);
  } finally {
    hideLoading();
  }
}

/**
 * Clear all extension data
 */
async function clearAllData() {
  const confirmed = confirm(
    'Are you sure you want to clear all extension data?\n\n' +
    'This will:\n' +
    '• Remove all settings\n' +
    '• Clear submission history\n' +
    '• Sign you out\n' +
    '• Reset the extension to default state\n\n' +
    'This action cannot be undone.'
  );

  if (!confirmed) return;

  try {
    showLoading('Clearing all data...');

    // Clear all storage
    await chrome.storage.sync.clear();
    await chrome.storage.local.clear();

    // Clear auth tokens
    chrome.identity.clearAllCachedAuthTokens();

    // Reset state
    currentUser = null;
    isDirty = false;

    // Reload page to reset UI
    window.location.reload();

  } catch (error) {
    console.error('Failed to clear data:', error);
    showError('Failed to clear data: ' + error.message);
    hideLoading();
  }
}

/**
 * Mark settings as dirty (unsaved changes)
 */
function markDirty() {
  isDirty = true;
  updateSaveButton();
}

/**
 * Update save button state
 */
function updateSaveButton() {
  if (isDirty) {
    elements.saveAllBtn.textContent = 'Save Changes *';
    elements.saveAllBtn.classList.add('btn-warning');
    elements.saveAllBtn.classList.remove('btn-primary');
  } else {
    elements.saveAllBtn.textContent = 'Save All Settings';
    elements.saveAllBtn.classList.remove('btn-warning');
    elements.saveAllBtn.classList.add('btn-primary');
  }
}

/**
 * Update range slider display
 */
function updateRangeDisplay(input) {
  const value = input.value;
  const displayElement = input.id === 'liberationScoreThreshold' ?
    elements.liberationScoreValue : elements.confidenceValue;

  if (displayElement) {
    displayElement.textContent = `${value}%`;
  }
}

/**
 * UI utility functions
 */
function showLoading(message = 'Loading...') {
  elements.loadingOverlay.classList.remove('hidden');
  elements.loadingOverlay.querySelector('.loading-text').textContent = message;
}

function hideLoading() {
  elements.loadingOverlay.classList.add('hidden');
}

function showStatusMessage(message, type = 'success') {
  const statusMessage = elements.statusMessage;
  const statusText = statusMessage.querySelector('.status-text');
  const statusIcon = statusMessage.querySelector('.status-icon');

  statusText.textContent = message;
  statusMessage.className = `status-message ${type}`;

  // Set appropriate icon
  let iconSvg;
  switch (type) {
    case 'success':
      iconSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
      break;
    case 'error':
      iconSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
      break;
    case 'warning':
      iconSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>';
      break;
  }

  statusIcon.innerHTML = iconSvg;

  // Show message
  statusMessage.classList.add('visible');

  // Auto-hide after delay
  setTimeout(() => {
    statusMessage.classList.remove('visible');
  }, 4000);
}

function showSuccess(message) {
  showStatusMessage(message, 'success');
}

function showError(message) {
  showStatusMessage(message, 'error');
}

function showWarning(message) {
  showStatusMessage(message, 'warning');
}

/**
 * Send message to background script
 */
async function sendMessage(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, resolve);
  });
}