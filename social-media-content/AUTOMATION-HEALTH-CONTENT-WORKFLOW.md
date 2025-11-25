# Automated Health Content Generation System
## Stop Manual Content Creation - Let AI + n8n Do the Work

**Problem**: Creating evidence-based health content is boring and time-consuming
**Solution**: Automated pipeline that scrapes campaigns → verifies sources → generates posts → creates images → schedules

---

## 🤖 AUTOMATION ARCHITECTURE

```
┌─────────────────────┐
│ Campaign Websites   │ (Movember, Prostate Cancer UK, THT, etc.)
└──────────┬──────────┘
           │ n8n scrapes verified stats
           ▼
┌─────────────────────┐
│ Source Database     │ (Airtable/Supabase: campaign quotes + sources)
└──────────┬──────────┘
           │ AI formats with "Move this Movember" framing
           ▼
┌─────────────────────┐
│ Claude/GPT-4        │ (Generates posts with verified citations)
└──────────┬──────────┘
           │ DALL-E/Midjourney generates graphics
           ▼
┌─────────────────────┐
│ Image Generation    │ (BLKOUT brand colors + quote overlays)
└──────────┬──────────┘
           │ Late.dev schedules posts
           ▼
┌─────────────────────┐
│ Social Media        │ (Instagram, Twitter, LinkedIn, Facebook)
└─────────────────────┘
```

---

## 🔧 IMPLEMENTATION OPTIONS

### **Option 1: Full n8n Automation Workflow (RECOMMENDED)**
**Best for**: Completely hands-off content generation

**n8n Workflow Steps:**
1. **Campaign Scraper** (Weekly)
   - Scrape Movember UK statistics page
   - Scrape Prostate Cancer UK Black men's page
   - Scrape THT PrEP statistics
   - Scrape 56 Dean Street service data
   - Store in Supabase with source URLs + dates

2. **Content Generator** (On-demand/Scheduled)
   - Read campaign stats from database
   - Send to Claude API with prompt: "Create 'Move this Movember' post using this statistic: [stat]. Include source citation. Target: Black queer men."
   - Validate output has proper citation
   - Store generated post in content library

3. **Image Generator** (Automated)
   - Send post text to DALL-E/Midjourney
   - Prompt: "Create social media graphic with BLKOUT brand (Liberation Teal #008B8B, Community Gold #FFD700, Black background). Include quote: [text]. Medical imagery, Black queer men, professional NHS style."
   - Add text overlay with quote + source
   - Save to asset library

4. **Scheduler & Poster** (Daily 9am)
   - Pull next post from queue
   - Post to Instagram, Twitter, LinkedIn via APIs
   - Log posted content
   - Send confirmation notification

**Time Saved**: 30 hours/month → 2 hours/month (setup + monitoring)

---

### **Option 2: IVOR-Powered Content Assistant**
**Best for**: On-demand content creation with IVOR backend

**Flow:**
1. User asks IVOR: "Create a Movember post about prostate cancer for Black men"
2. IVOR:
   - Queries campaign database for verified Prostate Cancer UK statistics
   - Formats post with "Move this Movember" framing
   - Adds proper citations
   - Generates image via API
   - Returns ready-to-post content

**Implementation:**
```python
# IVOR Health Content Module
def generate_health_post(topic, target_audience):
    # Query verified stats database
    stats = query_campaign_database(topic)

    # Generate post with Claude
    post = claude_api.generate(
        prompt=f"Create 'Move this Movember' post about {topic} for {target_audience}. Use this verified statistic: {stats['quote']}. Source: {stats['source']}"
    )

    # Generate image
    image = dalle_api.generate(
        prompt=f"BLKOUT brand social media graphic. {topic}. Black queer men. Medical professional style. Teal and gold colors. Quote overlay: {post}"
    )

    return {
        "post": post,
        "image": image,
        "source": stats['source_url'],
        "organization": stats['campaign']
    }
```

**Time Saved**: Create posts in 30 seconds instead of 30 minutes

---

### **Option 3: Hybrid Semi-Automated System**
**Best for**: You review before posting, but AI does the heavy lifting

**Tools:**
- **Airtable**: Campaign stats database (manual entry once/quarter)
- **Make.com/Zapier**: Trigger content generation on schedule
- **Claude API**: Generate posts from database
- **Canva API/Bannerbear**: Auto-generate graphics
- **Late.dev**: Schedule & review before posting

**Workflow:**
1. Quarterly: Manually add 10-15 verified campaign stats to Airtable
2. Weekly: Trigger content generation (creates 7 posts automatically)
3. Daily: Review & approve posts in Late.dev dashboard
4. Automated: Posts go live at scheduled times

**Time Saved**: 20 hours/month → 4 hours/month

---

## 📦 READY-TO-USE N8N WORKFLOW

I can create a complete n8n workflow that:

### **Input (Airtable/Google Sheets):**
```csv
Topic,Campaign,Quote,Source URL,Target Date
Prostate Cancer,Prostate Cancer UK,"1 in 4 Black men will be diagnosed",https://prostatecanceruk.org,2025-11-02
HIV Prevention,NHS England,"PrEP reduced HIV risk by 86%",https://gov.uk/prep,2025-11-08
```

