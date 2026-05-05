import { useState } from 'react';
import { Menu, X, Home, Brain, Newspaper, Calendar, ExternalLink } from 'lucide-react';

/**
 * Header — BLKOUT One Platform Design pilot (events-calendar).
 *
 * §7 chrome pattern (Option C hybrid):
 *   - 4px lemon bar above the nav (events section accent)
 *   - Active section uses 2px section-accent underline (Events is always active here)
 *   - Each main-nav button carries its own section accent on hover
 *   - Second-row buttons section-themed (Shop=orange, Membership/About=red, Discover/Community=gold)
 *
 * §9 side-finding fix: news/voices/comms URLs flipped from .cloud → .com.
 */

const secondaryNav = [
  { id: 'discover',   label: 'Discover',   href: 'https://comms.blkoutuk.cloud/discover', accentText: 'hover:text-liberation-gold-divine', accentBorder: 'hover:border-liberation-gold-divine/60' },
  { id: 'community',  label: 'Community',  href: 'https://blkouthub.com',                accentText: 'hover:text-liberation-gold-divine', accentBorder: 'hover:border-liberation-gold-divine/60' },
  { id: 'shop',       label: 'Shop',       href: 'https://blkoutuk.com/shop',            accentText: 'hover:text-shop',                   accentBorder: 'hover:border-shop/60' },
  { id: 'membership', label: 'Membership', href: 'https://blkoutuk.com/membership',      accentText: 'hover:text-members',                accentBorder: 'hover:border-members/60' },
  { id: 'about',      label: 'About',      href: 'https://blkoutuk.com/about',           accentText: 'hover:text-members',                accentBorder: 'hover:border-members/60' },
];

const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Per-button section accents per One Platform Design §7. Events is always active
  // here (this app IS the Events section), so its underline persists.
  const primaryNav = [
    { id: 'home',   label: 'Home',   icon: Home,         href: 'https://blkoutuk.com',                                                                                          accentText: 'hover:text-liberation-gold-divine', accentBorder: 'hover:border-liberation-gold-divine/60', active: false },
    { id: 'events', label: 'Events', icon: Calendar,     href: '#',                                                                                                              accentText: 'text-events',                       accentBorder: 'border-events',                          active: true },
    { id: 'news',   label: 'News',   icon: Newspaper,    href: 'https://news.blkoutuk.com',                                                                                      accentText: 'hover:text-news',                   accentBorder: 'hover:border-news/60',                   active: false },
    { id: 'aivor',  label: 'AIvor',  icon: Brain,        href: 'https://blkoutuk.com?chat=open&utm_source=events-calendar&utm_medium=header&utm_campaign=meet-aivor',           accentText: 'hover:text-aivor',                  accentBorder: 'hover:border-aivor/60',                  active: false },
    { id: 'voices', label: 'Voices', icon: ExternalLink, href: 'https://voices.blkoutuk.com',                                                                                    accentText: 'hover:text-voices',                 accentBorder: 'hover:border-voices/60',                 active: false },
  ];

  const handleNavigation = (item: typeof primaryNav[0]) => {
    if (item.href === '#') return;
    window.open(item.href, '_blank', 'noopener noreferrer');
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* 4px lemon section-accent bar — events section identity */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-events z-50" aria-hidden />

      <header className="bg-liberation-black-power border-b border-events/30 fixed top-1 left-0 right-0 z-40 shadow-xl backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <img
                src="/Branding and logos/BLKOUT25INV.png"
                alt="BLKOUT"
                className="h-8 w-auto"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <div className="border-l border-events/30 pl-3">
                <h1 className="text-xl font-black text-events tracking-tight">BLKOUT</h1>
                <p className="text-xs text-gray-400 italic font-disrupt">Events</p>
              </div>
            </div>

            {/* Desktop Navigation — Top 5, Option C hybrid (underline + per-button accent) */}
            <nav className="hidden md:flex items-center gap-4">
              {primaryNav.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item)}
                  className={`flex items-center gap-2 px-4 py-2 text-base font-black uppercase tracking-tight transition-colors duration-200 border-b-2 ${
                    item.active
                      ? `${item.accentText} ${item.accentBorder}`
                      : `text-gray-200 border-transparent ${item.accentText} ${item.accentBorder}`
                  }`}
                >
                  <item.icon className="h-[18px] w-[18px]" />
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-gray-300 hover:text-events transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-events/30 py-2 space-y-1">
              {primaryNav.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item)}
                  className={`w-full flex items-center gap-3 px-3 py-3 text-left transition-colors duration-200 border-l-2 ${
                    item.active
                      ? `${item.accentText} ${item.accentBorder} font-semibold`
                      : `text-gray-300 border-transparent ${item.accentText} ${item.accentBorder}`
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Second row — section-themed external links */}
        <div className="border-t border-liberation-gold-divine/20 bg-liberation-black-power/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5">
            <nav className="hidden md:flex items-center gap-3 justify-end" aria-label="Secondary navigation">
              {secondaryNav.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`px-3 py-1 text-sm font-bold uppercase tracking-wider transition-colors duration-200 border-b-2 border-transparent text-gray-400 ${item.accentText} ${item.accentBorder} flex items-center gap-1`}
                >
                  {item.label}
                  <ExternalLink size={12} className="opacity-50" />
                </a>
              ))}
            </nav>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
