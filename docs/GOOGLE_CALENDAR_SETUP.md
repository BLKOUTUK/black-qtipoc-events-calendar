# Google Calendar Integration Setup Guide

This guide explains how to set up Google Calendar integration for the BLKOUT Events Calendar, including both public calendar embedding and admin calendar synchronization.

## Overview

The Google Calendar integration provides three key features:

1. **iCal Export** - Users can download .ics files to add events to any calendar app
2. **Google Calendar Quick Add** - One-click button to add events to personal Google Calendar
3. **Public Calendar Embed** - Display all BLKOUT events in an embeddable Google Calendar widget
4. **Admin Sync** - Authenticated admins can sync approved events to the public BLKOUT Google Calendar

## Features

### For Users (No Setup Required)
- ✅ Click "Add to Calendar" dropdown on any event
- ✅ Choose "Google Calendar" to open Google Calendar with pre-filled event details
- ✅ Choose "Download .ics" to save event file for Apple Calendar, Outlook, etc.
- ✅ Works on all devices (iOS, Android, Desktop)

### For Admins (Requires Setup)
- 🔐 Authenticate with Google OAuth2
- 📤 Sync individual events or bulk sync all published events
- 📅 Events appear on public BLKOUT Google Calendar
- 🔄 Real-time sync status and error handling

## Prerequisites

1. A Google Account
2. Access to [Google Cloud Console](https://console.cloud.google.com/)
3. A public Google Calendar (or create a new one for BLKOUT events)

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name it "BLKOUT Events Calendar"
4. Click "Create"

## Step 2: Enable Google Calendar API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google Calendar API"
3. Click on it and click "Enable"

## Step 3: Create OAuth 2.0 Credentials

### For Web Application (Required for Admin Sync)

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Click "Configure Consent Screen"
   - Select "External" (unless you have a Google Workspace)
   - Fill in:
     - App name: `BLKOUT Events Calendar`
     - User support email: Your email
     - Developer contact: Your email
   - Click "Save and Continue"
   - Add scopes:
     - `https://www.googleapis.com/auth/calendar` (Manage calendars)
   - Click "Save and Continue"
   - Add test users (your admin emails)
   - Click "Save and Continue"

4. Back in "Credentials", click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "BLKOUT Events Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:5173` (for development)
     - `https://events.blkout.org` (production)
     - `https://yourdomain.netlify.app` (if using Netlify)
   - Authorized redirect URIs:
     - `http://localhost:5173` (for development)
     - `https://events.blkout.org` (production)
   - Click "Create"

5. **Save your credentials:**
   - Client ID: `xxxxx.apps.googleusercontent.com`
   - Client Secret: `xxxxx` (keep this secret!)

### For API Key (Optional - for read-only public calendar)

1. Click "Create Credentials" → "API key"
2. Copy the API key
3. Click "Restrict Key"
   - Name: "BLKOUT Events API Key"
   - API restrictions: Select "Google Calendar API"
   - Click "Save"

## Step 4: Create/Configure Public Calendar

### Option A: Create New Calendar

1. Go to [Google Calendar](https://calendar.google.com/)
2. On the left, click "+" next to "Other calendars"
3. Click "Create new calendar"
4. Fill in:
   - Name: `BLKOUT Community Events`
   - Description: `Official calendar of Black QTIPOC+ community events in the UK`
   - Time zone: `Europe/London`
5. Click "Create calendar"

### Option B: Use Existing Calendar

1. Go to your calendar settings
2. Find the calendar you want to use
3. Note its Calendar ID (under "Integrate calendar")

### Make Calendar Public

1. Go to calendar settings
2. Under "Access permissions for events"
3. Check "Make available to public"
4. Choose "See all event details"
5. Click "Save"

### Get Calendar ID

1. In calendar settings
2. Scroll to "Integrate calendar"
3. Copy the "Calendar ID" - looks like: `abc123@group.calendar.google.com`

## Step 5: Configure Environment Variables

Create or update `.env` file in your project root:

```bash
# Google Calendar Configuration
VITE_GOOGLE_CALENDAR_ID=your-calendar-id@group.calendar.google.com
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=your-client-secret
VITE_GOOGLE_API_KEY=your-api-key

# Existing configuration (keep these)
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-key
```

### Netlify/Vercel Deployment

Add these as environment variables in your deployment platform:

**Netlify:**
1. Go to Site settings → Environment variables
2. Add each variable with its value
3. Redeploy your site

**Vercel:**
1. Go to Project settings → Environment Variables
2. Add each variable for Production/Preview/Development
3. Redeploy

## Step 6: Test the Integration

### Test User Features (No Auth Required)

1. Start your dev server: `npm run dev`
2. Navigate to an event
3. Click "Add to Calendar"
4. Test both options:
   - **Google Calendar** - Should open Google Calendar in new tab
   - **Download .ics** - Should download a file

### Test Admin Sync (Requires Auth)

1. Sign in as admin
2. Click "Calendar Sync" button in admin controls
3. Click "Connect" to authenticate with Google
4. Grant calendar permissions in popup
5. Try syncing a single event
6. Try "Sync All" for bulk sync
7. Check your public Google Calendar - events should appear!

## Troubleshooting

### "OAuth2 popup was closed"
- Make sure popup blockers are disabled
- Try again and don't close the popup manually

### "Client ID not configured"
- Check that `VITE_GOOGLE_CLIENT_ID` is set in `.env`
- Restart dev server after adding env variables
- For production, redeploy after adding env vars

### "Calendar API error: 401"
- Your OAuth token expired - click "Connect" again
- Check that calendar ID is correct
- Ensure calendar API is enabled in Google Cloud Console

### "Calendar API error: 403"
- Calendar must be public or you need write permissions
- Check calendar sharing settings
- Ensure you're authenticated as a user with calendar access

### Events not appearing on public calendar
- Check calendar ID is correct
- Verify calendar is set to public
- Wait a few seconds for sync to complete
- Check browser console for errors

## Architecture

### Files Created

- `src/services/googleCalendarService.ts` - Core calendar integration logic
- `src/components/GoogleCalendarEmbed.tsx` - Public calendar widget
- `src/components/CalendarSyncDashboard.tsx` - Admin sync interface

### How It Works

1. **iCal Export**: Generates RFC 5545 compliant .ics files client-side
2. **Quick Add**: Opens Google Calendar with pre-filled event details via URL parameters
3. **Admin Sync**: Uses OAuth2 + Calendar API to write events to public calendar
4. **Public Embed**: iFrame embed of public calendar with custom styling

## Security Notes

- ✅ Client ID is public (safe to commit)
- ⚠️ Client Secret should be in `.env` (never commit!)
- ⚠️ API Key should be restricted to Calendar API only
- ✅ OAuth tokens are stored in localStorage and expire automatically
- ✅ Only authenticated admins can sync to public calendar

## Best Practices

1. **Separate Calendars**: Use different calendars for testing vs production
2. **Test Users**: Add your team as test users during OAuth app review
3. **Rate Limiting**: Be mindful of API quotas (10,000 requests/day)
4. **Batch Sync**: Use bulk sync for initial setup, then sync new events individually
5. **Error Handling**: Check sync status and logs for any failures

## Support

- Google Calendar API: https://developers.google.com/calendar/api/guides/overview
- OAuth 2.0: https://developers.google.com/identity/protocols/oauth2
- Troubleshooting: https://support.google.com/googleapi/

---

**🎉 You're all set!** Users can now add events to their personal calendars, and admins can sync events to the public BLKOUT calendar.
