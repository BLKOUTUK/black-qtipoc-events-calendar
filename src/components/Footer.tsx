import React from 'react';
import { Home, Heart, Brain, Vote, Users, Info, Play, Calendar, Instagram, Twitter, Facebook, Youtube, Mail } from 'lucide-react';

const Footer: React.FC = () => {
  const footerLinks = [
    { id: 'platform', label: 'Platform', icon: Home, href: 'https://blkoutuk.com' },
    { id: 'ivor', label: 'IVOR', icon: Brain, href: 'https://ivor.blkoutuk.cloud' },
    { id: 'news', label: 'Newsroom', icon: Play, href: 'https://news.blkoutuk.cloud' },
    { id: 'stories', label: 'Archive', icon: Calendar, href: 'https://blkoutuk.com/stories' },
    { id: 'events', label: 'Connect', icon: Calendar, href: '#', active: true },
    { id: 'community', label: 'Community', icon: Users, href: 'https://blkoutuk.com/community' },
    { id: 'governance', label: 'Governance', icon: Vote, href: 'https://blkoutuk.com/governance' },
    { id: 'about', label: 'About', icon: Info, href: 'https://blkoutuk.com/about' }
  ];

  const handleNavigation = (link: any) => {
    if (link.href === '#') return;
    if (link.href.startsWith('https://')) {
      window.open(link.href, '_blank', 'noopener noreferrer');
    }
  };

  return (
    <footer className="bg-gray-900 border-t border-yellow-500/30 mt-16">
      {/* Navigation Links */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {footerLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleNavigation(link)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                link.active
                  ? 'bg-yellow-500 text-gray-900 font-bold'
                  : 'text-gray-200 hover:text-yellow-500 hover:bg-yellow-500/10'
              }`}
            >
              <link.icon className="h-4 w-4" />
              <span className="text-sm font-medium">{link.label}</span>
            </button>
          ))}
        </div>

        {/* Platform Button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={() => window.open('https://blkoutuk.com', '_blank')}
            className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 px-6 py-3 rounded-2xl font-bold transition-all duration-300 hover:scale-105 flex items-center gap-2"
          >
            <Home className="h-5 w-5" />
            Back to Platform Home
          </button>
        </div>

        {/* Liberation Values */}
        <div className="border-t border-yellow-500/30 pt-8">
          <div className="text-center mb-6">
            <h3 className="text-yellow-500 font-bold text-lg mb-3">
              LIBERATION VALUES
            </h3>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-200">
              <div className="flex items-center gap-2">
                <span>✊🏾</span>
                <span>Fair Creator Compensation</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🗳️</span>
                <span>Democratic Governance</span>
              </div>
              <div className="flex items-center gap-2">
                <span>💜</span>
                <span>Trauma-Informed Design</span>
              </div>
              <div className="flex items-center gap-2">
                <span>💰</span>
                <span>Economic Justice</span>
              </div>
            </div>
          </div>

          {/* Social Media Links */}
          <div className="flex justify-center gap-6 mb-6">
            <a
              href="https://instagram.com/blkoutuk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-200 hover:text-yellow-500 transition-colors duration-200"
              aria-label="BLKOUT Instagram"
            >
              <Instagram className="h-6 w-6" />
            </a>
            <a
              href="https://twitter.com/blkoutuk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-200 hover:text-yellow-500 transition-colors duration-200"
              aria-label="BLKOUT Twitter"
            >
              <Twitter className="h-6 w-6" />
            </a>
            <a
              href="https://facebook.com/blkoutuk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-200 hover:text-yellow-500 transition-colors duration-200"
              aria-label="BLKOUT Facebook"
            >
              <Facebook className="h-6 w-6" />
            </a>
            <a
              href="https://youtube.com/@blkoutuk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-200 hover:text-yellow-500 transition-colors duration-200"
              aria-label="BLKOUT YouTube"
            >
              <Youtube className="h-6 w-6" />
            </a>
            <a
              href="mailto:info@blkout.org"
              className="text-gray-200 hover:text-yellow-500 transition-colors duration-200"
              aria-label="Contact BLKOUT"
            >
              <Mail className="h-6 w-6" />
            </a>
          </div>

          {/* Copyright and Info */}
          <div className="text-center text-sm text-gray-400">
            <p className="mb-2">
              © 2025 BLKOUT Liberation Platform - Community-Owned Technology
            </p>
            <p>
              Built by and for Black queer communities with love, rage, and liberation
            </p>
            <p className="mt-4 text-xs text-gray-500 max-w-2xl mx-auto">
              BLKOUT Creative Ltd is registered by the Financial Conduct Authority (London) as a Community Benefit Society under the Co-operative and Community Benefit Societies Act 2014.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;