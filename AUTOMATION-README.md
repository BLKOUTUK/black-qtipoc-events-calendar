# Movember Automation Script

## 🚀 What This Does

Automatically schedules all 24 Movember posts to late.dev with video uploads.

**Instead of:**
- Manually creating 24 posts ❌
- Uploading 24 videos one by one ❌
- Copying 24 captions ❌
- Setting 24 schedules ❌

**You run:**
```bash
python3 automate-movember-upload.py
```

**Takes:** 2-3 minutes
**Result:** All 24 posts scheduled with videos ✅

---

## 📋 How to Run

### Step 1: Navigate to folder
```bash
cd ~/ACTIVE_PROJECTS/BLKOUTNXT_Ecosystem/BLKOUTNXT_Projects/events-calendar/black-qtipoc-events-calendar
```

### Step 2: Run the script
```bash
python3 automate-movember-upload.py
```

### Step 3: Watch it work
You'll see progress for each post:
```
🚀 Starting Movember automation...
📁 CSV: blkout-movember-2025-CURRENT.csv
🎬 Videos: MOVEMBER-VIDEOS-FOR-UPLOAD

📊 Found 24 posts to schedule

📤 Post 1/24: 2025-11-07 15:00:00 - ✅ Success
📤 Post 2/24: 2025-11-08 10:00:00 - ✅ Success
...
```

---

## ⚠️ If It Fails

**Problem: API endpoint doesn't accept file uploads**

If the script fails because late.dev's `/v1/posts` endpoint doesn't accept file uploads, you have 2 options:

### Option A: Upload videos to YouTube Unlisted (30 min)
Then update the CSV with YouTube URLs and use bulk upload.

### Option B: Contact late.dev support
Ask: "Does POST /v1/posts accept multipart/form-data file uploads?"

---

## 🎯 What the Script Does

1. **Reads CSV**: Gets all post data (captions, dates, platforms)
2. **Maps videos**: Matches each post to its video file
3. **Uploads via API**: Calls late.dev's POST /v1/posts for each row
4. **Reports results**: Shows success/failure for each post

---

## 📂 Files Used

- **CSV**: `blkout-movember-2025-CURRENT.csv` (24 posts)
- **Videos**: `MOVEMBER-VIDEOS-FOR-UPLOAD/` (26 video files)
- **Script**: `automate-movember-upload.py`
- **API Key**: Already configured in script

---

**Run it now and get your campaign automated!** 🚀
