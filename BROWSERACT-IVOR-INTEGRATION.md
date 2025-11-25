# BrowserAct → Chrome Extension → IVOR AI Gatekeeper Integration

## 🎯 Strategic Vision

**Problem**: BrowserAct scrapes 100+ events/week → Curator manually reviews all → 20+ hours/week wasted

**Solution**: IVOR AI acts as intelligent first-pass filter → Only edge cases need human review

---

## 🏗️ Architecture Overview

### **Current Chrome Extension Flow**
```
User browses web
    ↓ Finds relevant event/article
Chrome Extension detects content
    ↓ User clicks "Submit to BLKOUT"
Google Sheets (pending status)
    ↓ Curator manually reviews
Published to Calendar/Newsroom
```

### **NEW: BrowserAct + IVOR AI Flow**
```
BrowserAct Cloud (Daily 9am)
    ↓ Scrapes 10+ sources automatically
    ↓ Outputs JSON in Chrome Extension format
Chrome Extension API Endpoint
    ↓ Receives BrowserAct submissions
    ↓ Formats for IVOR processing
IVOR AI Gatekeeper
    ↓ Analyzes: Relevance, Quality, Liberation Score
    ↓ Confidence: High (≥90%) | Medium (70-89%) | Low (<70%)
Google Sheets with Status
    ├─→ HIGH CONFIDENCE: Auto-approve → Published
    ├─→ MEDIUM CONFIDENCE: Curator quick-review (5 min)
    └─→ LOW CONFIDENCE: Curator deep-review (15 min)
Events Calendar / Newsroom
```

**Result**: Curator only reviews 10-20% of content (edge cases), saving 15+ hours/week

---

## 🔌 Integration Points

### **1. BrowserAct Output Format** (Match Chrome Extension Structure)

**Chrome Extension Existing Output**:
```json
{
  "type": "event",
  "title": "Queer Black Joy Dance Party",
  "description": "Monthly dance party celebrating queer black joy...",
  "event_date": "2025-11-15T20:00:00Z",
  "location": "Corsica Studios, London SE17",
  "source_url": "https://instagram.com/p/abc123",
  "organizer_name": "Queer Black Joy Collective",
  "tags": ["black", "queer", "dance", "community"],
  "price": "Free",
  "image_url": "https://instagram.com/...",
  "submitted_by": "chrome-extension",
  "submitted_at": "2025-11-03T10:00:00Z"
}
```

**BrowserAct NEW Output** (Identical Structure):
```json
{
  "type": "event",
  "title": "Black Trans Liberation Workshop",
  "description": "Workshop on self-care and community organizing...",
  "event_date": "2025-11-20T18:00:00Z",
  "location": "LGBT Foundation Manchester",
  "source_url": "https://lgbt.foundation/events/123",
  "organizer_name": "LGBT Foundation Manchester",
  "tags": ["black", "trans", "workshop", "liberation"],
  "price": "Free",
  "image_url": "https://lgbt.foundation/images/event.jpg",
  "submitted_by": "browseract-automation",
  "submitted_at": "2025-11-03T09:00:00Z",
  "browseract_metadata": {
    "source_platform": "lgbt.foundation",
    "scrape_confidence": 0.95,
    "automation_id": "daily-manchester-events"
  }
}
```

**Key Insight**: BrowserAct uses exact same JSON structure as Chrome Extension → Can use same API endpoint!

---

### **2. Chrome Extension API Endpoint** (NEW)

**Create New Endpoint**: `POST /api/extension/submit`

This endpoint currently exists for manual Chrome Extension submissions. We'll extend it to accept BrowserAct automated submissions.

**Location**: Add to `background.js` service worker

```javascript
// NEW: API endpoint for BrowserAct submissions
chrome.runtime.onMessageExternal.addListener(
  async (request, sender, sendResponse) => {
    if (request.action === 'submit_content') {
      // BrowserAct sends data here
      const submissionData = request.data;

      // Step 1: Send to IVOR for AI moderation
      const ivorAnalysis = await sendToIVORForModeration(submissionData);

      // Step 2: Add IVOR confidence score
      submissionData.ivor_confidence = ivorAnalysis.confidence;
      submissionData.ivor_reasoning = ivorAnalysis.reasoning;
      submissionData.liberation_score = ivorAnalysis.liberation_score;

      // Step 3: Route based on confidence
      if (ivorAnalysis.confidence >= 0.90) {
        // Auto-approve: Publish directly
        await publishToGoogleSheets(submissionData, 'approved');
        sendResponse({ status: 'auto-approved', reason: 'High confidence' });
      } else if (ivorAnalysis.confidence >= 0.70) {
        // Medium confidence: Curator quick review
        await publishToGoogleSheets(submissionData, 'review-quick');
        sendResponse({ status: 'pending-review', reason: 'Medium confidence' });
      } else {
        // Low confidence: Curator deep review or reject
        await publishToGoogleSheets(submissionData, 'review-deep');
        sendResponse({ status: 'pending-review', reason: 'Low confidence' });
      }
    }
  }
);
```

