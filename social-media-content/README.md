# Social Media Content Library

Organized thematic image series for periodic posting to BLKOUT social channels.

## Folder Structure

### `/brand/` - BLKOUT Brand Assets
- Logos, brand values graphics, taglines
- Use for: Platform introductions, announcements, general posts
- URL pattern: `https://blkoutuk.com/images/brand/[filename]`

### `/community/` - Community Photos & Stories
- Photo collages, community events, gatherings
- Use for: Community highlights, member features, celebrations
- URL pattern: `https://blkoutuk.com/images/community/[filename]`

### `/events/` - Events Graphics
- Event promotion templates, calendar highlights
- Use for: Weekly event roundups, featured events
- URL pattern: `https://blkoutuk.com/images/events/[filename]`

### `/voices/` - Voices Blog Graphics
- Article headers, quote graphics, writer features
- Use for: Article promotions, writer spotlights
- URL pattern: `https://blkoutuk.com/images/voices/[filename]`

### `/liberation/` - Liberation & Politics
- Liberation themes, political commentary graphics
- Use for: Advocacy posts, political content, activism
- URL pattern: `https://blkoutuk.com/images/liberation/[filename]`

### `/pride/` - Pride & Celebrations
- Pride month content, Black queer history
- Use for: Pride celebrations, history month, cultural moments
- URL pattern: `https://blkoutuk.com/images/pride/[filename]`

### `/wellness/` - Health & Wellness
- Mental health, self-care, wellness themes
- Use for: Wellness Wednesday, self-care posts
- URL pattern: `https://blkoutuk.com/images/wellness/[filename]`

### `/culture/` - Arts & Culture
- Arts, music, performance, creative expression
- Use for: Cultural highlights, artist features
- URL pattern: `https://blkoutuk.com/images/culture/[filename]`

## How to Use

### 1. Add Images to Themes
Drop your images into the appropriate thematic folder.

### 2. Deploy to Vercel
```bash
# Copy all themed content to website
cp -r social-media-content/* ../../../website/blkout-website/public/images/

# Commit and push
cd ../../../website/blkout-website
git add public/images/
git commit -m "Add social media content library"
git push
```

### 3. Reference in CSVs
Use the URL pattern in your Late.dev CSVs:
```csv
"instagram,facebook","BLKOUTUK","2025-03-01 10:00:00","Europe/London","Post content here","https://blkoutuk.com/images/wellness/self-care-sunday.png",""
```

## Thematic Series Ideas

### Weekly Series
- **Monday Motivation** → `/liberation/` or `/wellness/`
- **Wellness Wednesday** → `/wellness/`
- **Throwback Thursday** → `/community/` or `/pride/`
- **Featured Friday** → `/events/` or `/voices/`
- **Self-Care Sunday** → `/wellness/`

### Monthly Series
- **Event Roundup** → `/events/`
- **Community Spotlight** → `/community/`
- **Voices Feature** → `/voices/`
- **Member Story** → `/community/`

### Seasonal Series
- **Black History Month** → `/pride/`
- **Pride Month** → `/pride/`
- **Mental Health Awareness** → `/wellness/`

## File Naming Convention

Use descriptive, URL-friendly names:
- `brand-values-001.png`
- `community-gathering-jan2025.png`
- `wellness-quote-self-love.png`
- `event-promo-black-history-month.png`

Keep filenames lowercase with hyphens, no spaces.
