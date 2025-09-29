module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/test-setup.js'],
  testMatch: [
    '**/*.test.js'
  ],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    '*.js',
    '!manifest.json',
    '!jest.config.js',
    '!test-setup.js',
    '!*.test.js',
    '!node_modules/**'
  ],
  coverageReporters: [
    'text',
    'html',
    'lcov'
  ],
  globals: {
    chrome: {
      runtime: {
        sendMessage: jest.fn(),
        onMessage: {
          addListener: jest.fn()
        }
      },
      storage: {
        sync: {
          get: jest.fn(),
          set: jest.fn()
        },
        local: {
          get: jest.fn(),
          set: jest.fn()
        }
      },
      identity: {
        getAuthToken: jest.fn(),
        clearAllCachedAuthTokens: jest.fn()
      },
      tabs: {
        query: jest.fn(),
        sendMessage: jest.fn()
      }
    }
  }
};