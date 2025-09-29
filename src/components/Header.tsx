import React, { useState } from 'react';
import { Menu, X, Home, Brain, Play, Calendar, Users, Vote, Info } from 'lucide-react';

interface HeaderProps {
  onBackToPlatform?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onBackToPlatform }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    { id: 'platform', label: 'Platform', icon: Home, href: 'https://blkout.vercel.app' },
    { id: 'ivor', label: 'IVOR', icon: Brain, href: 'https://blkout.vercel.app' },
    { id: 'news', label: 'Newsroom', icon: Play, href: 'https://blkout.vercel.app' },
    { id: 'stories', label: 'Archive', icon: Calendar, href: 'https://blkout.vercel.app' },
    { id: 'events', label: 'Connect', icon: Calendar, href: '#', active: true },
    { id: 'community', label: 'Community', icon: Users, href: 'https://blkout.vercel.app' },
    { id: 'governance', label: 'Governance', icon: Vote, href: 'https://blkout.vercel.app' },
    { id: 'about', label: 'About', icon: Info, href: 'https://blkout.vercel.app' }
  ];

  const handleNavigation = (item: any) => {
    if (item.href === '#') return;
    if (item.href.startsWith('https://')) {
      window.open(item.href, '_blank', 'noopener noreferrer');
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-liberation-black-power border-b border-liberation-sovereignty-gold/20 sticky top-0 z-50">
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
            <div>
              <h1 className="text-xl font-bold text-liberation-sovereignty-gold">
                BLKOUT Connect
              </h1>
              <p className="text-xs text-liberation-silver hidden sm:block">
                Where Black Queer Magic Happens • Parties • Workshops • Revolution
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  item.active
                    ? 'bg-liberation-sovereignty-gold text-black'
                    : 'text-liberation-silver hover:text-liberation-sovereignty-gold hover:bg-liberation-sovereignty-gold/10'
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
              onClick={() => window.open('https://blkout.vercel.app', '_blank')}
              className="bg-liberation-sovereignty-gold hover:bg-liberation-sovereignty-gold/90 text-black px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Platform
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-liberation-silver hover:text-liberation-sovereignty-gold transition-colors"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-liberation-sovereignty-gold/20 bg-liberation-black-power">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all duration-200 ${
                    item.active
                      ? 'bg-liberation-sovereignty-gold text-black font-semibold'
                      : 'text-liberation-silver hover:text-liberation-sovereignty-gold hover:bg-liberation-sovereignty-gold/10'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </button>
              ))}

              {/* Back to Platform - Mobile */}
              <div className="pt-4 border-t border-liberation-sovereignty-gold/10">
                <button
                  onClick={() => {
                    window.open('https://blkout.vercel.app', '_blank');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full bg-liberation-sovereignty-gold text-black px-3 py-3 rounded-lg font-semibold hover:bg-liberation-sovereignty-gold/90 transition-colors flex items-center gap-2"
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