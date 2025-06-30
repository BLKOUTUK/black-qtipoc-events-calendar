# Google Sheet Template for Black QTIPOC+ Events Calendar

## 📋 Quick Setup Instructions

1. **Copy this template**: [Black QTIPOC+ Events Calendar Template](https://docs.google.com/spreadsheets/d/1example/copy)
2. **Make it yours**: Click "Make a copy" to create your own version
3. **Get the Sheet ID**: Copy the ID from your new sheet's URL
4. **Set up API access**: Follow the setup guide below

## 🏗️ Sheet Structure

### Sheet 1: Events
```
A1: ID | B1: Name | C1: Description | D1: EventDate | E1: Location | F1: Source | G1: SourceURL | H1: Organizer | I1: Tags | J1: Status | K1: Price | L1: ImageURL | M1: ScrapedDate
```

**Sample Data:**
```
Row 2: 1 | Black Trans Joy Celebration | A celebration of Black trans joy, resilience, and community. Join us for an evening of music, poetry, and connection. | 2024-03-15T19:00:00Z | Brooklyn Community Center, NY | community | https://example.com/event1 | Black Trans Collective | trans,celebration,community,music | published | Free | https://images.pexels.com/photos/3182792/pexels-photo-3182792.jpeg | 2024-02-01T10:00:00Z

Row 3: 2 | Queer POC Mental Health Workshop | A safe space workshop focusing on mental health resources and community support for QTIPOC+ individuals. | 2024-03-20T14:00:00Z | Oakland Wellness Center, CA | community | https://community.example.com | Healing Justice Collective | mental health,workshop,wellness,support | published | Sliding scale $10-30 |  | 2024-02-02T10:00:00Z

Row 4: 3 | Black Queer Artists Showcase | An evening showcasing the incredible talent of Black queer artists across multiple mediums. | 2024-03-25T18:00:00Z | Harlem Arts Center, NY | eventbrite | https://eventbrite.com/example | Queer Arts Network | art,showcase,creativity,performance | draft | $15 | https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg | 2024-02-03T10:00:00Z
```

### Sheet 2: ScrapingLogs
```
A1: ID | B1: Source | C1: EventsFound | D1: EventsAdded | E1: Status | F1: CreatedAt
```

**Sample Data:**
```
Row 2: 1 | eventbrite | 45 | 12 | success | 2024-02-15T10:30:00Z
Row 3: 2 | facebook | 23 | 8 | partial | 2024-02-15T11:00:00Z
Row 4: 3 | outsavvy | 15 | 3 | success | 2024-02-15T11:30:00Z
```

### Sheet 3: Contacts
```
A1: ID | B1: Name | C1: Email | D1: Organization | E1: Role
```

**Sample Data:**
```
Row 2: 1 | Black Trans Collective | contact@blacktranscollective.org | Black Trans Collective | Organizer
Row 3: 2 | Healing Justice Collective | hello@healingjustice.org | Healing Justice Collective | Coordinator
Row 4: 3 | Queer Arts Network | info@queerartsnetwork.org | Queer Arts Network | Director
```

## 🎨 Formatting Instructions

### Events Sheet Formatting:
1. **Header Row (Row 1)**: Bold, background color #4285F4 (Google Blue), white text
2. **Status Column (J)**: 
   - "published" = Green background (#34A853)
   - "draft" = Yellow background (#FBBC04)
   - "reviewing" = Orange background (#FF6D01)
   - "archived" = Red background (#EA4335)
3. **Source Column (F)**:
   - "eventbrite" = Orange background (#FF6D01)
   - "community" = Purple background (#9C27B0)
   - "facebook" = Blue background (#1877F2)
   - "outsavvy" = Teal background (#009688)

### Data Validation:
1. **Status Column (J)**: Dropdown with options: draft, reviewing, published, archived
2. **Source Column (F)**: Dropdown with options: eventbrite, community, facebook, outsavvy
3. **EventDate Column (D)**: Date/time format validation

## 🔧 Google Apps Script (Optional Automation)

Add this script to automate timestamps and notifications:

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

// Function to clean up old archived events (run monthly)
function cleanupArchivedEvents() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Events');
  var data = sheet.getDataRange().getValues();
  var cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - 6); // 6 months ago
  
  for (var i = data.length - 1; i >= 1; i--) { // Start from bottom, skip header
    var status = data[i][9]; // Status column
    var eventDate = new Date(data[i][3]); // EventDate column
    
    if (status == 'archived' && eventDate < cutoffDate) {
      sheet.deleteRow(i + 1);
    }
  }
}
```

## 📊 Dashboard Formulas

Add these formulas to create a simple dashboard:

### Summary Stats (Add to a new "Dashboard" sheet):
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

A6: Most Common Tag
B6: =INDEX(SPLIT(JOIN(",",Events!I:I),","),1,1)
```

## 🔗 Sharing & Permissions

### Public Read Access:
1. Click "Share" button
2. Change to "Anyone with the link can view"
3. Copy the shareable link

### Editor Access for Moderators:
1. Click "Share" button  
2. Add specific email addresses
3. Give "Editor" permissions
4. Send invitation

### API Access:
1. Get Sheet ID from URL: `https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit`
2. Use this ID in your `VITE_GOOGLE_SHEET_ID` environment variable

## 🎯 Community Guidelines Sheet

Add a fourth sheet called "Guidelines" with community moderation guidelines:

```
A1: Black QTIPOC+ Events Calendar - Community Guidelines

A3: Event Approval Criteria:
A4: ✅ Events must be relevant to Black QTIPOC+ community
A5: ✅ Events should be safe and inclusive spaces
A6: ✅ Information must be accurate and complete
A7: ✅ Events should center Black QTIPOC+ voices and experiences

A9: Moderation Process:
A10: 1. New events start in "draft" status
A11: 2. Moderators review for community relevance
A12: 3. Events move to "published" when approved
A13: 4. Rejected events move to "archived" status

A15: Contact Information:
A16: Community Questions: community@qtipocevents.org
A17: Technical Issues: tech@qtipocevents.org
A18: Moderation Appeals: moderation@qtipocevents.org
```

## 🚀 Ready to Use!

Your Google Sheet template includes:
- ✅ Proper column structure for all data
- ✅ Sample events to test with
- ✅ Color-coded status system
- ✅ Data validation dropdowns
- ✅ Optional automation scripts
- ✅ Dashboard formulas
- ✅ Community guidelines

Simply copy the template, add your API credentials, and start building your community calendar! 🌟

## 📞 Need Help?

- **Setup Issues**: Check the main setup guide in `GOOGLE_SHEETS_SETUP.md`
- **Google Sheets Help**: [Google Sheets Support](https://support.google.com/sheets)
- **API Issues**: [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- **Community Support**: Open an issue in the GitHub repository