# Black QTIPOC+ Events Calendar

A community-driven events calendar focused on Black QTIPOC+ community events with automated event discovery and intelligent filtering.

## 🌟 Project Overview

This platform serves the Black QTIPOC+ community by:
- **Discovering** relevant events across multiple platforms
- **Curating** community-submitted events through moderation
- **Celebrating** Black QTIPOC+ voices, experiences, and joy
- **Connecting** community members with safe, inclusive spaces

## ✨ Features

### 🔍 Multi-Source Event Aggregation
- **API Integration**: Eventbrite organizations, Outsavvy search strategies
- **RSS Feed Monitoring**: Known QTIPOC+ organizations and cultural sources
- **Web Scraping**: Broader LGBTQ+ and Black cultural event discovery
- **AI-powered relevance scoring**: Weighted keyword matching for QTIPOC+ content
- **Intelligent deduplication**: Fuzzy matching with quality-based merge recommendations
- **Orchestrated collection**: Coordinated multi-source event discovery with priority-based execution

### 🏛️ Community Moderation
- **Public submissions**: Anyone can submit events
- **Admin dashboard**: Streamlined approval process
- **Bulk actions**: Efficient moderation tools
- **Quality metrics**: Track discovery performance

### 🎨 User Experience
- **Mobile-first design**: Optimized for all devices
- **Advanced filtering**: Date, location, source, search
- **Calendar integration**: One-click Google Calendar export
- **Accessibility**: WCAG compliant design

### 🛡️ Safety & Guidelines
- **Community-centered**: Prioritizes Black QTIPOC+ leadership
- **Safe spaces**: Affirming and inclusive events only
- **Accessibility focus**: Encourages accessible events
- **Clear guidelines**: Transparent community standards

## 🚀 Technology Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase (Database + Edge Functions)
- **APIs**: Eventbrite API, Facebook Graph API
- **Deployment**: Netlify (Frontend), Supabase (Backend)
- **Icons**: Lucide React

## 📋 Current Status

### ✅ Completed Features
- [x] Core event calendar interface
- [x] Community event submission form
- [x] Admin authentication and dashboard
- [x] Advanced filtering and search
- [x] Database schema with RLS policies
- [x] Event moderation queue
- [x] Multi-source event aggregation system
- [x] RSS feed monitoring for QTIPOC+ organizations
- [x] Web scraping adapter for broader cultural sources
- [x] Intelligent event deduplication with fuzzy matching
- [x] Orchestrated collection coordination
- [x] Enhanced keyword matching with weighted scoring
- [x] API integration (Eventbrite organizations, Outsavvy search strategies)
- [x] Quality metrics and monitoring
- [x] Mobile-responsive design
- [x] Calendar export functionality

### 🔄 In Progress
- [ ] API key configuration and testing
- [ ] Facebook app review process
- [ ] Known QTIPOC+ organization database
- [ ] Production deployment setup
- [ ] Community feedback integration

### 📅 Planned Features
- [ ] Email notifications for new events
- [ ] User favorites and saved events
- [ ] Event recommendations
- [ ] Community organizer profiles
- [ ] Event analytics and insights
- [ ] Multi-language support
- [ ] Advanced accessibility features

## 🔧 Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- API keys (see Configuration section)

### Local Development
```bash
# Clone the repository
git clone https://github.com/yourusername/black-qtipoc-events.git
cd black-qtipoc-events

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev
```

### Database Setup
1. Create a new Supabase project
2. Run the migration files in `/supabase/migrations/`
3. Configure Row Level Security policies
4. Set up edge functions

### Configuration

#### Required Environment Variables
```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# API Keys (for scraping functions)
EVENTBRITE_API_TOKEN=your_eventbrite_token
FACEBOOK_ACCESS_TOKEN=your_facebook_token
OUTSAVVY_API_KEY=your_outsavvy_key
```

#### API Key Setup