### **n8n Processing:**
1. Read row from spreadsheet
2. Generate post: "Move this Movember - [topic]. [Campaign] says: '[quote]'. [Call to action]. Source: [URL]"
3. Generate image with quote overlay
4. Schedule to Late.dev for target date
5. Mark row as "processed"

### **Output:**
- 30 posts generated in 5 minutes
- Images ready
- Scheduled across November
- All sources cited

---

## 🎨 AUTOMATED IMAGE GENERATION

### **Option A: DALL-E with Consistent Branding**
```python
# DALL-E prompt template
def generate_health_graphic(quote, topic):
    prompt = f"""
    Professional medical social media graphic for LGBTQ+ health campaign.

    Style: Modern, NHS-inspired, empowering
    Colors: Liberation Teal (#008B8B), Community Gold (#FFD700), Black background
    Subject: {topic} - Black queer men in healthcare setting
    Text overlay: "{quote}"
    Typography: Bold, clear, medical-style fonts
    Mood: Destigmatizing, professional, affirming
    Layout: Clean, accessible, high contrast
    """
    return dalle_api.generate(prompt)
```

### **Option B: Canva API with Templates**
1. Create 5-10 Canva templates with BLKOUT branding
2. Use Canva API to auto-populate with different quotes
3. Export as PNG for social media
4. Consistent branding, zero design work

### **Option C: Bannerbear (Fastest)**
- Set up templates with dynamic text zones
- API auto-generates images in seconds
- Perfect for high-volume content

**Time Saved**: 10 hours/month on design → 0 hours (fully automated)

---

## 🚀 QUICK START: 30-MINUTE SETUP

### **Minimum Viable Automation:**

1. **Create Google Sheet** (5 min)
   - Columns: Topic | Campaign | Quote | Source | Date | Status
   - Add your 30 verified stats

2. **Set up n8n Workflow** (15 min)
   - Trigger: Schedule (daily 8am)
   - Read next unprocessed row from Google Sheet
   - HTTP Request to Claude API with template prompt
   - HTTP Request to DALL-E with image prompt
   - Save outputs to folder
   - Mark row as "processed"

3. **Connect Late.dev** (10 min)
   - Upload generated content
   - Schedule posts
   - Enable auto-posting

**Done!** Your November content is automated.

---

## 💰 COST BREAKDOWN

### **Monthly Running Costs:**
- **Claude API**: ~£10 (30 posts × 500 tokens)
- **DALL-E**: ~£15 (30 images)
- **n8n Cloud**: £0 (free tier) or £20 (pro)
- **Late.dev**: £0-25 (depends on plan)
- **Total**: £25-50/month

**ROI**: You save 20-30 hours/month
**Value**: £500-1,500/month (at £25-50/hour)

---

## 🔐 MAINTAINING ACCURACY WITH AUTOMATION

### **Quality Control Checkpoints:**

1. **Source Verification Layer**
   - n8n checks source URLs are still active
   - Flags broken links for manual review
   - Validates stat hasn't changed on source page

2. **Citation Requirement**
   - Claude prompt MUST include source attribution
   - Workflow rejects outputs without citations
   - All posts include "Source: [Campaign Name] [Year]"

3. **Human Review Gate** (Optional)
   - Store generated posts in "Review" queue
   - Slack/Email notification: "5 posts ready for review"
   - Approve with one click → auto-posts
   - Reject → regenerates with feedback

4. **Quarterly Audit**
   - Review campaign websites for updated stats
   - Update source database
   - Regenerate any outdated content

---

## 🎯 RECOMMENDED APPROACH FOR BLKOUT

**Phase 1 (Week 1): Foundation**
- Set up Airtable with 50 verified campaign stats
- Create Claude API integration
- Build basic n8n content generator

**Phase 2 (Week 2): Automation**
- Add DALL-E image generation
- Connect to Late.dev scheduler
- Test end-to-end workflow

**Phase 3 (Week 3): IVOR Integration**
- Build IVOR module: `/health-post [topic]`
- Users can request health content on-demand
- IVOR generates using campaign database

**Phase 4 (Week 4): Scale**
- Expand to other health months (Breast Cancer Awareness, World AIDS Day, etc.)
- Add multi-language support
- Create API for other organizations to use

---

## 📋 NEXT STEPS

**Choose your automation level:**
- [ ] **Full Automation**: I'll build the complete n8n workflow (1-2 hours)
- [ ] **IVOR Integration**: Add health content generation to IVOR (2-3 hours)
- [ ] **Hybrid**: Set up the database + templates, you review & approve (30 min)

**What you need to provide:**
- [ ] n8n instance access or credentials
- [ ] Claude API key
- [ ] DALL-E/image generation API key
- [ ] Late.dev or social media API credentials
- [ ] Google Sheet/Airtable for campaign stats database

**I can build this in one session if you want to proceed.**

---

## 🎁 BONUS: REUSABLE TEMPLATE

Once built, this system works for:
- ✅ Black History Month posts
- ✅ Pride Month content
- ✅ World AIDS Day messaging
- ✅ Mental Health Awareness Week
- ✅ Any health campaign with verified sources

**One-time setup → Infinite automated content** 🚀

---

**Stop wasting time on manual content creation.**
**Let's automate this right now.**

Ready to build?