**Webhook Alternative**: If BrowserAct can't call Chrome Extension API directly, create Netlify function:

```javascript
// netlify/functions/browseract-receiver.js
export async function handler(event, context) {
  const submissionData = JSON.parse(event.body);

  // Forward to IVOR for moderation
  const ivorResponse = await fetch('https://ivor-core.railway.app/api/moderate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: submissionData,
      moderation_type: 'event_relevance'
    })
  });

  const ivorAnalysis = await ivorResponse.json();

  // Route based on IVOR confidence
  if (ivorAnalysis.confidence >= 0.90) {
    await autoApproveToGoogleSheets(submissionData);
    return { statusCode: 200, body: JSON.stringify({ status: 'auto-approved' }) };
  } else {
    await sendToCuratorReview(submissionData, ivorAnalysis);
    return { statusCode: 200, body: JSON.stringify({ status: 'pending-review' }) };
  }
}
```

---

### **3. IVOR AI Gatekeeper API** (NEW Endpoint)

**Create**: `POST /api/moderate` in IVOR Core

**Purpose**: AI analyzes scraped content for relevance to Black QTIPOC+ communities

**Request**:
```json
{
  "content": {
    "type": "event",
    "title": "Black Trans Liberation Workshop",
    "description": "Workshop on self-care and community organizing for Black trans and non-binary people in Manchester.",
    "organizer_name": "LGBT Foundation Manchester",
    "tags": ["black", "trans", "workshop"],
    "source_url": "https://lgbt.foundation/events/123"
  },
  "moderation_type": "event_relevance"
}
```

**IVOR Processing**:
```python
# ivor-core/src/api/moderationRoutes.ts (NEW)

async function moderateContent(content: any): Promise<ModerationResult> {
  const prompt = `
You are IVOR, the BLKOUT Liberation Platform's AI moderator.

Analyze this ${content.type} for relevance to Black queer and trans communities in the UK.

Event: ${content.title}
Description: ${content.description}
Organizer: ${content.organizer_name}
Tags: ${content.tags.join(', ')}
Source: ${content.source_url}

Evaluate:
1. **Relevance**: Is this specifically for Black QTIPOC+ people?
   - Explicitly Black + LGBTQ+: HIGH relevance
   - One or the other: MEDIUM relevance
   - Neither: LOW relevance

2. **Quality**: Is this a legitimate, safe event?
   - Verified organization: HIGH quality
   - Known community group: MEDIUM quality
   - Unknown/suspicious: LOW quality

3. **Liberation Focus**: Does this align with Black queer liberation values?
   - Explicitly anti-racist, anti-capitalist, community-led: HIGH
   - Generally progressive/inclusive: MEDIUM
   - Apolitical/corporate: LOW

Respond ONLY with this JSON format:
{
  "confidence": 0.95,  // 0-1 scale
  "relevance": "high",  // high/medium/low
  "quality": "high",
  "liberation_score": 0.90,
  "reasoning": "This event is explicitly for Black trans people, organized by a trusted LGBTQ+ foundation with a history of serving communities of color. High liberation focus on community organizing and self-care.",
  "recommendation": "auto-approve"  // auto-approve/review/reject
}
`;

  const response = await groqClient.chat.completions.create({
    model: 'llama-3.1-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,  // Low temperature for consistent moderation
    max_tokens: 500
  });

  return JSON.parse(response.choices[0].message.content);
}
```

**Response**:
```json
{
  "confidence": 0.95,
  "relevance": "high",
  "quality": "high",
  "liberation_score": 0.90,
  "reasoning": "Event explicitly for Black trans people, organized by trusted LGBT Foundation Manchester. Strong liberation focus on community organizing and self-care.",
  "recommendation": "auto-approve",
  "processing_time_ms": 850
}
```

