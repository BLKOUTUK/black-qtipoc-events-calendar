# 🔑 Finding Your Google Calendar Credentials - Step-by-Step

## Overview

You need 3 credentials to enable Google Calendar integration:
1. **Calendar ID** - From Google Calendar
2. **Client ID** - From Google Cloud Console
3. **Client Secret** - From Google Cloud Console

Let's find each one!

---

## 🗓️ Part 1: Getting Your Calendar ID

### Step 1: Go to Google Calendar
1. Open https://calendar.google.com/
2. Sign in with your Google account

### Step 2: Create a New Calendar (or Use Existing)

**To Create New Calendar:**
1. On the left sidebar, find **"Other calendars"**
2. Click the **"+"** (plus) button next to it
3. Select **"Create new calendar"**
4. Fill in:
   - **Name:** `BLKOUT Community Events` (or whatever you prefer)
   - **Description:** `Official calendar of Black QTIPOC+ events`
   - **Time zone:** `(GMT+00:00) United Kingdom Time - London`
5. Click **"Create calendar"**

### Step 3: Find the Calendar ID

1. On the left sidebar, find your new calendar under "My calendars"
2. Hover over the calendar name
3. Click the **three dots (⋮)** that appear
4. Select **"Settings and sharing"**
5. Scroll down to **"Integrate calendar"** section
6. You'll see **"Calendar ID"** - it looks like:
   ```
   abc123def456@group.calendar.google.com
   ```
7. **Copy this entire ID** - this is your `VITE_GOOGLE_CALENDAR_ID`

### Step 4: Make Calendar Public (Important!)

**Still in the same settings page:**
1. Scroll up to **"Access permissions for events"**
2. Check the box: ☑️ **"Make available to public"**
3. In the dropdown, select: **"See all event details"**
4. Click **"Save"** or it auto-saves

**✅ You now have:** `VITE_GOOGLE_CALENDAR_ID`

---

## ☁️ Part 2: Getting Client ID & Client Secret

### Step 1: Go to Google Cloud Console
1. Open https://console.cloud.google.com/
2. Sign in with the same Google account

### Step 2: Create a New Project

1. At the top, click **"Select a project"** dropdown
2. Click **"New Project"** button (top right)
3. Fill in:
   - **Project name:** `BLKOUT Events Calendar`
   - **Location:** Leave as default or select your organization
4. Click **"Create"**
5. Wait 10-20 seconds for project to be created
6. You'll see a notification when it's ready - click **"Select Project"**

### Step 3: Enable Google Calendar API

1. In the left menu, go to **"APIs & Services"** → **"Library"**
   - OR use the search bar at top: type "Calendar API"
2. Search for: `Google Calendar API`
3. Click on **"Google Calendar API"** in the results
4. Click the **"Enable"** button
5. Wait for it to enable (5-10 seconds)

### Step 4: Configure OAuth Consent Screen

1. In the left menu, go to **"APIs & Services"** → **"OAuth consent screen"**
2. Select **"External"** (unless you have Google Workspace, then use Internal)
3. Click **"Create"**
4. Fill in the form:

**App information:**
   - **App name:** `BLKOUT Events Calendar`
   - **User support email:** Your email address (select from dropdown)
   - **App logo:** (Optional - skip for now)

**App domain:** (Optional - can skip)

**Developer contact information:**
   - **Email addresses:** Your email address

5. Click **"Save and Continue"**

**Scopes page:**
1. Click **"Add or Remove Scopes"**
2. In the filter box, type: `calendar`
3. Check the box next to:
   - ☑️ `https://www.googleapis.com/auth/calendar` (See, edit, share, and permanently delete all calendars)
4. Click **"Update"** at bottom
5. Click **"Save and Continue"**

**Test users page:**
1. Click **"Add Users"**
2. Add your email and any admin emails (one per line)
3. Click **"Add"**
4. Click **"Save and Continue"**

**Summary page:**
1. Review your settings
2. Click **"Back to Dashboard"**

### Step 5: Create OAuth 2.0 Credentials

1. In the left menu, go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** button at top
3. Select **"OAuth client ID"**
4. Fill in the form:

**Application type:**
   - Select: **"Web application"**

**Name:**
   - Enter: `BLKOUT Events Web Client`

**Authorized JavaScript origins:**
   - Click **"Add URI"**
   - Add your production URL (e.g., `https://black-qtipoc-events-calendar-brksed7qv-robs-projects-54d653d3.vercel.app`)
   - Click **"Add URI"** again
   - Add: `http://localhost:5173` (for local development)

**Authorized redirect URIs:**
   - Click **"Add URI"**
   - Add your production URL (same as above)
   - Click **"Add URI"** again
   - Add: `http://localhost:5173` (for local development)

5. Click **"Create"**

### Step 6: Copy Your Credentials

