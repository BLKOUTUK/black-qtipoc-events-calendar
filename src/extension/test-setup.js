/**
 * Jest setup file for Chrome Extension testing
 * Provides mocks and utilities for testing extension functionality
 */

// Mock Chrome APIs
global.chrome = {
  runtime: {
    sendMessage: jest.fn((message, callback) => {
      if (callback) callback({ success: true });
    }),
    onMessage: {
      addListener: jest.fn()
    },
    onInstalled: {
      addListener: jest.fn()
    },
    onStartup: {
      addListener: jest.fn()
    }
  },
  storage: {
    sync: {
      get: jest.fn((keys, callback) => {
        const mockData = {
          teamAssignment: 'events',
          contentDetectionEnabled: true,
          liberationScoreThreshold: 70
        };
        callback(mockData);
      }),
      set: jest.fn((data, callback) => {
        if (callback) callback();
      }),
      clear: jest.fn((callback) => {
        if (callback) callback();
      })
    },
    local: {
      get: jest.fn((keys, callback) => {
        const mockData = {
          submissionLog: []
        };
        callback(mockData);
      }),
      set: jest.fn((data, callback) => {
        if (callback) callback();
      }),
      clear: jest.fn((callback) => {
        if (callback) callback();
      })
    }
  },
  identity: {
    getAuthToken: jest.fn((options, callback) => {
      callback('mock_auth_token');
    }),
    clearAllCachedAuthTokens: jest.fn((callback) => {
      if (callback) callback();
    })
  },
  tabs: {
    query: jest.fn((queryInfo, callback) => {
      const mockTabs = [{
        id: 1,
        url: 'https://example.com',
        title: 'Example Page'
      }];
      callback(mockTabs);
    }),
    sendMessage: jest.fn((tabId, message, callback) => {
      const mockResponse = {
        url: 'https://example.com',
        title: 'Example Page',
        content: 'Mock page content'
      };
      if (callback) callback(mockResponse);
    })
  },
  action: {
    openPopup: jest.fn()
  }
};

// Mock fetch for API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({
      success: true,
      data: 'mock response'
    }),
    text: () => Promise.resolve('mock response text')
  })
);

// Mock DOM APIs commonly used in content scripts
Object.defineProperty(window, 'location', {
  value: {
    href: 'https://example.com/test-page',
    hostname: 'example.com'
  },
  writable: true
});

// Mock document for content script testing
Object.defineProperty(global, 'document', {
  value: {
    title: 'Test Page',
    body: {
      innerText: 'Mock page content for testing',
      appendChild: jest.fn(),
      removeChild: jest.fn()
    },
    createElement: jest.fn((tagName) => {
      const element = {
        tagName: tagName.toUpperCase(),
        className: '',
        innerHTML: '',
        style: {},
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        setAttribute: jest.fn(),
        getAttribute: jest.fn(),
        click: jest.fn()
      };
      return element;
    }),
    querySelector: jest.fn(() => null),
    querySelectorAll: jest.fn(() => []),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  },
  writable: true
});

// Mock console methods for cleaner test output
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Test utilities
global.testUtils = {
  // Create mock content analysis data
  createMockAnalysis: (overrides = {}) => ({
    contentType: 'event',
    confidence: 0.8,
    liberationScore: 0.7,
    extractedData: {
      title: 'Mock Event Title',
      date: '2024-01-15',
      location: 'Community Center'
    },
    ...overrides
  }),

  // Create mock user profile
  createMockUserProfile: (overrides = {}) => ({
    name: 'Test User',
    email: 'test@example.com',
    picture: 'https://example.com/avatar.jpg',
    authenticatedAt: Date.now(),
    ...overrides
  }),

  // Create mock submission data
  createMockSubmission: (overrides = {}) => ({
    contentType: 'event',
    url: 'https://example.com/event',
    title: 'Mock Event',
    submittedAt: Date.now(),
    submittedBy: 'test@example.com',
    team: 'events',
    ...overrides
  }),

  // Mock DOM element creation
  createMockElement: (tagName, attributes = {}) => {
    const element = {
      tagName: tagName.toUpperCase(),
      className: '',
      innerHTML: '',
      textContent: '',
      style: {},
      classList: {
        add: jest.fn(),
        remove: jest.fn(),
        contains: jest.fn(() => false)
      },
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      setAttribute: jest.fn(),
      getAttribute: jest.fn(),
      appendChild: jest.fn(),
      removeChild: jest.fn(),
      click: jest.fn(),
      focus: jest.fn(),
      ...attributes
    };
    return element;
  },

  // Wait for async operations in tests
  waitFor: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms))
};

// Setup and teardown helpers
beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();

  // Reset fetch mock
  fetch.mockClear();

  // Reset console mocks
  console.log.mockClear();
  console.warn.mockClear();
  console.error.mockClear();
});

afterEach(() => {
  // Cleanup any created DOM elements
  if (document.body.children) {
    Array.from(document.body.children).forEach(child => {
      document.body.removeChild(child);
    });
  }
});