---

## 📊 Google Sheets Integration (Enhanced)

### **NEW Status Column**: `moderation_status`

| Status | Meaning | Curator Action |
|--------|---------|----------------|
| `auto-approved` | IVOR ≥90% confidence | Published immediately, no action needed |
| `review-quick` | IVOR 70-89% confidence | Quick 2-minute review, likely approve |
| `review-deep` | IVOR <70% confidence | 10-minute review, investigate further |
| `rejected` | IVOR flagged as spam/irrelevant | Curator can override if wrong |

### **NEW Columns Added to Google Sheets**:
- `ivor_confidence` (0-100%)
- `ivor_reasoning` (text explanation)
- `liberation_score` (0-100%)
- `moderation_status` (auto-approved / review-quick / review-deep / rejected)
- `submitted_by` (browseract-automation / chrome-extension / manual)

### **Curator Dashboard View**:
```
[Auto-Approved (42 events)] ← No action needed
    ↓
[Quick Review (12 events)] ← 5 minutes total
    - "Trans Pride Glasgow" (85% confidence)
    - "Black History Month Panel" (78% confidence)
    ↓
[Deep Review (3 events)] ← 15 minutes total
    - "Diversity Workshop" (62% confidence - vague description)
    - "Community Gathering" (58% confidence - missing details)
```

**Time Savings**:
- Before: 57 events × 20 min = **19 hours**
- After:
  - 42 auto-approved × 0 min = 0 hours
  - 12 quick review × 0.5 min = 6 minutes
  - 3 deep review × 15 min = 45 minutes
  - **Total: 51 minutes** (96% reduction!)

---

## 🔄 End-to-End Flow

### **Daily Automated Pipeline**

**9:00 AM - BrowserAct Runs**:
```javascript
// BrowserAct automation: "Scrape Instagram @queerblackjoy"
{
  "schedule": "daily 9am",
  "sources": [
    "instagram.com/queerblackjoy",
    "instagram.com/ukblackpride",
    "facebook.com/events (search: Black LGBTQ London)",
    "lgbt.foundation/events",
    "galop.org.uk/events"
  ],
  "output_webhook": "https://blkout-calendar.netlify.app/.netlify/functions/browseract-receiver",
  "output_format": "chrome_extension_json"
}
```

**9:05 AM - Webhook Receives 47 Events**:
```javascript
// netlify/functions/browseract-receiver.js receives:
[
  { title: "Queer Black Joy Dance Party", ... },
  { title: "Trans Pride Manchester", ... },
  // ... 45 more events
]
```

**9:06 AM - IVOR Processes Each Event** (Batch Processing):
```javascript
const results = await Promise.all(
  events.map(event => ivorModerate(event))
);

// Results:
// 35 events: confidence ≥90% → auto-approve
// 10 events: confidence 70-89% → review-quick
// 2 events: confidence <70% → review-deep
```

**9:07 AM - Write to Google Sheets**:
```javascript
// Auto-approved events
await sheetsAPI.append('Events', autoApprovedEvents, { status: 'published' });

// Review-needed events
await sheetsAPI.append('Events', reviewEvents, { status: 'pending-review' });

// Send Slack notification to curators
await slack.send({
  text: "🤖 IVOR processed 47 events: 35 auto-approved, 10 quick review, 2 deep review"
});
```

**10:00 AM - Curator Reviews (30 minutes)**:
```
Opens Google Sheets:
- ✅ 35 auto-approved events already published
- 📝 10 quick review events:
  - Scrolls through, spot-checks descriptions
  - Approves 9, rejects 1 (not relevant)
  - Time: 5 minutes
- 🔍 2 deep review events:
  - Reads full descriptions, checks source URLs
  - Approves 1, rejects 1 (spam)
  - Time: 10 minutes

Total curator time: 15 minutes (vs. 19 hours manually!)
```

**10:15 AM - All Done**:
- 44 events published to Events Calendar
- 3 events rejected
- Curator saved 18 hours 45 minutes

---

## 🎨 Chrome Extension UI Updates

### **NEW: BrowserAct Integration Panel**

