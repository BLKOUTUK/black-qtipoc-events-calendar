# Google Sheets Setup Guide

This guide walks you through setting up Google Sheets as the database for the Black QTIPOC+ Events Calendar.

## 🎯 Why Google Sheets?

- **Simple & Transparent**: No complex database setup
- **Community-Friendly**: Everyone can see and understand the data
- **Collaborative**: Multiple admins can work simultaneously
- **Free**: No hosting costs or database fees
- **Reliable**: Google handles all the infrastructure
- **Familiar**: Everyone knows how to use spreadsheets

## 📊 Step 1: Create Your Google Sheet

### 1.1 Create New Sheet
1. Go to [Google Sheets](https://sheets.google.com)
2. Click "Blank" to create a new spreadsheet
3. Name it "Black QTIPOC+ Events Calendar"

### 1.2 Set Up Sheet Structure

Create these sheets (tabs) in your spreadsheet:

#### **Events Sheet**
| Column | Header | Description |
|--------|--------|-------------|
| A | ID | Unique event identifier |
| B | Name | Event title |
| C | Description | Event description |
| D | EventDate | Date and time (ISO format) |
| E | Location | Event location |
| F | Source | eventbrite/community/facebook/outsavvy |
| G | SourceURL | Link to original event |
| H | Organizer | Organizer name |
| I | Tags | Comma-separated tags |
| J | Status | draft/reviewing/published/archived |
| K | Price | Event cost |
| L | ImageURL | Event image link |
| M | ScrapedDate | When event was discovered |

#### **ScrapingLogs Sheet**
| Column | Header | Description |
|--------|--------|-------------|
| A | ID | Log entry ID |
| B | Source | API source name |
| C | EventsFound | Number of events discovered |
| D | EventsAdded | Number of events added |
| E | Status | success/error/partial |
| F | CreatedAt | Timestamp |

#### **Contacts Sheet**
| Column | Header | Description |
|--------|--------|-------------|
| A | ID | Contact ID |
| B | Name | Organizer/contact name |
| C | Email | Contact email |
| D | Organization | Organization name |
| E | Role | Role/position |

### 1.3 Sample Data
Add a few sample events to test the integration:

```
ID: 1
Name: Black Trans Joy Celebration
Description: A celebration of Black trans joy, resilience, and community.
EventDate: 2024-02-15T19:00:00Z
Location: Brooklyn Community Center, NY
Source: community
SourceURL: https://example.com/event1
Organizer: Black Trans Collective
Tags: trans, celebration, community, music
Status: published
Price: Free
ImageURL: https://images.pexels.com/photos/3182792/pexels-photo-3182792.jpeg
ScrapedDate: 2024-02-01T10:00:00Z
```

## 🔑 Step 2: Get Google API Credentials

### 2.1 Enable Google Sheets API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google Sheets API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

### 2.2 Create API Key (Read Access)
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the API key
4. Restrict the key:
   - Click "Restrict Key"
   - Under "API restrictions", select "Google Sheets API"
   - Under "Website restrictions", add your domain

### 2.3 Make Sheet Public (Read Access)
1. Open your Google Sheet
2. Click "Share" button
3. Change access to "Anyone with the link can view"
4. Copy the Sheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
   ```

## ⚙️ Step 3: Configure Environment Variables

Create a `.env` file in your project root:

```bash
# Google Sheets Configuration
VITE_GOOGLE_SHEET_ID=your_sheet_id_from_url
VITE_GOOGLE_API_KEY=your_api_key_from_step_2
```

## 🔐 Step 4: OAuth2 Setup (Write Access)

For write access (adding/updating events), you'll need OAuth2:

### 4.1 Create OAuth2 Credentials
1. In Google Cloud Console, go to "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Add your domain to authorized origins
5. Download the credentials JSON

### 4.2 Add OAuth2 to Environment
```bash
VITE_GOOGLE_CLIENT_ID=your_client_id
VITE_GOOGLE_CLIENT_SECRET=your_client_secret
```

## 🧪 Step 5: Test the Integration

### 5.1 Test Read Access
1. Start your development server: `npm run dev`
2. Check if events load from your sheet
3. Verify filtering and search work

### 5.2 Test Write Access
1. Try submitting a new event
2. Check if it appears in your Google Sheet
3. Test moderation (approve/reject)

## 📈 Step 6: Advanced Features

### 6.1 Google Apps Script (Optional)
Add automation with Google Apps Script:

```javascript
function onEdit(e) {
  // Auto-timestamp when status changes
  var sheet = e.source.getActiveSheet();
  var range = e.range;
  
  if (range.getColumn() == 10 && range.getValue() == 'published') {
    // Column J is status, add timestamp to column N
    sheet.getRange(range.getRow(), 14).setValue(new Date());
  }
}
```

### 6.2 Data Validation
Set up data validation in Google Sheets:
- Status column: dropdown with draft/reviewing/published/archived
- Source column: dropdown with eventbrite/community/facebook/outsavvy
- Date columns: date format validation

### 6.3 Conditional Formatting
Add visual indicators:
- Green background for published events
- Yellow background for pending events
- Red background for archived events

## 🔒 Step 7: Security & Permissions

### 7.1 Sheet Permissions
- **Public Read**: Anyone can view published events
- **Editor Access**: Give trusted community members edit access
- **Owner**: Keep ownership with core organizers

### 7.2 API Key Security
- Restrict API key to your domain only
- Use environment variables, never commit keys to code
- Rotate keys periodically

### 7.3 Data Privacy
- Don't store sensitive personal information
- Use contact emails sparingly
- Consider GDPR compliance for EU users

## 📊 Step 8: Community Benefits

### 8.1 Transparency
- Community can see all submitted events
- Moderation decisions are visible
- No "black box" algorithms

### 8.2 Collaboration
- Multiple people can moderate simultaneously
- Easy to add new admin users
- Built-in change history

### 8.3 Backup & Export
- Data lives in Google Drive
- Easy CSV/Excel export
- Automatic Google backups

## 🚀 Step 9: Going Live

### 9.1 Production Checklist
- [ ] Sheet is properly structured
- [ ] API keys are configured
- [ ] Permissions are set correctly
- [ ] Sample data is added
- [ ] Testing is complete

### 9.2 Community Onboarding
- Share sheet link with community moderators
- Create simple moderation guidelines
- Train team on Google Sheets basics
- Set up regular backup routine

## 🛠️ Troubleshooting

### Common Issues

**"API key not valid"**
- Check API key is correct in .env file
- Verify Google Sheets API is enabled
- Check API key restrictions

**"Sheet not found"**
- Verify Sheet ID is correct
- Check sheet is public or properly shared
- Ensure sheet hasn't been deleted

**"Permission denied"**
- Check OAuth2 setup for write access
- Verify user has edit permissions
- Check API quotas aren't exceeded

### Getting Help
- Check Google Sheets API documentation
- Review browser console for errors
- Test API calls directly with curl
- Ask community for help with setup

## 🎉 Success!

Once set up, you'll have:
- ✅ Simple, transparent event database
- ✅ Community-friendly moderation
- ✅ No hosting costs or complexity
- ✅ Real-time collaboration
- ✅ Automatic backups
- ✅ Easy data export

Your Black QTIPOC+ Events Calendar is now powered by Google Sheets! 🌟