# Changelog

All notable changes to the Black QTIPOC+ Events Calendar will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Enhanced event scraping system with weighted keyword matching
- Multi-platform integration (Eventbrite, Facebook, Outsavvy)
- Advanced relevance scoring algorithm
- Real-time scraping dashboard with quality metrics
- Bulk moderation tools for admin efficiency
- Comprehensive database schema with RLS policies
- Mobile-first responsive design
- Calendar export functionality
- Community guidelines and safety features

### Changed
- Improved event discovery algorithm with sophisticated filtering
- Enhanced admin dashboard with performance analytics
- Better error handling and rate limiting for API calls
- Optimized database queries with proper indexing

### Security
- Implemented Row Level Security (RLS) for all database tables
- Added proper authentication and authorization
- Secured API endpoints with proper validation

## [0.1.0] - 2024-01-15

### Added
- Initial project setup with React + TypeScript + Tailwind CSS
- Basic event calendar interface
- Community event submission form
- Admin authentication system
- Event moderation queue
- Supabase integration for database and authentication
- Basic filtering and search functionality

### Infrastructure
- Supabase database setup with events and scraping_logs tables
- Edge functions for automated event scraping
- Netlify deployment configuration
- GitHub repository setup with comprehensive documentation

---

## Development Notes

### API Integration Status
- **Eventbrite**: ✅ Implementation complete, awaiting API key
- **Facebook**: ✅ Implementation complete, awaiting app review
- **Outsavvy**: ✅ Implementation complete, awaiting API access

### Known Issues
- Facebook API requires app review for public event access
- Outsavvy may not have public API available
- Rate limiting needs fine-tuning based on actual API usage

### Next Milestones
- [ ] Complete API key setup and testing
- [ ] Beta launch with select community organizations
- [ ] Community feedback integration
- [ ] Performance optimization based on real usage data