**Extension Popup**:
```html
<!-- popup.html NEW SECTION -->
<div class="browseract-status">
  <h3>🤖 Automated Scraping</h3>
  <div class="automation-stats">
    <span>Last run: Today 9:05 AM</span>
    <span>Events found: 47</span>
    <span>Auto-approved: 35</span>
    <span>Awaiting review: 12</span>
  </div>

  <button onclick="viewPendingReviews()">
    Review Pending (12) →
  </button>
</div>
```

**Options Page**:
```html
<!-- options.html NEW SECTION -->
<div class="browseract-config">
  <h2>Automated Scraping (BrowserAct)</h2>

  <label>
    <input type="checkbox" id="enable-browseract" checked>
    Enable automated event discovery
  </label>

  <label>
    IVOR Auto-Approve Threshold:
    <input type="range" min="80" max="95" value="90" id="auto-approve-threshold">
    <span>≥90%</span>
  </label>

  <label>
    Sources to scrape (one per line):
    <textarea id="browseract-sources">
instagram.com/queerblackjoy
instagram.com/ukblackpride
facebook.com/events?q=Black+LGBTQ+London
lgbt.foundation/events
galop.org.uk/events
    </textarea>
  </label>

  <button onclick="testBrowserActConnection()">
    Test Connection
  </button>
</div>
```

---

## 🧪 Testing & Validation

### **Phase 1: IVOR Accuracy Testing** (Week 1)

**Goal**: Validate IVOR's moderation accuracy before full automation

**Process**:
1. Take 50 past events (25 approved, 25 rejected by curators)
2. Run through IVOR moderation API
3. Compare IVOR recommendations vs. curator decisions
4. Calculate accuracy: `correct_predictions / total_events`

**Success Criteria**: ≥85% accuracy (43/50 events correct)

**If <85%**: Refine IVOR prompt, add more examples, adjust confidence thresholds

### **Phase 2: Shadow Mode** (Week 2)

**Goal**: Run BrowserAct + IVOR in parallel with manual curation without auto-approving

**Process**:
1. BrowserAct scrapes events daily
2. IVOR analyzes and marks confidence scores
3. Curator still reviews ALL events (including auto-approve candidates)
4. Track: How often would IVOR have been correct?

**Success Metrics**:
- IVOR ≥90% confidence → Curator approved: ≥95% match rate
- IVOR 70-89% → Quick review time: <5 min total
- False positives (IVOR approved, curator rejected): <5%

### **Phase 3: Gradual Rollout** (Week 3-4)

**Week 3**: Auto-approve ONLY events with ≥95% confidence (ultra-conservative)
**Week 4**: Lower threshold to ≥90% confidence if Week 3 had <2% errors

---

## 🔐 Security & Privacy

### **BrowserAct → Chrome Extension Authentication**

**Problem**: Can't let anyone send fake events to extension API

**Solution 1: Shared Secret**:
```javascript
// BrowserAct webhook includes secret token
const browseractSecret = process.env.BROWSERACT_SECRET_TOKEN;

// Chrome Extension validates
if (request.headers['X-BrowserAct-Token'] !== browseractSecret) {
  return { statusCode: 401, body: 'Unauthorized' };
}
```

**Solution 2: API Key**:
```javascript
// Generate unique API key for BrowserAct in extension options
const apiKey = generateAPIKey(); // Save in extension storage

// BrowserAct includes API key in webhook
headers: { 'Authorization': `Bearer ${apiKey}` }
```

### **IVOR Moderation Rate Limiting**

**Problem**: Could be abused to spam IVOR API

**Solution**:
```javascript
// Rate limit: 100 moderation requests per hour per source
const rateLimit = new Map();

function checkRateLimit(source: string): boolean {
  const count = rateLimit.get(source) || 0;
  if (count >= 100) return false;
  rateLimit.set(source, count + 1);
  setTimeout(() => rateLimit.delete(source), 3600000); // 1 hour
  return true;
}
```

---

## 📈 Success Metrics

### **Efficiency Metrics**
- **Time Saved**: Target 90% reduction (19 hours → 2 hours/week)
- **Auto-Approval Rate**: Target 70-80% of events
- **False Positive Rate**: Target <5% (IVOR approves, should be rejected)
- **False Negative Rate**: Target <10% (IVOR rejects, should be approved)

### **Quality Metrics**
- **Event Accuracy**: ≥95% of auto-approved events are actually relevant
- **Community Feedback**: User reports of irrelevant events <2%
- **Coverage**: BrowserAct discovers 50+ new events per week

