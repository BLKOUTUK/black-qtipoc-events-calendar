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
      label: "BLKOUT Platform",
      href: "https://platform-blkout.vercel.app",
      icon: <Home className="w-4 h-4" />,
      external: true
    },
    {
      label: "Liberation Journey",
      href: "https://journey-blkout.vercel.app",
      icon: <Newspaper className="w-4 h-4" />,
      external: true
    },
    {
      label: "Ask I.V.O.R.",
      href: "https://ivor-blkout.vercel.app",
      icon: <Bot className="w-4 h-4" />,
      external: true
    },
    {
      label: "Mobile App",
      href: "#",
      icon: <Smartphone className="w-4 h-4" />
    }
  ];

  const handleModuleClick = (module: ModuleLink, e: React.MouseEvent) => {
    // Track navigation
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'cross_module_navigation', {
        from_module: 'events_calendar',
        to_module: module.label.toLowerCase().replace(/\s+/g, '_'),
        is_external: module.external
      });
    }

    if (module.label === "Mobile App") {
      e.preventDefault();
      // Try mobile app first, fallback to app store
      window.location.href = 'blkouthub://events';
      setTimeout(() => {
        window.open('https://apps.apple.com/app/blkouthub', '_blank');
      }, 2500);
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
            onClick={(e) => handleModuleClick(module, e)}
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