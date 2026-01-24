# Event Moderation System - Implementation Guide

## Overview

The Event Moderation System provides a comprehensive interface for reviewing and approving the 253 events discovered by the Research Agent. This system includes intelligent filtering, bulk operations, and source-based recommendations.

## Key Features

### 1. Intelligent Categorization
- **Auto-Approve**: Future events from trusted sources with complete data
- **Auto-Reject**: Past events, incomplete data, test/development entries
- **Manual Review**: Events from unknown or unverified sources

### 2. Bulk Operations
- **Approve Trusted (Future)**: Approve all future events from trusted sources
- **Reject Past Events**: Remove all 243 past events in one action
- **Reject Incomplete Location**: Remove events with "Location TBA" or missing data
- **Reject Web Search/Tests**: Remove bulk web search results and test data

### 3. Advanced Filtering
- View all events, future only, past only
- Filter by trusted sources, auto-reject sources, or manual review queue
- Real-time statistics and counts

## Data Quality Analysis

From the January 23, 2026 audit of 253 pending events:

- **243 past events** (need cleanup)
- **10 future events** (candidates for approval)
- **209 incomplete entries** ("Location TBA" from Web Search)
- **20 UK-based events**
- **1 online event**

### Source Breakdown
- **Web Search**: 209 (bulk discovery, low quality)
- **chrome-extension**: 12 (test data)
- **DIVA Magazine Events**: 12 (trusted source)
- **n8n_automation**: 6 (needs review)
- **Consortium LGBT+**: 5 (trusted source)
- **Other trusted sources**: 9 (Eventbrite, QX Magazine, UK Black Pride, Stonewall)

## Trusted Sources

The following sources are configured as trusted for auto-approval (when other criteria met):

```typescript
- DIVA Magazine Events
- Eventbrite UK - LGBTQ+
- qxmagazine.com
- ukblackpride.org.uk
- QX Magazine Events
- stonewall.org.uk
- Consortium LGBT+
- community-submission (verified)
```

## Auto-Reject Sources

The following sources are automatically flagged for rejection:

```typescript
- Web Search (incomplete data)
- chrome-extension (test data)
- chrome_extension (test data)
```

## Usage Guide

### Accessing the Moderation Dashboard

1. Navigate to Events Calendar: `https://events.blkoutuk.cloud`
2. Click "Moderation" in the navigation
3. Select the "Events" tab

### Recommended Workflow

**Step 1: Clean Up Past Events** (Removes 243 events)
```
Click "Reject Past Events" → Confirm
```

**Step 2: Remove Incomplete Data** (Removes ~209 events with "Location TBA")
```
Click "Reject Incomplete Location" → Confirm
```

**Step 3: Review Future Events** (~10 remaining)
```
Filter: "Future Only"
Review each event individually
Approve relevant events for Black QTIPOC+ community
```

**Alternative Bulk Approach:**
```
Click "Approve Trusted (Future)" → Confirm
This auto-approves events from DIVA, Eventbrite UK, etc.
```

### Individual Event Review

Each event card shows:
- **Title and Description**
- **Date** (with past/future indicator)
- **Location** (with completeness indicator)
- **Source** (with trust level badge)
- **URL** (link to original event)

Actions:
- **Approve**: Publishes event to public calendar
- **Reject**: Removes event from moderation queue

### Filtering Options

- **All Events**: View complete pending queue
- **Future Only**: Events with dates after today
- **Past Events**: Events with dates in the past
- **Trusted Sources**: Events from verified organizations
- **Auto-Reject**: Events flagged for automatic rejection
- **Manual Review**: Events requiring individual assessment

## Technical Implementation

### Files Created

1. `/apps/events-calendar/src/config/trustedEventSources.ts`
   - Configuration for trusted and auto-reject sources
   - Helper functions for source categorization

2. `/apps/events-calendar/src/services/eventModerationService.ts`
   - Bulk approve/reject logic
   - Individual moderation actions
   - Recommendation engine

3. `/apps/events-calendar/src/components/EventModerationPanel.tsx`
   - React component for moderation interface
   - Filtering and bulk operation UI
   - Event card display

4. Test files:
   - `/apps/events-calendar/src/services/__tests__/eventModerationService.test.ts`
   - `/apps/events-calendar/src/config/__tests__/trustedEventSources.test.ts`

### Integration Points

- **Supabase**: Direct connection to events table (status field)
- **Events Calendar**: Integrated into ModerationDashboardPage
- **Research Agent**: Consumes events discovered by automated research

### Status Values

- **pending/draft**: Awaiting moderation
- **published**: Approved and visible on public calendar
- **cancelled**: Rejected during moderation

## Performance Considerations

- **Bulk operations**: Process up to 253 events in single action
- **Filtering**: Client-side for instant response
- **API calls**: Batched when possible to reduce load

## Future Enhancements

1. **Auto-moderation workflow**: Automatically approve trusted sources
2. **Duplicate detection**: Prevent same event from multiple sources
3. **Community flagging**: Allow users to report inappropriate events
4. **Moderation history**: Track who approved/rejected each event
5. **Source reputation**: Track source quality over time

## Support

For questions or issues:
- Check memory: `event-moderation-implementation-jan23-2026`
- Review event analysis: `/event_analysis.json`
- Contact platform maintainers

---

**Implementation Date**: January 23, 2026
**Status**: Production Ready
**Events Processed**: 253 pending events from Research Agent