**Eventbrite API:**
1. Go to [Eventbrite API](https://www.eventbrite.com/platform/api)
2. Create an app and get your API token
3. Free tier includes 1000 requests/day

**Facebook Graph API:**
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create an app and get access token
3. Request permissions for public events (requires app review)

**Outsavvy API:**
- Contact Outsavvy for API access (may not be publicly available)

## 🎯 Multi-Source Event Aggregation System

### 🔄 Collection Architecture
The system employs a comprehensive multi-source approach with intelligent coordination:

**Priority-Based Sources:**
1. **API Integration** (Priority 1): Known QTIPOC+ organizations on Eventbrite, targeted Outsavvy searches
2. **RSS Feed Monitoring** (Priority 2): UK Black Pride, BLM UK, Stonewall UK, Gendered Intelligence, Black Cultural Archives
3. **Web Scraping** (Priority 3): Time Out London LGBT, Resident Advisor, Southbank Centre, Rich Mix, Black History Month events

### 🧠 Relevance Scoring Algorithm
Sophisticated keyword matching with weighted scoring across multiple dimensions:

- **Identity Keywords** (10 points): `black`, `qtipoc`, `trans`, `queer`, `lgbtq`, `genderqueer`
- **Community Keywords** (7 points): `poc`, `bipoc`, `intersectional`, `community`, `solidarity`
- **Values Keywords** (5 points): `liberation`, `justice`, `healing`, `safe space`, `activism`
- **Cultural Keywords** (4 points): `afrobeats`, `caribbean`, `spoken word`, `heritage`
- **Event Type Keywords** (2-3 points): `workshop`, `celebration`, `arts`, `music`, `support group`

### 🔍 Quality Control System
**Multi-layered filtering approach:**
- Minimum relevance threshold: 10-15 points depending on source
- Event likelihood detection using date/time/location patterns
- Source credibility weighting
- Content completeness scoring
- Fuzzy deduplication with 70% similarity threshold

### 🎛️ Orchestration Strategies
**Collection modes:**
- **Comprehensive**: All sources (4+ minute runtime, maximum coverage)
- **Priority Only**: API sources only (1-2 minute runtime, high-quality events)  
- **Fast**: APIs + RSS feeds (2-3 minute runtime, balanced approach)

### 🔧 Deduplication Engine
**Intelligent merge system:**
- Levenshtein distance calculation for fuzzy string matching
- Multi-factor similarity: title (35%), description (20%), date (25%), location (15%), organizer (5%)
- Quality-based event selection with information merging
- Confidence scoring for merge suggestions
- Comprehensive tag combination from all sources

## 🏛️ Database Schema

### Core Tables
- **events**: Event information with moderation status
- **contacts**: Organizer and community member information
- **organizations**: Community organizations and partnerships
- **scraping_logs**: Event discovery monitoring
- **communication_logs**: Community engagement tracking

### Key Features
- Row Level Security (RLS) for data protection
- Automated timestamps and triggers
- Comprehensive indexing for performance
- JSONB fields for flexible data storage

## 🛡️ Community Guidelines

### Safe Spaces
All events must be affirming and inclusive of Black QTIPOC+ identities. We prioritize spaces where our community can feel safe and celebrated.

### Community-Centered
Events should center Black QTIPOC+ voices, experiences, and leadership. We amplify grassroots organizing and community-led initiatives.

### Accessible
We encourage events that are accessible in terms of location, cost, and physical accessibility.

### Respectful
All submissions must be respectful and appropriate. Discriminatory or harmful content will not be tolerated.

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### For Community Members
- Submit events through the community form
- Provide feedback on event relevance
- Share the platform with community organizations
- Report issues or suggest improvements

### For Developers
- Check the Issues tab for open tasks
- Follow the coding standards and conventions
- Write tests for new features
- Update documentation

### For Organizations
- Partner with us to amplify your events
- Provide feedback on community needs
- Help us identify relevant keywords and sources
- Share the platform with your networks

## 📊 Performance Metrics

### Discovery Quality
- **Relevance Rate**: Percentage of discovered events that are community-relevant
- **Coverage**: Number of events discovered vs. manually submitted
- **Precision**: Accuracy of automated filtering
- **Community Satisfaction**: Feedback on event quality

### Platform Usage
- **Event Submissions**: Community-submitted events per month
- **Moderation Efficiency**: Time from submission to approval
- **User Engagement**: Calendar exports and event views
- **Geographic Coverage**: Events across different cities/regions

## 🔮 Future Vision

### Short Term (3 months)
- Complete API integrations and testing
- Launch beta version with select communities
- Gather feedback and iterate on features
- Establish partnerships with key organizations

### Medium Term (6 months)
- Full public launch
- Mobile app development
- Advanced personalization features
- Community organizer tools

### Long Term (1 year+)
- Multi-city expansion
- International community support
- Advanced analytics and insights
- Community-driven feature development

## 📞 Contact

- **Community Questions**: community@qtipocevents.org
- **Technical Issues**: tech@qtipocevents.org
- **Partnerships**: partnerships@qtipocevents.org

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with love for the Black QTIPOC+ community
- Inspired by grassroots organizing and community care
- Powered by open source technologies and community contributions

---

**Together, we create spaces where Black QTIPOC+ joy can flourish.** ✊🏿🏳️‍⚧️🏳️‍🌈