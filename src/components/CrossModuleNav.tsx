import React from 'react';
import { ExternalLink, Home, Bot, Newspaper, Smartphone } from 'lucide-react';

interface ModuleLink {
  label: string;
  href: string;
  icon: React.ReactNode;
  external?: boolean;
}

const CrossModuleNav: React.FC = () => {
  const moduleLinks: ModuleLink[] = [
    {
      label: "BLKOUT Home",
      href: "https://blkoutuk.com",
      icon: <Home className="w-4 h-4" />,
      external: true
    },
    {
      label: "Voices",
      href: "https://voices.blkoutuk.com",
      icon: <Newspaper className="w-4 h-4" />,
      external: true
    },
    {
      label: "Ask IVOR",
      href: "https://ivor.blkoutuk.com",
      icon: <Bot className="w-4 h-4" />,
      external: true
    },
    {
      label: "Discover",
      href: "https://discover.blkoutuk.com",
      icon: <Smartphone className="w-4 h-4" />,
      external: true
    }
  ];

  const handleModuleClick = (module: ModuleLink) => {
    // Track navigation
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'cross_module_navigation', {
        from_module: 'events_calendar',
        to_module: module.label.toLowerCase().replace(/\s+/g, '_'),
        is_external: module.external
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
        🌟 Explore BLKOUT Ecosystem
      </h3>
      <div className="flex flex-wrap gap-3">
        {moduleLinks.map((module, index) => (
          <a
            key={index}
            href={module.href}
            target={module.external ? '_blank' : '_self'}
            rel={module.external ? 'noopener noreferrer' : undefined}
            onClick={() => handleModuleClick(module)}
            className="flex items-center px-3 py-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-800 rounded-lg border border-yellow-200 hover:border-yellow-300 transition-colors duration-200 text-sm font-medium"
          >
            {module.icon}
            <span className="ml-2">{module.label}</span>
            {module.external && <ExternalLink className="w-3 h-3 ml-1" />}
          </a>
        ))}
      </div>
    </div>
  );
};

export default CrossModuleNav;