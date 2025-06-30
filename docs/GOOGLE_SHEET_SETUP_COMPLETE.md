# Complete Google Sheets Setup Guide for Black QTIPOC+ Events Calendar

## 🎯 Quick Start: Copy Our Template

**👉 [COPY THIS TEMPLATE SHEET](https://docs.google.com/spreadsheets/d/1example/copy)**

*Note: Replace with actual template URL once created*

## 📋 Manual Setup Instructions

### Step 1: Create Your Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Click "Blank" to create a new spreadsheet
3. Name it: **"Black QTIPOC+ Events Calendar - Production"**

### Step 2: Create Required Sheets (Tabs)

Create these 4 sheets by clicking the "+" at the bottom:

1. **Events** (rename Sheet1)
2. **ScrapingLogs** 
3. **Contacts**
4. **OrganizationsToMonitor**

### Step 3: Set Up Each Sheet

#### 📅 Events Sheet (Main Data)

**Row 1 Headers (A1:M1):**
```
ID | Name | Description | EventDate | Location | Source | SourceURL | Organizer | Tags | Status | Price | ImageURL | ScrapedDate
```

**Sample Data (Row 2):**
```
1 | Black Trans Joy Celebration | A celebration of Black trans joy, resilience, and community. Join us for an evening of music, poetry, and connection. | 2024-03-15T19:00:00Z | Brooklyn Community Center, NY | community | https://example.com/event1 | Black Trans Collective | trans,celebration,community,music | published | Free | https://images.pexels.com/photos/3182792/pexels-photo-3182792.jpeg | 2024-02-01T10:00:00Z
```

**Sample Data (Row 3):**
```
2 | Queer POC Mental Health Workshop | A safe space workshop focusing on mental health resources and community support for QTIPOC+ individuals. | 2024-03-20T14:00:00Z | Oakland Wellness Center, CA | community | https://community.example.com | Healing Justice Collective | mental health,workshop,wellness,support | published | Sliding scale $10-30 |  | 2024-02-02T10:00:00Z
```

**Sample Data (Row 4):**
```
3 | Black Queer Artists Showcase | An evening showcasing the incredible talent of Black queer artists across multiple mediums. | 2024-03-25T18:00:00Z | Harlem Arts Center, NY | eventbrite | https://eventbrite.com/example | Queer Arts Network | art,showcase,creativity,performance | draft | £15 | https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg | 2024-02-03T10:00:00Z
```

#### 📊 ScrapingLogs Sheet

**Row 1 Headers (A1:F1):**
```
ID | Source | EventsFound | EventsAdded | Status | CreatedAt
```

**Sample Data:**
```
1 | eventbrite | 45 | 12 | success | 2024-02-15T10:30:00Z
2 | facebook | 23 | 8 | partial | 2024-02-15T11:00:00Z
3 | outsavvy | 15 | 3 | success | 2024-02-15T11:30:00Z
```

#### 👥 Contacts Sheet

**Row 1 Headers (A1:E1):**
```
ID | Name | Email | Organization | Role
```

**Sample Data:**
```
1 | Black Trans Collective | contact@blacktranscollective.org | Black Trans Collective | Organizer
2 | Healing Justice Collective | hello@healingjustice.org | Healing Justice Collective | Coordinator
3 | Queer Arts Network | info@queerartsnetwork.org | Queer Arts Network | Director
```

#### 🏢 OrganizationsToMonitor Sheet

**Row 1 Headers (A1:L1):**
```
ID | Name | Type | Location | Website | FacebookPage | EventbriteOrganizer | MonitoringFrequency | LastChecked | EventsFoundLastCheck | Status | Notes
```

**Sample Data (UK Organizations):**
```
1 | UK Black Pride | advocacy | London | ukblackpride.org.uk | UKBlackPride |  | weekly |  |  | active | Europe's largest celebration for LGBTQ+ people of African, Asian, Caribbean, Middle Eastern and Latin American descent
2 | Rainbow Noir Manchester | community_center | Manchester | rainbownoir.org.uk | RainbowNoirMCR |  | monthly |  |  | active | Bi-monthly social and peer support (2nd Thursday each month)
3 | UNMUTED | advocacy | Birmingham | unmutedbrum.com |  |  | monthly |  |  | active | Monthly QTIPOC meetups, book clubs
4 | Pxssy Palace | arts_collective | London | pxssypalace.com | PxssyPalace |  | weekly |  |  | active | High-volume events, multiple venues
5 | Colours Youth Network | youth | UK-wide | coloursyouthuk.org | ColoursYouthUK |  | monthly |  |  | active | QTIPOC young people aged 16-25
```

### Step 4: Format Your Sheets

#### Events Sheet Formatting:
1. **Header Row (Row 1)**: Bold, background color #4285F4 (Google Blue), white text
2. **Status Column (J)**: 
   - Select column J
   - Format > Conditional formatting
   - Add rules:
     - "published" = Green background (#34A853)
     - "draft" = Yellow background (#FBBC04)
     - "reviewing" = Orange background (#FF6D01)
     - "archived" = Red background (#EA4335)

3. **Source Column (F)**:
   - "eventbrite" = Orange background (#FF6D01)
   - "community" = Purple background (#9C27B0)
   - "facebook" = Blue background (#1877F2)
   - "outsavvy" = Teal background (#009688)

#### Data Validation:
1. **Status Column (J)**: 
   - Select column J
   - Data > Data validation
   - Criteria: List of items: `draft,reviewing,published,archived`

2. **Source Column (F)**: 
   - Select column F
   - Data > Data validation
   - Criteria: List of items: `eventbrite,community,facebook,outsavvy`

3. **MonitoringFrequency Column (H) in OrganizationsToMonitor**:
   - Criteria: List of items: `weekly,monthly,quarterly`

### Step 5: Make Sheet Public (Read Access)

1. Click "Share" button (top right)
2. Change access to "Anyone with the link can view"
3. Copy the Sheet ID from URL:
   ```
   https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
   ```
4. Save this Sheet ID - you'll need it for your app!

### Step 6: Get Google API Credentials

#### Enable Google Sheets API:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable Google Sheets API:
   - APIs & Services > Library
   - Search "Google Sheets API"
   - Click "Enable"

#### Create API Key:
1. APIs & Services > Credentials
2. Create Credentials > API Key
3. Copy the API key
4. Restrict the key:
   - API restrictions: Google Sheets API only
   - Website restrictions: Add your domain

### Step 7: Configure Your App

Create/update your `.env` file:
```bash
# Google Sheets Configuration
VITE_GOOGLE_SHEET_ID=your_sheet_id_from_step_5
VITE_GOOGLE_API_KEY=your_api_key_from_step_6
```

## 🎨 Advanced Features (Optional)

### Google Apps Script Automation

1. In your Google Sheet: Extensions > Apps Script
2. Replace default code with:

```javascript
function onEdit(e) {
  var sheet = e.source.getActiveSheet();
  var range = e.range;
  var sheetName = sheet.getName();
  
  // Only run on Events sheet
  if (sheetName !== 'Events') return;
  
  // Auto-timestamp when status changes to published
  if (range.getColumn() == 10) { // Status column
    var status = range.getValue();
    var row = range.getRow();
    
    if (status == 'published') {
      // Add published timestamp in column N
      sheet.getRange(row, 14).setValue(new Date());
      
      // Optional: Send notification email
      var eventName = sheet.getRange(row, 2).getValue();
      var organizer = sheet.getRange(row, 8).getValue();
      
      // Uncomment to enable email notifications
      // sendPublishedNotification(eventName, organizer);
    }
  }
}

function sendPublishedNotification(eventName, organizer) {
  var subject = 'Event Published: ' + eventName;
  var body = 'The event "' + eventName + '" by ' + organizer + ' has been published to the community calendar.';
  
  // Add your notification email here
  var notificationEmail = 'admin@qtipocevents.org';
  
  GmailApp.sendEmail(notificationEmail, subject, body);
}
```

3. Save and authorize the script

### Dashboard Formulas

Add a new "Dashboard" sheet with these formulas:

```
A1: Total Events
B1: =COUNTA(Events!A:A)-1

A2: Published Events  
B2: =COUNTIF(Events!J:J,"published")

A3: Pending Events
B3: =COUNTIFS(Events!J:J,"draft")+COUNTIFS(Events!J:J,"reviewing")

A4: This Month's Events
B4: =COUNTIFS(Events!D:D,">="&EOMONTH(TODAY(),-1)+1,Events!D:D,"<="&EOMONTH(TODAY(),0),Events!J:J,"published")

A5: Top Organizer
B5: =INDEX(Events!H:H,MODE(MATCH(Events!H:H,Events!H:H,0)))
```

## 🔐 Security & Permissions

### Sheet Permissions:
- **Public Read**: Anyone can view published events
- **Editor Access**: Give trusted community members edit access
- **Owner**: Keep ownership with core organizers

### API Key Security:
- Restrict API key to your domain only
- Use environment variables, never commit keys to code
- Rotate keys periodically

## ✅ Testing Your Setup

1. **Test Read Access**: 
   - Open your sheet URL in incognito mode
   - Verify you can view but not edit

2. **Test API Access**:
   ```bash
   curl "https://sheets.googleapis.com/v4/spreadsheets/YOUR_SHEET_ID/values/Events!A1:M10?key=YOUR_API_KEY"
   ```

3. **Test App Integration**:
   - Start your app: `npm run dev`
   - Check if events load from your sheet
   - Try submitting a test event

## 🎉 You're Ready!

Your Google Sheet is now:
- ✅ Properly structured for the app
- ✅ Formatted with visual indicators
- ✅ Populated with sample data
- ✅ Configured for API access
- ✅ Set up for community collaboration

The app will now use your Google Sheet as its transparent, community-friendly database!

## 📞 Need Help?

- **Google Sheets Help**: [Google Sheets Support](https://support.google.com/sheets)
- **API Issues**: [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- **App Issues**: Check the main README.md or open an issue

---

**🌟 Your community calendar is powered by Google Sheets - simple, transparent, and collaborative!**