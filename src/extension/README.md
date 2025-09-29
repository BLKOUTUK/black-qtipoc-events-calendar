# BLKOUT Content Curator - Chrome Extension

A comprehensive Chrome extension for community-driven content curation supporting the BLKOUT Liberation Platform. This extension enables team-based discovery and submission of events and news content relevant to Black queer communities.

## 🌟 Features

### Content Detection Engine
- **Smart Page Analysis**: Automatically detects events and news articles on web pages
- **AI-Powered Classification**: Distinguishes between events and news content with confidence scoring
- **Liberation Values Scoring**: Rates content relevance to Black queer liberation movements
- **Dynamic Content Monitoring**: Tracks page changes and updates analysis in real-time

### Team-Based Workflow
- **Role-Specific Features**: Separate interfaces and permissions for Events and News teams
- **User Authentication**: Google OAuth integration for secure team assignment
- **Team Coordination**: Shared Google Sheets for collaborative content moderation
- **Activity Tracking**: Personal and team submission statistics

### One-Click Submission
- **Floating Action Button**: Contextual submission prompts on relevant pages
- **Pre-Populated Forms**: Automatic extraction of event/article details
- **Direct Integration**: Real-time submission to team Google Sheets
- **Status Tracking**: Monitor submission progress and team feedback

### Smart Content Parsing
- **Event Extraction**: Date, time, location, organizer, and accessibility information
- **Article Metadata**: Title, author, publication, category, and excerpt parsing
- **Structured Data Support**: JSON-LD, microdata, and Open Graph integration
- **Custom Keywords**: User-defined terms for improved liberation scoring

## 🏗️ Architecture

### Core Components

#### Manifest V3 Extension
- **Service Worker**: Background processing and API coordination
- **Content Scripts**: Page analysis and UI injection
- **Popup Interface**: Main user interaction and submission forms
- **Options Page**: Team configuration and advanced settings

#### Content Detection System
- **Pattern Recognition**: Multi-layered content type identification
- **Confidence Scoring**: Weighted algorithms for content relevance
- **Liberation Metrics**: Community-values-based content evaluation
- **Accessibility Detection**: WCAG compliance and inclusive event identification

#### Google Sheets Integration
- **Real-Time Sync**: Direct submission to team spreadsheets
- **Header Management**: Automatic column structure initialization
- **Status Updates**: Collaborative content moderation workflow
- **Data Export**: Backup and analytics capabilities

### File Structure

```
extension/
├── manifest.json              # Extension configuration and permissions
├── background.js             # Service worker for API calls and coordination
├── content.js               # Page analysis and floating button injection
├── content.css              # Styling for injected UI elements
├── popup.html               # Main popup interface structure
├── popup.css                # Popup styling with BLKOUT branding
├── popup.js                 # Popup logic and form handling
├── options.html             # Settings page structure
├── options.css              # Options page styling
├── options.js               # Settings management and team configuration
├── google-sheets.js         # Google Sheets API integration module
└── icons/                   # Extension icons (16px, 32px, 48px, 128px)
```

## 🚀 Installation

### Development Setup

1. **Clone Repository**:
   ```bash
   git clone [repository-url]
   cd src/extension
   ```

2. **Configure Google OAuth**:
   - Create a Google Cloud Console project
   - Enable Google Sheets API and Google+ API
   - Create OAuth 2.0 credentials for Chrome extension
   - Update `manifest.json` with your `client_id`

3. **Load Extension**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the extension directory
   - Pin the extension to your toolbar

### Production Deployment

1. **Package Extension**:
   ```bash
   # Create production build
   zip -r blkout-content-curator.zip . -x "*.git*" "README.md"
   ```

2. **Chrome Web Store**:
   - Upload to Chrome Developer Dashboard
   - Configure store listing with screenshots and descriptions
   - Submit for review following Chrome Web Store policies

## ⚙️ Configuration

### Google Sheets Setup

1. **Create Team Spreadsheets**:
   - Events Team: Share spreadsheet ID with events curators
   - News Team: Share spreadsheet ID with news curators

2. **Configure Sheet Access**:
   - Grant edit permissions to team members
   - Ensure sheets are accessible via Google Sheets API

3. **Extension Configuration**:
   - Open extension options page
   - Enter spreadsheet IDs for each team
   - Test connections to verify setup

### Team Assignment

1. **User Authentication**:
   - Click "Sign In with Google" in extension popup
   - Authorize extension permissions
   - Verify user profile information

2. **Team Selection**:
   - Navigate to options page
   - Select primary team assignment (Events/News/Admin)
   - Configure detection thresholds and preferences

### Advanced Settings

- **Content Detection**: Adjust confidence and liberation score thresholds
- **Custom Keywords**: Add organization-specific terms for improved scoring
- **Auto-Submission**: Enable automatic submission for high-confidence content
- **Debug Mode**: Detailed logging for troubleshooting

## 🎯 Usage

### Content Discovery

