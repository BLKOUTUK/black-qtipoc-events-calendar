# Google Sheets Formulas for Black QTIPOC+ Events Calendar

This document contains useful formulas to enhance your Google Sheet with automatic calculations and insights.

## 📊 Dashboard Sheet Formulas

Create a new sheet called "Dashboard" and add these formulas:

### Basic Statistics
```
A1: Metric
B1: Value
C1: Formula

A2: Total Events
B2: =COUNTA(Events!A:A)-1
C2: Count all events minus header

A3: Published Events
B3: =COUNTIF(Events!J:J,"published")
C3: Count events with published status

A4: Pending Events
B4: =COUNTIFS(Events!J:J,"draft")+COUNTIFS(Events!J:J,"reviewing")
C4: Count draft + reviewing events

A5: Archived Events
B5: =COUNTIF(Events!J:J,"archived")
C5: Count archived events

A6: This Month's Events
B6: =COUNTIFS(Events!D:D,">="&EOMONTH(TODAY(),-1)+1,Events!D:D,"<="&EOMONTH(TODAY(),0),Events!J:J,"published")
C6: Published events in current month

A7: Next Month's Events
B7: =COUNTIFS(Events!D:D,">="&EOMONTH(TODAY(),0)+1,Events!D:D,"<="&EOMONTH(TODAY(),1),Events!J:J,"published")
C7: Published events in next month

A8: Free Events
B8: =COUNTIFS(Events!K:K,"Free",Events!J:J,"published")
C8: Published events that are free

A9: Paid Events
B9: =COUNTIFS(Events!K:K,"<>Free",Events!K:K,"<>",Events!J:J,"published")
C9: Published events with a price
```

### Source Analysis
```
A11: Events by Source
B11: Count

A12: Community Submitted
B12: =COUNTIFS(Events!F:F,"community",Events!J:J,"published")

A13: Eventbrite Discovered
B13: =COUNTIFS(Events!F:F,"eventbrite",Events!J:J,"published")

A14: Facebook Discovered
B14: =COUNTIFS(Events!F:F,"facebook",Events!J:J,"published")

A15: Outsavvy Discovered
B15: =COUNTIFS(Events!F:F,"outsavvy",Events!J:J,"published")
```

### Top Organizers
```
A17: Top Organizers
B17: Event Count

A18: =INDEX(Events!H:H,MODE(MATCH(Events!H:H,Events!H:H,0)))
B18: =COUNTIFS(Events!H:H,A18,Events!J:J,"published")
```

### Recent Activity
```
A20: Recent Activity (Last 7 Days)
B20: Count

A21: Events Added
B21: =COUNTIFS(Events!M:M,">="&TODAY()-7,Events!M:M,"<="&TODAY())

A22: Events Published
B22: =COUNTIFS(Events!J:J,"published",Events!M:M,">="&TODAY()-7)

A23: Scraping Runs
B23: =COUNTIFS(ScrapingLogs!F:F,">="&TODAY()-7)
```

## 🏷️ Tag Analysis Formulas

### Most Popular Tags
```
A25: Popular Tags Analysis

A26: All Tags
B26: =JOIN(",",Events!I:I)

A27: Tag Count
B27: =LEN(B26)-LEN(SUBSTITUTE(B26,",",""))+1

A28: Most Common Tag
B28: =INDEX(SPLIT(B26,","),1,1)
```

### Tag Frequency (Advanced)
Create a helper column to count specific tags:
```
A30: Tag
B30: Count

A31: community
B31: =SUMPRODUCT(--(ISNUMBER(SEARCH("community",Events!I:I))))

A32: workshop
B32: =SUMPRODUCT(--(ISNUMBER(SEARCH("workshop",Events!I:I))))

A33: arts
B33: =SUMPRODUCT(--(ISNUMBER(SEARCH("arts",Events!I:I))))

A34: healing
B34: =SUMPRODUCT(--(ISNUMBER(SEARCH("healing",Events!I:I))))

A35: celebration
B35: =SUMPRODUCT(--(ISNUMBER(SEARCH("celebration",Events!I:I))))
```

## 📅 Date-Based Analysis

### Events by Month
```
A37: Month
B37: Published Events

A38: =TEXT(EOMONTH(TODAY(),-2)+1,"MMM YYYY")
B38: =COUNTIFS(Events!D:D,">="&EOMONTH(TODAY(),-2)+1,Events!D:D,"<="&EOMONTH(TODAY(),-2)+31,Events!J:J,"published")

A39: =TEXT(EOMONTH(TODAY(),-1)+1,"MMM YYYY")
B39: =COUNTIFS(Events!D:D,">="&EOMONTH(TODAY(),-1)+1,Events!D:D,"<="&EOMONTH(TODAY(),-1)+31,Events!J:J,"published")

A40: =TEXT(EOMONTH(TODAY(),0)+1,"MMM YYYY")
B40: =COUNTIFS(Events!D:D,">="&EOMONTH(TODAY(),0)+1,Events!D:D,"<="&EOMONTH(TODAY(),0)+31,Events!J:J,"published")
```

### Upcoming Events (Next 30 Days)
```
A42: Upcoming Events (Next 30 Days)
A43: =FILTER(Events!B:L,Events!D:D>=TODAY(),Events!D:D<=TODAY()+30,Events!J:J="published")
```

## 🔍 Quality Metrics