**A popup will appear with your credentials!**

```
Your Client ID
xxxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com

Your Client Secret
GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**IMPORTANT:**
1. **Copy the Client ID** → This is your `VITE_GOOGLE_CLIENT_ID`
2. **Copy the Client Secret** → This is your `VITE_GOOGLE_CLIENT_SECRET`
3. **Save them somewhere safe** (password manager, secure note)
4. Click **"OK"** to close the popup

**Can't find the popup again?**
- Go back to **"Credentials"** page
- Under **"OAuth 2.0 Client IDs"**, you'll see your client
- Click the **pencil icon (✏️)** to edit
- You'll see your **Client ID** at the top
- Your **Client Secret** is also visible (can be reset if lost)

**✅ You now have all 3 credentials!**

---

## 📋 Summary - Your 3 Credentials

You should now have:

```bash
# 1. From Google Calendar Settings → Integrate calendar
VITE_GOOGLE_CALENDAR_ID=abc123def456@group.calendar.google.com

# 2. From Google Cloud Console → Credentials → OAuth 2.0 Client ID
VITE_GOOGLE_CLIENT_ID=123456789-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com

# 3. From Google Cloud Console → Credentials → OAuth 2.0 Client Secret
VITE_GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 🚀 Next Step: Add to Vercel

### Option 1: Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Select your project: **black-qtipoc-events-calendar**
3. Go to **Settings** tab
4. Click **"Environment Variables"** in left menu
5. For each variable:
   - Click **"Add New"**
   - **Key:** `VITE_GOOGLE_CALENDAR_ID`
   - **Value:** Paste your calendar ID
   - **Environment:** Select all (Production, Preview, Development)
   - Click **"Save"**
6. Repeat for the other 2 variables
7. After all 3 are added, go to **"Deployments"** tab
8. Click the **"..."** menu on the latest deployment
9. Click **"Redeploy"**

### Option 2: Via Vercel CLI

1. Open your terminal in the project directory
2. Run:
   ```bash
   vercel env add VITE_GOOGLE_CALENDAR_ID production
   ```
3. Paste your calendar ID when prompted
4. Repeat for the other 2 variables:
   ```bash
   vercel env add VITE_GOOGLE_CLIENT_ID production
   vercel env add VITE_GOOGLE_CLIENT_SECRET production
   ```
5. Redeploy:
   ```bash
   vercel --prod
   ```

---

## ✅ Verification

After redeploying:

1. Go to your production site
2. Sign in as admin
3. Click an event card's **"Add to Calendar"** dropdown
   - **Google Calendar** and **Download .ics** should work immediately
4. Click **"Calendar Sync"** button in admin controls
   - Click **"Connect"** - OAuth popup should open
   - Grant permissions
   - Try syncing an event
   - Check your public Google Calendar - event should appear!

---

## 🐛 Common Issues

### "Calendar ID not found"
- ✅ Make sure calendar is set to public
- ✅ Double-check you copied the full ID (includes `@group.calendar.google.com`)
- ✅ Wait a few minutes after creating calendar

### "Client ID not configured"
- ✅ Make sure environment variables start with `VITE_`
- ✅ Redeploy after adding variables to Vercel
- ✅ Check variables are set for "Production" environment

### "OAuth popup blocked"
- ✅ Disable popup blocker for your site
- ✅ Make sure authorized URIs in Google Console match your production URL exactly

### "Access denied" error
- ✅ Make sure you added test users in OAuth consent screen
- ✅ Sign in with a test user account
- ✅ If app is not verified, click "Advanced" → "Go to [app name] (unsafe)" in OAuth screen

### "Client Secret invalid"
- ✅ Copy the entire secret including `GOCSPX-` prefix
- ✅ No spaces before/after when pasting
- ✅ If lost, you can generate a new one in Google Console

---

## 🔐 Security Notes

**Safe to commit (public):**
- ✅ `VITE_GOOGLE_CLIENT_ID` - This is public by design

**NEVER commit (private):**
- ⚠️ `VITE_GOOGLE_CLIENT_SECRET` - Keep this secret!
- ⚠️ Keep Client Secret in `.env` file (already gitignored)

**Best Practices:**
- Store credentials in password manager
- Use environment variables in production
- Restrict OAuth credentials to your domains only
- Regularly review authorized apps in Google Account settings

---

## 📞 Need Help?

**Google Cloud Console Issues:**
- https://console.cloud.google.com/
- Help Center: https://cloud.google.com/support

**Google Calendar Issues:**
- https://support.google.com/calendar

**Vercel Environment Variables:**
- https://vercel.com/docs/concepts/projects/environment-variables

**Still stuck?** Check the detailed setup guide: `docs/GOOGLE_CALENDAR_SETUP.md`

---

**🎉 Once you have all 3 credentials, you're ready to go!**
