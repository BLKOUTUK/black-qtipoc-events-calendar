# Quick Event Addition Guide 🚀

## Method 1: Quick Add Page (Easiest)

**URL:** `https://events.blkoutuk.com/quick-add`

1. Navigate to the quick-add page
2. Paste the Outsavvy (or any) event URL
3. Fill in remaining fields (title auto-fills for Outsavvy)
4. Click "Add Event"
5. ✅ Event appears immediately (auto-approved)

**Bookmark this page** for instant access!

---

## Method 2: Outsavvy Bookmarklet (Fastest)

### One-Time Setup:

1. **Create a new bookmark** in your browser
2. **Name it:** "Add to BLKOUT Events"
3. **Paste this code** as the URL:

```javascript
javascript:(function(){const t=document.title;const u=window.location.href;const d=document.querySelector('meta[property="og:description"]')?.content||'';const l=document.querySelector('[itemp rop="location"]')?.textContent||'London';const date=document.querySelector('time')?.getAttribute('datetime')?.split('T')[0]||'';window.open('https://events.blkoutuk.com/quick-add?url='+encodeURIComponent(u)+'&title='+encodeURIComponent(t)+'&description='+encodeURIComponent(d)+'&location='+encodeURIComponent(l)+'&date='+encodeURIComponent(date),'_blank','width=600,height=800');})();
```

### Usage:

1. Go to any Outsavvy event page
2. Click the "Add to BLKOUT Events" bookmark
3. Quick-add form opens with pre-filled data
4. Review and submit

---

## Method 3: Chrome Extension (Coming Soon)

A one-click Chrome extension for adding events from any site.

---

## Supported Sources

### ✅ Auto-fill Supported:
- **Outsavvy** - Full auto-fill (title, date, location)
- **Eventbrite** - Partial auto-fill
- **Facebook Events** - Manual entry

### 🔜 Coming Soon:
- QX Magazine
- DIVA Magazine
- Time Out London

---

## Tips

- **Events are auto-approved** - they appear immediately on the calendar
- **Add tags** for better discovery: "lgbtq, community, party, nightlife, arts"
- **Bookmark `/quick-add`** for fastest access
- **Use keyboard shortcuts**: Tab to navigate fields quickly

---

## Troubleshooting

**Event not appearing?**
1. Check events.blkoutuk.com (refresh page)
2. Verify all required fields (*) were filled
3. Check browser console for errors

**Bookmarklet not working?**
1. Ensure you pasted the full JavaScript code
2. Try the direct quick-add page instead
3. Some sites block bookmarklets - use quick-add page

---

## For Developers

Want to customize the quick-add form?

**File:** `src/pages/QuickAddEventPage.tsx`

**API Endpoint:**
```
POST https://bgjengudzfickgomjqmz.supabase.co/rest/v1/events
Headers:
  - Content-Type: application/json
  - apikey: <VITE_SUPABASE_ANON_KEY>
  - Authorization: Bearer <VITE_SUPABASE_ANON_KEY>
```

**Payload:**
```json
{
  "title": "Event Title",
  "date": "2026-01-25",
  "url": "https://...",
  "location": "London",
  "description": "...",
  "organizer": "Organizer Name",
  "tags": ["lgbtq", "community"],
  "status": "approved",
  "source": "admin-quick-add"
}
```

---

**Questions?** Check the main README or contact tech@blkoutuk.com
