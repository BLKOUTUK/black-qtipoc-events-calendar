# 🚨 Fix 404 Error - Quick Deployment Guide

## Why You're Getting 404

Your code is on GitHub but **not deployed** yet. GitHub repositories don't automatically create live websites - you need to deploy to a hosting service.

## 🚀 Quick Fix: Deploy to Netlify (5 minutes)

### Step 1: Connect to Netlify
1. Go to [netlify.com](https://netlify.com)
2. Sign up with your GitHub account
3. Click "Add new site" → "Import an existing project"
4. Choose GitHub → Select your repository: `BLKOUTUK/blkout-website`
5. Choose branch: `events-calendar`

### Step 2: Configure Build Settings
```
Build command: npm run build
Publish directory: dist
Base directory: (leave empty)
```

### Step 3: Deploy
- Click "Deploy site"
- Wait 2-3 minutes for build to complete
- Get your live URL: `https://amazing-name-123456.netlify.app`

## 🎯 Your Site Will Be Live!

After deployment, you'll have:
- ✅ **Live website** at your Netlify URL
- ✅ **Working event calendar** 
- ✅ **Event submission form**
- ✅ **Admin dashboard** (login: admin@example.com / admin123)

## 📊 Optional: Set Up Google Sheets Database

For full functionality, add these environment variables in Netlify:

1. **Site Settings** → **Environment Variables**
2. Add these (get from Google Sheets setup):
```
VITE_GOOGLE_SHEET_ID=your_sheet_id_here
VITE_GOOGLE_API_KEY=your_api_key_here
```

## 🔧 If Build Fails

Common fixes:
- **Node version**: Set to 18 in Netlify settings
- **Dependencies**: Make sure package.json is committed
- **Environment**: Check all required env vars are set

## ✅ Success!

Once deployed:
- Your 404 error will be gone
- Site will be live and working
- Community can start using it immediately

**Deploy now and your platform will be live in minutes!** 🌟