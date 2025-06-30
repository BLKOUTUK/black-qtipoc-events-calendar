# Black QTIPOC+ Events Calendar

A community-driven events calendar focused on Black QTIPOC+ community events with automated event discovery and intelligent filtering.

## 🌟 Project Overview

This platform serves the Black QTIPOC+ community by:
- **Discovering** relevant events across multiple platforms
- **Curating** community-submitted events through moderation
- **Celebrating** Black QTIPOC+ voices, experiences, and joy
- **Connecting** community members with safe, inclusive spaces

## ✨ Features

### 🔍 Automated Event Discovery
- **Multi-platform scraping**: Eventbrite, Facebook, Outsavvy
- **AI-powered relevance scoring**: Weighted keyword matching
- **Smart filtering**: Identifies Black QTIPOC+ relevant content
- **Quality control**: Automated filtering with human moderation

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
- [x] Automated scraping framework
- [x] Enhanced keyword matching system
- [x] Multi-platform integration (Eventbrite, Facebook, Outsavvy)
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

## 🎯 Event Discovery Algorithm

### Keyword System
The system uses sophisticated keyword matching with weighted scoring:

- **Identity Keywords** (10 points): `black`, `qtipoc`, `trans`, `queer`
- **Community Keywords** (7 points): `poc`, `bipoc`, `intersectional`
- **Values Keywords** (5 points): `liberation`, `justice`, `healing`
- **Event Type Keywords** (2 points): `workshop`, `arts`, `music`

### Quality Thresholds
- Minimum relevance score: 10 points
- Bonus for multiple keyword matches
- Category and organizer analysis
- Community feedback integration

### Search Strategies
- **Geographic targeting**: Major cities with QTIPOC+ communities
- **Temporal filtering**: Events within 90 days
- **Source diversification**: Multiple platforms and approaches
- **Continuous optimization**: Algorithm improvements based on feedback

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