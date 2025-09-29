# BLKOUT Content Curator - Quick Setup Guide

This guide will help you set up and deploy the BLKOUT Content Curator Chrome extension for your community team.

## 📋 Prerequisites

- Google Account with access to Google Cloud Console
- Chrome browser (version 88 or higher)
- Basic understanding of Chrome extensions
- Google Sheets access for team collaboration

## 🔧 Initial Setup

### Step 1: Google Cloud Console Configuration

1. **Create a new project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project named "BLKOUT Content Curator"
   - Note your Project ID

2. **Enable APIs**:
   - Navigate to "APIs & Services" > "Library"
   - Enable the following APIs:
     - Google Sheets API
     - Google+ API (for user info)

3. **Create OAuth Credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Chrome Extension" as application type
   - Add your extension ID (will be generated after first load)

### Step 2: Extension Configuration

1. **Update manifest.json**:
   ```json
   {
     "oauth2": {
       "client_id": "YOUR_GOOGLE_CLIENT_ID_HERE",
       "scopes": [
         "https://www.googleapis.com/auth/spreadsheets",
         "https://www.googleapis.com/auth/userinfo.email"
       ]
     }
   }
   ```

2. **Create extension icons**:
   ```
   icons/
   ├── icon16.png    # 16x16 pixels
   ├── icon32.png    # 32x32 pixels
   ├── icon48.png    # 48x48 pixels
   └── icon128.png   # 128x128 pixels
   ```

   Use BLKOUT brand colors (Gold: #FFD700, Orange: #FF8C00, Black: #000000)

### Step 3: Team Google Sheets Setup

1. **Create Team Spreadsheets**:
   - Events Team: Create a new Google Sheet for event submissions
   - News Team: Create a new Google Sheet for news submissions
   - Share both sheets with team members (Editor access)

2. **Get Spreadsheet IDs**:
   - Open each spreadsheet
   - Copy the ID from the URL: `docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit`
   - Keep these IDs for extension configuration

3. **Sheet Permissions**:
   - Ensure all team members have Edit access
   - Consider creating a dedicated Google account for the extension

## 🚀 Installation

### Development Installation

1. **Load Extension in Chrome**:
   ```bash
   # Navigate to extension directory
   cd src/extension

   # Open Chrome and go to chrome://extensions/
   # Enable "Developer mode" toggle
   # Click "Load unpacked" and select this directory
   ```

2. **Get Extension ID**:
   - After loading, note the Extension ID from Chrome extensions page
   - Update Google Cloud Console OAuth client with this ID

3. **Test Installation**:
   - Click extension icon in Chrome toolbar
   - Verify popup appears correctly
   - Test sign-in functionality

### Production Installation

1. **Package Extension**:
   ```bash
   npm run package
   ```

2. **Chrome Web Store Upload**:
   - Go to [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
   - Upload the packaged .zip file
   - Configure store listing
   - Submit for review

## ⚙️ Team Configuration

### Administrator Setup

1. **Initial Configuration**:
   - Install extension and sign in as administrator
   - Go to Options page (right-click extension icon > Options)
   - Configure team spreadsheet IDs
   - Test sheet connections

2. **Team Member Onboarding**:
   - Share extension installation link
   - Provide team assignment instructions
   - Ensure Google Sheets access is granted

### User Team Assignment

1. **Events Team Setup**:
   - Install extension
   - Sign in with Google account
   - Select "Events Team" in options
   - Enter events spreadsheet ID
   - Test submission workflow

2. **News Team Setup**:
   - Install extension
   - Sign in with Google account
   - Select "News Team" in options
   - Enter news spreadsheet ID
   - Test submission workflow

## 🎯 Usage Training

### For Events Curators

1. **Content Detection**:
   - Browse event websites and social media
   - Look for floating action button on relevant pages
   - Review liberation score and confidence ratings

2. **Submission Process**:
   - Click floating button for auto-detected content
   - Or use extension popup for manual submission
   - Fill in event details (date, time, location, organizer)
   - Submit to Events Team sheet

3. **Quality Guidelines**:
   - Focus on Black queer community events
   - Ensure accessibility information is included
   - Verify liberation score meets team standards

### For News Curators

1. **Content Detection**:
   - Browse news sites and community platforms
   - Look for articles relevant to Black queer liberation
   - Check liberation scoring and article metadata

2. **Submission Process**:
   - Use floating button for detected articles
   - Or manual submission via popup
   - Include author, publication, and category
   - Submit to News Team sheet

3. **Quality Guidelines**:
   - Prioritize community-centered reporting
   - Include articles from diverse publications
   - Focus on liberation and justice themes

## 📊 Team Coordination

### Google Sheets Workflow

1. **Submission Review**:
   - Team leaders review submissions in shared sheets
   - Update "Status" column (pending_review → approved/rejected)
   - Add notes for feedback and coordination

2. **Content Moderation**:
   - Verify liberation score accuracy
   - Check event/article details for completeness
   - Ensure content aligns with community values

3. **Data Management**:
   - Regular export of approved content
   - Integration with BLKOUT platform systems
   - Archive completed submissions

### Team Communication

- Use shared Slack/Discord channels for coordination
- Weekly team meetings to review submissions
- Monthly analysis of extension usage and effectiveness

## 🔧 Troubleshooting

### Common Issues

1. **Authentication Problems**:
   - Verify Google Cloud Console configuration
   - Check OAuth client ID in manifest.json
   - Clear extension data and re-authenticate

2. **Sheet Access Errors**:
   - Confirm spreadsheet IDs are correct
   - Verify user has Edit permissions
   - Test API access in extension options

3. **Content Detection Issues**:
   - Adjust confidence and liberation thresholds
   - Add custom keywords for better detection
   - Check debug mode for detailed logging

### Getting Support

- **Technical Issues**: Open GitHub issues with detailed error logs
- **Team Questions**: Contact team administrators
- **Feature Requests**: Submit via community feedback channels

## 📈 Analytics & Monitoring

### Performance Tracking

1. **Individual Stats**:
   - Monitor submission counts in extension popup
   - Track personal liberation score averages
   - Review weekly/monthly activity

2. **Team Analytics**:
   - Analyze Google Sheets submission data
   - Generate reports on team performance
   - Monitor content quality trends

3. **Community Impact**:
   - Track approved content integration
   - Measure community engagement with curated content
   - Assess liberation platform growth

## 🚀 Next Steps

### Phase 1 Completion
- [ ] Google Cloud Console setup complete
- [ ] Extension installed and configured
- [ ] Team spreadsheets created and shared
- [ ] All team members onboarded
- [ ] Initial content submissions tested

### Future Enhancements
- [ ] IVOR AI integration for enhanced analysis
- [ ] Mobile companion app development
- [ ] Advanced reporting dashboard
- [ ] Multi-language support
- [ ] Cross-platform synchronization

---

**Need help?** Contact the BLKOUT technical team or visit our [support documentation](https://help.blkout.org/content-curator) for detailed guides and troubleshooting.

*Built with love for Black queer liberation communities worldwide* 🖤💛