# 🔄 GitHub Synchronization Guide

## Current Status
- ✅ Local branch `events-calendar` created
- ❌ Code not yet on GitHub
- ❌ Site not yet deployed

## Step 1: Configure Git (First Time Only)

```bash
# Set your identity (replace with your info)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## Step 2: Add All Files to Git

```bash
# Check what files are ready to commit
git status

# Add all files to staging
git add .

# Commit with a descriptive message
git commit -m "Add Black QTIPOC+ Events Calendar - Complete platform with Google Sheets integration"
```

## Step 3: Connect to Your GitHub Repository

```bash
# Add your GitHub repository as the remote origin
git remote add origin https://github.com/BLKOUTUK/blkout-website.git

# Verify the remote was added
git remote -v
```

## Step 4: Push to GitHub

```bash
# Push your events-calendar branch to GitHub
git push -u origin events-calendar
```

## Step 5: Verify on GitHub

1. Go to https://github.com/BLKOUTUK/blkout-website
2. You should see a notification about the new `events-calendar` branch
3. Click "Compare & pull request" if you want to merge to main
4. Or keep it as a separate branch for now

## Step 6: Deploy to Netlify (Make It Live)

### Option A: Deploy from Branch
1. Go to [netlify.com](https://netlify.com)
2. "Add new site" → "Import existing project"
3. Connect GitHub → Select `BLKOUTUK/blkout-website`
4. **Important**: Choose branch `events-calendar` (not main)
5. Build settings:
   ```
   Build command: npm run build
   Publish directory: dist
   ```

### Option B: Merge to Main First
```bash
# Switch to main branch
git checkout main

# Merge events-calendar into main
git merge events-calendar

# Push main branch
git push origin main
```

Then deploy from main branch in Netlify.

## 🎯 What Happens Next

After pushing to GitHub:
1. ✅ Your code will be visible at https://github.com/BLKOUTUK/blkout-website/tree/events-calendar
2. ✅ You can deploy to Netlify from this branch
3. ✅ Your site will be live at a Netlify URL
4. ✅ Community can start using the events calendar

## 🔧 Troubleshooting

### "Permission denied" error
```bash
# Use personal access token instead of password
# Go to GitHub → Settings → Developer settings → Personal access tokens
# Create token with repo permissions
# Use token as password when prompted
```

### "Remote already exists" error
```bash
# Remove existing remote and re-add
git remote remove origin
git remote add origin https://github.com/BLKOUTUK/blkout-website.git
```

### Files not showing up
```bash
# Make sure all files are committed
git status
git add .
git commit -m "Add missing files"
git push origin events-calendar
```

## ✅ Success Checklist

- [ ] Git configured with your name/email
- [ ] All files added and committed
- [ ] Remote origin set to your GitHub repo
- [ ] Branch pushed to GitHub successfully
- [ ] Can see files on GitHub website
- [ ] Ready to deploy to Netlify

## 🚀 Next Steps

1. **Push code** using commands above
2. **Deploy to Netlify** from your GitHub branch
3. **Add environment variables** for Google Sheets
4. **Test live site** functionality
5. **Share with community**!

Your Black QTIPOC+ Events Calendar will be live and serving the community! 🌟