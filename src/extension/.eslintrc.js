module.exports = {
  env: {
    browser: true,
    es2021: true,
    webextensions: true,
    node: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module'
  },
  globals: {
    chrome: 'readonly',
    browser: 'readonly'
  },
  rules: {
    // Code Quality
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-console': 'off', // Allow console for extension logging
    'prefer-const': 'error',
    'no-var': 'error',

    // Formatting
    'indent': ['error', 2],
    'quotes': ['error', 'single', { allowTemplateLiterals: true }],
    'semi': ['error', 'always'],
    'comma-dangle': ['error', 'never'],

    // Best Practices
    'eqeqeq': ['error', 'always'],
    'no-implicit-globals': 'error',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',

    // Chrome Extension Specific
    'no-undef': 'error'
  },
  overrides: [
    {
      files: ['background.js'],
      globals: {
        importScripts: 'readonly'
      }
    },
    {
      files: ['content.js'],
      env: {
        browser: true
      }
    },
    {
      files: ['popup.js', 'options.js'],
      env: {
        browser: true
      }
    },
    {
      files: ['*.test.js'],
      env: {
        jest: true
      }
    }
  ]
};