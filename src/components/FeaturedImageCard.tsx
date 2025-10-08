import React from 'react';
import { ExternalLink } from 'lucide-react';

interface FeaturedImageCardProps {
  title: string;
  caption: string;
  imageUrl: string;
  linkUrl?: string;
}

export const FeaturedImageCard: React.FC<FeaturedImageCardProps> = ({
  title,
  caption,
  imageUrl,
  linkUrl
}) => {
  const CardContent = () => (
    <div className="bg-gray-800 border border-purple-500/30 rounded-lg shadow-lg overflow-hidden hover:shadow-xl hover:border-purple-500/50 transition-all duration-300">
      <div className="relative h-48 overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 left-3">
          <span className="px-3 py-1 bg-purple-500/90 text-white text-xs font-medium rounded-full backdrop-blur-sm">
            Featured
          </span>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-xl font-bold text-purple-400 mb-2 leading-tight">{title}</h3>
        <p className="text-gray-200 text-sm leading-relaxed">{caption}</p>

        {linkUrl && (
          <div className="mt-4 flex items-center text-purple-400 text-sm font-medium hover:text-purple-300 transition-colors">
            <ExternalLink className="w-4 h-4 mr-1" />
            Learn More
          </div>
        )}
      </div>
    </div>
  );

  if (linkUrl) {
    return (
      <a
        href={linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <CardContent />
      </a>
    );
  }

  return <CardContent />;
};
