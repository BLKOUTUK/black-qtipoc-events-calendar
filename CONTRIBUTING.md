# Contributing to Black QTIPOC+ Events Calendar

Thank you for your interest in contributing to our community platform! This project is built by and for the Black QTIPOC+ community, and we welcome contributions that align with our values of liberation, justice, and community care.

## 🌟 Ways to Contribute

### 🏛️ Community Contributions
- **Submit Events**: Use the community form to share relevant events
- **Provide Feedback**: Help us improve event relevance and platform usability
- **Share Knowledge**: Suggest new event sources or community organizations
- **Spread the Word**: Share the platform with community members and organizations

### 💻 Technical Contributions
- **Bug Fixes**: Help resolve issues and improve platform stability
- **Feature Development**: Build new features that serve community needs
- **Documentation**: Improve setup guides, API docs, and user instructions
- **Testing**: Help test new features and report issues

### 🎨 Design Contributions
- **UI/UX Improvements**: Enhance accessibility and user experience
- **Visual Design**: Improve aesthetics while maintaining accessibility
- **Mobile Optimization**: Ensure excellent mobile experience
- **Accessibility**: Help us meet and exceed WCAG guidelines

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ and npm
- Git
- Supabase account (for database access)
- Code editor (VS Code recommended)

### Getting Started
```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/yourusername/black-qtipoc-events.git
cd black-qtipoc-events

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev
```

### Development Workflow
1. **Create a branch** for your feature/fix: `git checkout -b feature/your-feature-name`
2. **Make your changes** following our coding standards
3. **Test thoroughly** on different devices and browsers
4. **Commit with clear messages** describing your changes
5. **Push to your fork** and create a pull request

## 📋 Coding Standards

### TypeScript/React
- Use TypeScript for all new code
- Follow React hooks patterns
- Use functional components over class components
- Implement proper error handling and loading states

### Styling
- Use Tailwind CSS for styling
- Follow mobile-first responsive design
- Ensure high contrast ratios for accessibility
- Use semantic HTML elements

### Database
- Follow existing schema patterns
- Use Row Level Security (RLS) for all tables
- Include proper indexes for performance
- Document any schema changes

### API Integration
- Handle rate limiting gracefully
- Implement proper error handling
- Log important events for monitoring
- Respect API terms of service

## 🎯 Community Guidelines

### Inclusive Development
- **Center Black QTIPOC+ voices** in all decisions
- **Prioritize accessibility** in every feature
- **Consider safety implications** of new features
- **Respect privacy** and data protection

### Code of Conduct
- **Be respectful** in all interactions
- **Assume positive intent** when reviewing code
- **Provide constructive feedback** on pull requests
- **Support learning** and skill development

### Event Relevance
When contributing to event discovery or filtering:
- **Understand the community** we serve
- **Respect intersectional identities** and experiences
- **Avoid assumptions** about what events are relevant
- **Seek community feedback** on algorithm changes

## 🔍 Pull Request Process

### Before Submitting
- [ ] Test your changes thoroughly
- [ ] Update documentation if needed
- [ ] Ensure accessibility compliance
- [ ] Check for mobile responsiveness
- [ ] Run linting and type checking

### PR Description Template
```markdown
## Description
Brief description of changes and motivation

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Accessibility improvement

## Testing
- [ ] Tested on desktop
- [ ] Tested on mobile
- [ ] Tested with screen reader
- [ ] Tested edge cases

## Community Impact
How does this change serve the Black QTIPOC+ community?

## Screenshots (if applicable)
Include before/after screenshots for UI changes
```

### Review Process
1. **Automated checks** must pass (linting, type checking)
2. **Community review** for relevance and impact
3. **Technical review** for code quality and security
4. **Accessibility review** for compliance
5. **Final approval** and merge

## 🚀 Feature Development Guidelines

### New Features
Before developing new features:
1. **Open an issue** to discuss the feature
2. **Get community feedback** on the proposal
3. **Consider accessibility** from the start
4. **Plan for mobile** and responsive design
5. **Think about data privacy** implications

### Event Discovery
When working on event scraping or filtering:
- **Test with real data** from multiple sources
- **Monitor relevance rates** and false positives
- **Consider bias** in keyword selection
- **Respect API rate limits** and terms of service
- **Document algorithm changes** thoroughly

### UI/UX Changes
- **Follow existing design patterns** for consistency
- **Test with community members** when possible
- **Ensure keyboard navigation** works properly
- **Maintain high contrast ratios** for readability
- **Consider different screen sizes** and orientations

## 🐛 Bug Reports

### Before Reporting
- Check if the issue already exists
- Try to reproduce the bug consistently
- Test on different browsers/devices if possible

### Bug Report Template
```markdown
## Bug Description
Clear description of what went wrong

## Steps to Reproduce
1. Go to...
2. Click on...
3. See error...

## Expected Behavior
What should have happened

## Environment
- Browser: [e.g., Chrome 91]
- Device: [e.g., iPhone 12, Desktop]
- OS: [e.g., iOS 14, Windows 10]

## Screenshots
If applicable, add screenshots to help explain the problem

## Additional Context
Any other context about the problem
```

## 📚 Resources

### Learning Resources
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Web Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### Community Resources
- [Black Trans Liberation](https://blacktrans.org/)
- [National Queer and Trans People of Color Coalition](https://www.nqttc.org/)
- [Audre Lorde Project](https://alp.org/)

## 💬 Getting Help

### Technical Questions
- Open an issue with the "question" label
- Join our community Discord (link coming soon)
- Email: tech@qtipocevents.org

### Community Questions
- Email: community@qtipocevents.org
- Check existing issues and discussions

### Security Issues
- Email: security@qtipocevents.org
- Do not open public issues for security vulnerabilities

## 🙏 Recognition

We believe in recognizing all contributions to our community platform:
- **Contributors** are listed in our README
- **Community feedback** shapes our development priorities
- **Event submissions** help build our community calendar
- **Bug reports** improve platform stability

Thank you for helping us build a platform that serves and celebrates the Black QTIPOC+ community! ✊🏿🏳️‍⚧️🏳️‍🌈