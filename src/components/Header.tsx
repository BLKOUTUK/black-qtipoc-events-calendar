import React, { useState } from 'react';
import { Menu, X, Home, Brain, Play, Calendar, Users, Vote, Info } from 'lucide-react';

interface HeaderProps {
  onBackToPlatform?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onBackToPlatform }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    { id: 'platform', label: 'Platform', icon: Home, href: 'https://blkoutuk.com' },
    { id: 'ivor', label: 'IVOR', icon: Brain, href: 'https://ivor.blkoutuk.cloud' },
    { id: 'news', label: 'Newsroom', icon: Play, href: 'https://news.blkoutuk.cloud' },
    { id: 'stories', label: 'Archive', icon: Calendar, href: 'https://blkoutuk.com/stories' },
    { id: 'events', label: 'Connect', icon: Calendar, href: '#', active: true },
    { id: 'community', label: 'Community', icon: Users, href: 'https://blkoutuk.com/community' },
    { id: 'governance', label: 'Governance', icon: Vote, href: 'https://blkoutuk.com/governance' },
    { id: 'about', label: 'About', icon: Info, href: 'https://blkoutuk.com/about' }
  ];

  const handleNavigation = (item: any) => {
    if (item.href === '#') return;
    if (item.href.startsWith('https://')) {
      window.open(item.href, '_blank', 'noopener noreferrer');
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-gray-900 border-b border-yellow-500/30 fixed top-0 left-0 right-0 z-50 shadow-xl backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <img
              src="/Branding and logos/BLKOUT25INV.png"
              alt="BLKOUT Liberation Platform"
              className="h-8 w-auto"
              onError={(e) => {
                // Fallback if logo doesn't exist
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <h1 className="text-xl font-bold text-yellow-500">
              BLKOUT Connect
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  item.active
                    ? 'bg-yellow-500 text-gray-900'
                    : 'text-gray-300 hover:text-yellow-500 hover:bg-yellow-500/10'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Back to Platform Button - Desktop */}
          <div className="hidden lg:block">
            <button
              onClick={() => window.open('https://blkoutuk.com', '_blank')}
              className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Platform
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-300 hover:text-yellow-500 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-yellow-500/30 bg-gray-900">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all duration-200 ${
                    item.active
                      ? 'bg-yellow-500 text-gray-900 font-semibold'
                      : 'text-gray-300 hover:text-yellow-500 hover:bg-yellow-500/10'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </button>
              ))}

              {/* Back to Platform - Mobile */}
              <div className="pt-4 border-t border-yellow-500/30">
                <button
                  onClick={() => {
                    window.open('https://blkoutuk.com', '_blank');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full bg-yellow-500 text-gray-900 px-3 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-colors flex items-center gap-2"
                >
                  <Home className="h-5 w-5" />
                  Back to Platform Home
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;