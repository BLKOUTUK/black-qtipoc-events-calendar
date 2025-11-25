# BLKOUT Late.dev Setup

## Quick Start

1. **Images are ready:** `social-media-images/` folder contains all images referenced in CSV
2. **CSV is ready:** `blkout-late-dev-posts.csv` has 12 scheduled posts with image URLs
3. **Upload to Late.dev:** https://app.getlate.dev → Bulk Upload

## What's in the CSV

- 12 posts scheduled for February 2025
- Mix of promotional, community, Voices, and event content
- All posts include images (logo, values graphics, community photos)
- Platforms: Instagram, Facebook, LinkedIn, YouTube, Threads

## Next Steps

### 1. Customize Dates & Content
- Open CSV, change dates to your schedule
- Replace placeholders: `[ARTICLE TITLE]`, `[EVENT 1]`, etc.

### 2. Upload Images to Vercel
```bash
# Copy images to website public folder
cp social-media-images/* ../../../website/blkout-website/public/images/

# Commit and push to trigger Vercel deployment
git add . && git commit -m "Add social media images" && git push
```

Images will be live at: `https://blkoutuk.com/images/[filename]`

### 3. Upload CSV to Late.dev
1. Login to https://app.getlate.dev
2. Go to Bulk Upload
3. Upload `blkout-late-dev-posts.csv`
4. Review and schedule

## Image Files Included

- `LOGOBLKOUT0725.png` - Main logo
- `blkout_logo_roundel_colour.png` - Circular logo
- `blkoutvalues.png` - Values graphic
- `LIBERATION.png` - Liberation text
- `photo collage.png` - Community photos

All referenced in CSV with URLs: `https://blkoutuk.com/images/[filename]`

## Done!
