# 🚀 Quick Start Guide - Finding Your New Features

## 📍 Where to Find Everything

### 🎨 Featured Hero Carousel

**Location:** Top of the homepage (https://your-vercel-url.vercel.app)

**What You'll See:**
1. Visit your production site
2. Look **immediately below** the "WHAT'S ON" hero section
3. Look **above** the filter bar (Date Range, Source, Location dropdowns)
4. You'll see a large carousel IF you have featured content active

**Currently:** The carousel won't show yet because you need to add featured content first (see below).

---

### 🎯 How to Add Featured Content (Admin Only)

**Step 1: Sign In as Admin**
1. Go to your production site
2. Scroll to the yellow "Community Action Bar"
3. Click **"Admin Login"** button (bottom right of yellow bar)
4. Enter your admin credentials
5. You should now see the **Admin Controls** section at the top (dark gray box)

**Step 2: Access Featured Content Manager**
1. In the **Admin Controls** section (dark gray box at top)
2. Look for the **"Featured Content"** button (pink/purple color)
3. Click it - a modal will open

**Step 3: Add Your First Featured Content**
1. In the modal, click **"Add Featured Content"** or similar button
2. Fill in the form:
   - **Title:** Main headline (e.g., "Black Trans Joy Workshop")
   - **Caption:** Short description (e.g., "Join us for healing and community")
   - **Image URL:** Full URL to an image (e.g., https://example.com/image.jpg)
   - **Link URL:** Where the "Learn More" button goes (e.g., https://eventbrite.com/event-id)
   - **Week Start:** Start date (usually current week's Monday)
   - **Display Order:** 1 (or 2, 3, etc. for multiple items)
   - **Status:** Select **"Active"**
3. Click **"Save"**
4. Close the modal
5. **Refresh the page** - you should now see the carousel!

---

### 📅 Google Calendar Integration

#### For Regular Users (Public Features)

**Location:** On each event card

**What You'll See:**
1. Browse events on the homepage
2. Each event card has an **"Add to Calendar"** dropdown button
3. Click it to see two options:
   - **"Google Calendar"** - Opens Google Calendar in new tab with event pre-filled
   - **"Download .ics"** - Downloads universal calendar file for Apple Calendar, Outlook, etc.

**How to Use:**
- **Google Calendar:** Click → New tab opens → Click "Save" in Google Calendar
- **Download .ics:** Click → File downloads → Open in your calendar app

---

#### For Admins (Calendar Sync Feature)

**Location:** Admin Controls section

**Step 1: Access Calendar Sync Dashboard**
1. Sign in as admin (see "How to Add Featured Content" above)
2. In the **Admin Controls** section (dark gray box)
3. Look for the **"Calendar Sync"** button (purple color)
4. Click it - a modal will open

**Step 2: Connect to Google Calendar**
1. In the modal, you'll see authentication status
2. Click **"Connect"** button
3. A popup will open asking you to sign in with Google
4. Grant calendar permissions
5. The popup closes, and you're now connected!

**Step 3: Sync Events to Public Calendar**
1. **Sync All:** Click "Sync All Events" to bulk sync all published events
2. **Sync Individual:** Click the sync button next to specific events
3. Watch the progress indicators
4. Check your public Google Calendar - events should appear!

**Note:** For this to work in production, you need to:
1. Set up Google Cloud Console (see `docs/GOOGLE_CALENDAR_SETUP.md`)
2. Add environment variables to Vercel (see below)

---

## 🔧 Setting Up Google Calendar (Required for Admin Sync)

### Step 1: Google Cloud Console Setup

1. Go to https://console.cloud.google.com/
2. Create a new project: "BLKOUT Events Calendar"
3. Enable **Google Calendar API**
4. Create **OAuth 2.0 credentials**:
   - Application type: Web application
   - Authorized JavaScript origins: `https://your-vercel-url.vercel.app`
   - Authorized redirect URIs: `https://your-vercel-url.vercel.app`
5. Copy your **Client ID** and **Client Secret**

### Step 2: Create Public Google Calendar

1. Go to https://calendar.google.com/
2. Create a new calendar: "BLKOUT Community Events"
3. Go to calendar settings → "Integrate calendar"
4. Copy the **Calendar ID** (looks like: `abc123@group.calendar.google.com`)
5. Make calendar **public** in settings

### Step 3: Add Environment Variables to Vercel

1. Go to https://vercel.com/dashboard
2. Select your project: **black-qtipoc-events-calendar**
3. Go to **Settings** → **Environment Variables**
4. Add these three variables:

```
VITE_GOOGLE_CALENDAR_ID=your-calendar-id@group.calendar.google.com
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=your-client-secret
```

5. Click **"Save"**
6. Redeploy: Run `vercel --prod` in terminal OR click "Redeploy" in Vercel dashboard

**Full detailed instructions:** See `docs/GOOGLE_CALENDAR_SETUP.md`

---

## 📱 Visual Guide - Where Things Are

### Homepage Layout (Top to Bottom)

```
┌─────────────────────────────────────┐
│  Header (Navigation)                │
├─────────────────────────────────────┤
│  WHAT'S ON Hero Section             │
│  (Big yellow text with logo)        │
├─────────────────────────────────────┤
│  🔐 ADMIN CONTROLS (if signed in)   │  ← Featured Content & Calendar Sync buttons here
│  Dark gray box with yellow text     │
├─────────────────────────────────────┤
│  COMMUNITY ACTION BAR (Yellow)      │  ← Admin Login button here
│  "Add Your Event" button            │
├─────────────────────────────────────┤
│  🎨 FEATURED HERO CAROUSEL           │  ← NEW! Your carousel appears here
│  (Only shows if featured content     │
│   is active)                         │
├─────────────────────────────────────┤
│  FILTER BAR                          │
│  Date Range | Source | Location      │
├─────────────────────────────────────┤
│  EVENT CARDS                         │  ← "Add to Calendar" dropdown on each card
│  ┌──────────────────┐               │
│  │ Event Title      │               │
│  │ Date & Location  │               │
│  │ [Add to Calendar▼]│  ← Click here for Google Calendar / .ics
│  └──────────────────┘               │
└─────────────────────────────────────┘
```

---

## ✅ Quick Testing Checklist

### Test Featured Carousel
- [ ] Sign in as admin
- [ ] Click "Featured Content" button (pink)
- [ ] Add featured content with image URL
- [ ] Set status to "Active"
- [ ] Save and close modal
- [ ] Refresh page
- [ ] See carousel at top with your content
- [ ] Test auto-rotation (waits 5 seconds)
- [ ] Test arrow buttons (left/right)
- [ ] Test dot indicators (click to jump)
- [ ] Test "Learn More" button

### Test Calendar Export (Public)
- [ ] Browse to an event card
- [ ] Click "Add to Calendar" dropdown
- [ ] Click "Google Calendar" → Opens in new tab
- [ ] Click "Download .ics" → File downloads
- [ ] Open .ics file in calendar app

### Test Calendar Sync (Admin)
- [ ] Sign in as admin
- [ ] Click "Calendar Sync" button (purple)
- [ ] Click "Connect" → Google OAuth popup
- [ ] Grant permissions
- [ ] Try "Sync All" or sync individual event
- [ ] Check your public Google Calendar
- [ ] Verify event appears

---

## 🐛 Troubleshooting

### "I don't see the carousel"
- ✅ Make sure you added featured content via admin panel
- ✅ Make sure status is set to "Active"
- ✅ Make sure week_start date is current or past
- ✅ Refresh the page after adding content

### "I don't see Admin Controls"
- ✅ Make sure you're signed in as admin
- ✅ Look for dark gray box below hero section
- ✅ If not visible, sign out and sign in again

### "Calendar Sync says 'Client ID not configured'"
- ✅ Add environment variables to Vercel (see above)
- ✅ Redeploy after adding variables
- ✅ Check that variables start with `VITE_`

### "OAuth popup was blocked"
- ✅ Disable popup blocker for your site
- ✅ Try again - don't close popup manually

### "Events not appearing in Google Calendar"
- ✅ Check that you're authenticated (green status)
- ✅ Verify Calendar ID is correct
- ✅ Make sure calendar is public
- ✅ Wait a few seconds for sync to complete

---

## 📞 Need More Help?

**Documentation Files:**
- **Featured Content:** `FEATURED_CONTENT_ENHANCEMENT.md`
- **Google Calendar:** `GOOGLE_CALENDAR_INTEGRATION.md`
- **Google Setup:** `docs/GOOGLE_CALENDAR_SETUP.md`

**Key Files to Check:**
- Carousel component: `src/components/FeaturedHeroCarousel.tsx`
- Calendar service: `src/services/googleCalendarService.ts`
- Main app integration: `src/App.tsx`

---

**🎉 You're all set! Enjoy your new features!**