### Moderation Efficiency
```
A45: Moderation Metrics

A46: Average Days to Publish
B46: =AVERAGE(IF(Events!J:J="published",Events!M:M-Events!M:M,0))

A47: Approval Rate
B47: =COUNTIF(Events!J:J,"published")/(COUNTA(Events!J:J)-1)

A48: Rejection Rate
B48: =COUNTIF(Events!J:J,"archived")/(COUNTA(Events!J:J)-1)
```

### Scraping Performance
```
A50: Scraping Performance

A51: Total Events Found
B51: =SUM(ScrapingLogs!C:C)

A52: Total Events Added
B52: =SUM(ScrapingLogs!D:D)

A53: Success Rate
B53: =B52/B51

A54: Last Successful Scrape
B54: =MAXIFS(ScrapingLogs!F:F,ScrapingLogs!E:E,"success")
```

## 📈 Conditional Formatting Rules

### Events Sheet
1. **Status Column (J)**:
   - `=$J:$J="published"` → Green background (#34A853)
   - `=$J:$J="draft"` → Yellow background (#FBBC04)
   - `=$J:$J="reviewing"` → Orange background (#FF6D01)
   - `=$J:$J="archived"` → Red background (#EA4335)

2. **Past Events**:
   - `=$D:$D<TODAY()` → Light gray background (#F5F5F5)

3. **Upcoming Events (Next 7 Days)**:
   - `=AND($D:$D>=TODAY(),$D:$D<=TODAY()+7,$J:$J="published")` → Light blue background (#E3F2FD)

### ScrapingLogs Sheet
1. **Status Column (E)**:
   - `=$E:$E="success"` → Green background
   - `=$E:$E="partial"` → Yellow background
   - `=$E:$E="error"` → Red background

## 🎯 Data Validation Rules

### Events Sheet
1. **Status Column (J)**: List of items: `draft,reviewing,published,archived`
2. **Source Column (F)**: List of items: `eventbrite,community,facebook,outsavvy`
3. **EventDate Column (D)**: Date validation with format `YYYY-MM-DD"T"HH:MM:SS"Z"`

### ScrapingLogs Sheet
1. **Status Column (E)**: List of items: `success,partial,error`
2. **Source Column (B)**: List of items: `eventbrite,facebook,outsavvy,all_sources`

## 🔄 Auto-Update Formulas

### Today's Date Reference
```
A60: Today
B60: =TODAY()

A61: Current Month
B61: =TEXT(TODAY(),"MMMM YYYY")

A62: Days Until Next Event
B62: =MIN(IF(Events!D:D>TODAY(),Events!D:D-TODAY()))
```

### Dynamic Ranges
```
A64: Event Count This Quarter
B64: =COUNTIFS(Events!D:D,">="&DATE(YEAR(TODAY()),ROUNDUP(MONTH(TODAY())/3,0)*3-2,1),Events!D:D,"<="&EOMONTH(DATE(YEAR(TODAY()),ROUNDUP(MONTH(TODAY())/3,0)*3,1),0),Events!J:J,"published")
```

## 📊 Chart Data Preparation

### Events by Month (Chart Data)
```
A66: Month
B66: Events

A67: =TEXT(EOMONTH(TODAY(),-5)+1,"MMM")
B67: =COUNTIFS(Events!D:D,">="&EOMONTH(TODAY(),-5)+1,Events!D:D,"<="&EOMONTH(TODAY(),-5)+31,Events!J:J,"published")

A68: =TEXT(EOMONTH(TODAY(),-4)+1,"MMM")
B68: =COUNTIFS(Events!D:D,">="&EOMONTH(TODAY(),-4)+1,Events!D:D,"<="&EOMONTH(TODAY(),-4)+31,Events!J:J,"published")

A69: =TEXT(EOMONTH(TODAY(),-3)+1,"MMM")
B69: =COUNTIFS(Events!D:D,">="&EOMONTH(TODAY(),-3)+1,Events!D:D,"<="&EOMONTH(TODAY(),-3)+31,Events!J:J,"published")

A70: =TEXT(EOMONTH(TODAY(),-2)+1,"MMM")
B70: =COUNTIFS(Events!D:D,">="&EOMONTH(TODAY(),-2)+1,Events!D:D,"<="&EOMONTH(TODAY(),-2)+31,Events!J:J,"published")

A71: =TEXT(EOMONTH(TODAY(),-1)+1,"MMM")
B71: =COUNTIFS(Events!D:D,">="&EOMONTH(TODAY(),-1)+1,Events!D:D,"<="&EOMONTH(TODAY(),-1)+31,Events!J:J,"published")

A72: =TEXT(TODAY(),"MMM")
B72: =COUNTIFS(Events!D:D,">="&EOMONTH(TODAY(),0)+1,Events!D:D,"<="&EOMONTH(TODAY(),0)+31,Events!J:J,"published")
```

## 🎨 Tips for Better Visualization

1. **Use Sparklines**: `=SPARKLINE(B67:B72)` for mini charts
2. **Progress Bars**: Use conditional formatting with data bars
3. **Color Coding**: Consistent colors across all sheets
4. **Named Ranges**: Create named ranges for frequently used data
5. **Freeze Panes**: Freeze header rows for easier navigation

These formulas will turn your Google Sheet into a powerful analytics dashboard for your Black QTIPOC+ Events Calendar! 📊✨