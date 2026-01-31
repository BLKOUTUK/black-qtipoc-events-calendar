import { useState } from 'react';
import { Menu, X, Home, Brain, Newspaper, Calendar, Info } from 'lucide-react';

const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const primaryNav = [
    { id: 'home', label: 'Home', icon: Home, href: 'https://blkoutuk.com' },
    { id: 'events', label: 'Events', icon: Calendar, href: '#', active: true },
    { id: 'news', label: 'News', icon: Newspaper, href: 'https://news.blkoutuk.cloud' },
    { id: 'aivor', label: 'AIvor', icon: Brain, href: 'https://ivor.blkoutuk.cloud' },
    { id: 'about', label: 'About', icon: Info, href: 'https://blkoutuk.com/about' },
  ];

  const handleNavigation = (item: typeof primaryNav[0]) => {
    if (item.href === '#') return;
    window.open(item.href, '_blank', 'noopener noreferrer');
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-gray-900 border-b border-yellow-500/30 fixed top-0 left-0 right-0 z-50 shadow-xl backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <img
              src="/Branding and logos/BLKOUT25INV.png"
              alt="BLKOUT"
              className="h-8 w-auto"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <h1 className="text-lg font-bold text-yellow-500">BLKOUT Events</h1>
          </div>

          {/* Desktop Navigation — Top 5 */}
          <nav className="hidden md:flex items-center gap-1">
            {primaryNav.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 ${
                  item.active
                    ? 'bg-yellow-500/20 text-yellow-500'
                    : 'text-gray-300 hover:text-yellow-500 hover:bg-white/5'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-300 hover:text-yellow-500 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-yellow-500/30 py-2 space-y-1">
            {primaryNav.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all duration-200 ${
                  item.active
                    ? 'bg-yellow-500/20 text-yellow-500 font-semibold'
                    : 'text-gray-300 hover:text-yellow-500 hover:bg-yellow-500/10'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