### **Adoption Metrics**
- **Curator Satisfaction**: 4.5/5 rating on new system
- **Response Time**: Events published within 24 hours of discovery
- **Community Growth**: 20% increase in event attendance from better discovery

---

## 🚀 Implementation Roadmap

### **Week 1: IVOR Moderation API**
- [ ] Create `/api/moderate` endpoint in ivor-core
- [ ] Write IVOR moderation prompt
- [ ] Test with 50 historical events
- [ ] Refine prompt based on accuracy

### **Week 2: Chrome Extension Updates**
- [ ] Add `onMessageExternal` listener for BrowserAct
- [ ] Create IVOR API client in extension
- [ ] Add new status columns to Google Sheets integration
- [ ] Build BrowserAct status UI panel

### **Week 3: BrowserAct Configuration**
- [ ] Purchase £69 lifetime deal
- [ ] Create 5 initial automations (Instagram, Facebook, LGBT Foundation, etc.)
- [ ] Configure webhook to Netlify function
- [ ] Test end-to-end flow with 1 source

### **Week 4: Integration Testing**
- [ ] Run shadow mode (IVOR analyzes but doesn't auto-approve)
- [ ] Measure accuracy vs. curator decisions
- [ ] Tune confidence thresholds
- [ ] Get curator feedback

### **Week 5: Gradual Rollout**
- [ ] Enable auto-approve for ≥95% confidence only
- [ ] Monitor for 1 week, check error rate
- [ ] Lower to ≥90% if <2% errors
- [ ] Full production launch

---

## 💡 Advanced Features (Future)

### **1. IVOR Learning from Curator Feedback**

**Concept**: When curator overrides IVOR decision, IVOR learns

```python
# Store curator overrides
when curator_rejects_ivor_approval:
    store_training_example({
        'event': event_data,
        'ivor_prediction': 'approve',
        'curator_decision': 'reject',
        'curator_reason': 'Not specifically for Black QTIPOC people'
    })

# Monthly: Re-train IVOR with feedback
fine_tune_model(training_examples)
```

### **2. Multi-Language Support**

**BrowserAct** can scrape non-English UK community sites:
- Translate to English for IVOR analysis
- Keep original language for publication

### **3. Duplicate Detection**

**IVOR** checks if event already exists:
```python
if similar_event_exists(title, date, location):
    return { recommendation: 'duplicate', confidence: 1.0 }
```

### **4. Proactive Source Discovery**

**IVOR** suggests new sources to scrape:
- Analyzes which organizers/venues appear frequently in manual submissions
- Suggests: "Should we auto-scrape this organization's website?"

---

## 📋 Questions to Resolve

### **Technical Questions**:
1. **Can BrowserAct call Chrome Extension API directly?**
   - If not, use Netlify webhook as intermediary

2. **Does Chrome Extension allow external messages?**
   - Yes, via `chrome.runtime.onMessageExternal`
   - Need to whitelist BrowserAct domain in manifest

3. **How to handle BrowserAct rate limits?**
   - Cache IVOR decisions for 24 hours
   - Batch process events (analyze 50 at once)

### **Product Questions**:
1. **What confidence threshold should trigger auto-approve?**
   - Start conservative (≥95%), lower to ≥90% after validation

2. **Should curators be notified for every auto-approval?**
   - No: Daily digest email with summary
   - Yes: Real-time Slack notification for edge cases

3. **What happens if IVOR is down?**
   - Fallback: All events go to manual review queue
   - Set up uptime monitoring and alerts

---

## 🎯 Next Steps

### **Immediate Actions**:
1. **Buy BrowserAct £69 lifetime deal** (before it expires!)
2. **Test IVOR moderation prompt** with 10 sample events
3. **Measure baseline**: How long does curator spend per event currently?

### **This Week**:
1. **Build IVOR `/api/moderate` endpoint** (4 hours)
2. **Update Chrome Extension** to accept BrowserAct submissions (4 hours)
3. **Configure first BrowserAct automation** (1 hour)
4. **Test end-to-end flow** with 5 events (2 hours)

### **Next Week**:
1. **Shadow mode testing** (run for 7 days)
2. **Collect curator feedback**
3. **Refine confidence thresholds**
4. **Prepare for gradual rollout**

---

**Document Version**: 1.0
**Date**: 2025-11-03
**Author**: Claude (BLKOUT Technical Architect)
**Status**: Ready for Implementation
