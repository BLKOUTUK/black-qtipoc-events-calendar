# Twitter Auto-Posting Setup for Events

## ✅ What's Been Done

1. ✅ Created `lib/twitterService.ts` - Twitter posting service with community intro
2. ✅ Created `api/approve-event.ts` - Admin endpoint to approve events and auto-post to Twitter
3. ✅ Added axios dependency for HTTP requests
4. ✅ Updated `.env.example` with Twitter configuration

## 🚀 Deploy to Vercel

### Step 1: Twitter API Credentials

You already have your Twitter OAuth 1.0a API credentials:
- API Key (Consumer Key)
- API Secret (Consumer Secret)
- Access Token
- Access Token Secret

These are the same credentials used for the Voices blog.

### Step 2: Add Environment Variables to Vercel

1. Go to Vercel dashboard: [https://vercel.app](https://vercel.app)
2. Find your **black-qtipoc-events-calendar** project
3. Go to **Settings** → **Environment Variables**
4. Add these new variables:

```
TWITTER_ENABLED=true
TWITTER_API_KEY=qoocS1QvdbdvBqTJrPFaPxeJ7
TWITTER_API_SECRET=ImHMEHdfn6iD8ahHlCIgRjwMxZsYJLxccEk7qQfbuVwbPPJ2jY
TWITTER_ACCESS_TOKEN=2659633734-8m8pJyWoZp2NzpIdkYYcBDTwZ81YAa0VvVWWogg
TWITTER_ACCESS_TOKEN_SECRET=SgneK5zOP2FXoLZY7DoQsdpRDX25KV2DVK0XiBGup3ghb
COMMUNITY_URL=https://blkoutuk.com
ADMIN_PASSWORD=blkout2024
```

**Important:** Keep your existing variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, etc.)

### Step 3: Deploy

Vercel will automatically redeploy when you push to GitHub. The new API endpoint will be available at:
```
https://your-events-calendar.vercel.app/api/approve-event
```

## 🎯 How It Works

### Event Approval Flow

1. Event is submitted via Chrome extension or form with `status: 'pending'`
2. Admin approves event using the `/api/approve-event` endpoint
3. Event status changes to `approved`
4. **Automatically** posts to Twitter with:
   - Community platform introduction
   - Event title
   - Date and time
   - Location
   - Link to events calendar
   - Smart hashtags

### Example Tweet:

```
Join the BLKOUT community for our next event!

Black Queer History Month Celebration
📅 Thu, 1 Feb 2025 at 7:00 PM
📍 Rich Mix, London

https://blkoutuk.com/events

#BLKOUT #BlackQueer #Community
```

## 📝 Admin Usage

To approve an event and post to Twitter:

```bash
curl -X POST https://your-events-calendar.vercel.app/api/approve-event \
  -H "Content-Type: application/json" \
  -H "X-Admin-Password: blkout2024" \
  -d '{"eventId": "123"}'
```

**Response:**
```json
{
  "success": true,
  "message": "Event approved successfully and posted to Twitter",
  "data": {
    "id": "123",
    "title": "Event Title",
    "status": "approved",
    "approvedAt": "2025-02-01T12:00:00Z"
  }
}
```

## 📱 Hashtag Strategy

**Always Included:**
- #BLKOUT
- #BlackQueer

**Tag-Specific:**
- community → #Community
- arts → #BlackArt
- culture → #BlackCulture
- social → #CommunityEvent
- meetup → #Meetup
- workshop → #Workshop
- party → #PartyWithUs
- pride → #BlackPride
- health → #Wellness
- mental-health → #MentalHealth

## 🛡️ Security

- Never commit `.env` file
- Twitter OAuth credentials are sensitive - keep them secure
- Admin password required for event approval
- Same credentials as Voices blog (no need for separate tokens)

## 📊 Monitoring

Check Vercel function logs for:
- Successful posts: `✅ Posted event to Twitter`
- Failures: `❌ Twitter posting failed`
- Configuration issues: `Twitter API credentials not configured`
- Authentication method: `Using OAuth 1.0a authentication`

## 🔧 Configuration

**Enable/Disable Twitter Posting:**
```
TWITTER_ENABLED=true   # Posts to Twitter when events approved
TWITTER_ENABLED=false  # Disables Twitter posting
```

**Non-Blocking:**
- If Twitter posting fails, the event still gets approved successfully
- Errors are logged but don't stop event approval

## 🎉 Next Steps

1. Add Twitter environment variables to Vercel
2. Push this code to GitHub (triggers automatic deployment)
3. Test event approval with a sample event
4. Check Twitter to see the post!

---

**Built for Black Queer Liberation** 🏳️‍🌈