1. **Automatic Detection**:
   - Extension analyzes pages as you browse
   - Floating button appears on relevant content
   - Real-time confidence and liberation scoring

2. **Manual Submission**:
   - Click extension icon in toolbar
   - Review page analysis results
   - Submit content with team assignment

### Team Collaboration

1. **Submission Workflow**:
   - Content submitted to team Google Sheet
   - Team members review and moderate submissions
   - Status updates tracked in shared spreadsheet

2. **Quality Control**:
   - Liberation score filtering ensures community alignment
   - Confidence thresholds reduce false positives
   - Team-specific validation and approval process

### Analytics and Reporting

- **Personal Stats**: Track individual submission activity
- **Team Metrics**: Monitor team performance and content flow
- **Export Data**: Backup submissions and generate reports

## 🛠️ Development

### Code Structure

#### Background Script (`background.js`)
- **Authentication**: Google OAuth token management
- **API Integration**: Google Sheets communication
- **Content Analysis**: Page content processing and scoring
- **Team Management**: User role assignment and coordination

#### Content Script (`content.js`)
- **Page Scanning**: DOM analysis for events and news
- **Element Detection**: Structured data and metadata extraction
- **UI Injection**: Floating button and notification display
- **Real-Time Updates**: Dynamic content monitoring

#### Popup Interface (`popup.js`)
- **User Dashboard**: Authentication status and team information
- **Submission Forms**: Event and news content input
- **Analysis Display**: Confidence and liberation scores
- **Quick Actions**: One-click content submission

### API Integration

#### Google Sheets API
```javascript
// Initialize API client
const sheetsAPI = new SheetsAPI();
await sheetsAPI.initialize(authToken);

// Submit content
const result = await sheetsAPI.submitContent(
  spreadsheetId,
  'events',
  submissionData
);
```

#### Content Detection
```javascript
// Analyze page content
const analysis = await analyzePageContent({
  url: window.location.href,
  title: document.title,
  content: document.body.innerText,
  structured: extractStructuredData()
});
```

### Testing

1. **Unit Tests**: Individual function validation
2. **Integration Tests**: Google Sheets API connectivity
3. **User Testing**: Team workflow validation
4. **Performance Tests**: Content detection speed and accuracy

## 🔒 Privacy & Security

### Data Handling
- **Minimal Collection**: Only content metadata and user email
- **Secure Transmission**: HTTPS for all API communications
- **User Control**: Full data export and deletion capabilities
- **Transparency**: Clear privacy policy and data usage explanation

### Permissions
- **Active Tab**: Page content analysis on current tab only
- **Identity**: Google OAuth for team authentication
- **Storage**: Local settings and submission history
- **External Domains**: Google Sheets API access only

### Security Measures
- **Token Management**: Secure OAuth token storage and rotation
- **Input Validation**: Sanitization of all user inputs
- **HTTPS Enforcement**: Encrypted communication with all services
- **Content Security Policy**: Protection against XSS attacks

## 🤝 Contributing

### Development Guidelines

1. **Code Standards**:
   - ES6+ JavaScript with comprehensive comments
   - Semantic HTML5 with accessibility attributes
   - CSS3 with BLKOUT brand color scheme
   - Chrome Extension best practices

2. **Testing Requirements**:
   - Unit tests for all utility functions
   - Integration tests for API communications
   - Manual testing across different website types
   - Accessibility testing with screen readers

3. **Documentation**:
   - Inline code comments for complex logic
   - README updates for new features
   - User guide updates for UI changes
   - API documentation for integrations

### Community Values

This extension is built to serve Black queer liberation movements. All contributions should:
- **Center Community Needs**: Prioritize user experience and accessibility
- **Respect Privacy**: Minimize data collection and maximize user control
- **Promote Equity**: Ensure features serve marginalized communities
- **Enable Cooperation**: Support collaborative community-driven content curation

## 📈 Roadmap

### Phase 1: Core Functionality ✅
- Content detection and classification
- Google Sheets integration
- Team-based submission workflow
- Basic analytics and reporting

### Phase 2: Enhanced Features 🔄
- IVOR AI integration for content analysis
- Advanced liberation scoring algorithms
- Multi-language support
- Mobile companion app

### Phase 3: Platform Integration 🔮
- BLKOUT platform API integration
- Cross-platform content synchronization
- Advanced moderation workflows
- Community feedback integration

## 📧 Support

### Getting Help

- **Documentation**: Comprehensive guides and API references
- **Community Forum**: User discussion and troubleshooting
- **Direct Support**: Technical assistance for team administrators
- **Feature Requests**: Community-driven enhancement proposals

### Reporting Issues

1. **Bug Reports**: Include browser version, steps to reproduce, and error logs
2. **Feature Requests**: Describe use case and expected behavior
3. **Security Issues**: Report privately to security team
4. **Accessibility Problems**: Include assistive technology details

---

**BLKOUT Content Curator v1.0.0**
*Built with love for Black queer liberation communities worldwide* 🖤💛