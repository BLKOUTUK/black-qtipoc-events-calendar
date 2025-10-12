import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { FeaturedContent } from '../types';

interface FeaturedHeroCarouselProps {
  featuredContent: FeaturedContent[];
  autoPlayInterval?: number; // milliseconds, set to 0 to disable
}

export const FeaturedHeroCarousel: React.FC<FeaturedHeroCarouselProps> = ({
  featuredContent,
  autoPlayInterval = 5000
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Filter to only show active featured content
  const activeContent = featuredContent.filter(content => content.status === 'active');

  // Auto-advance slides
  useEffect(() => {
    if (activeContent.length <= 1 || autoPlayInterval === 0 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeContent.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [activeContent.length, autoPlayInterval, isPaused]);

  if (activeContent.length === 0) return null;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + activeContent.length) % activeContent.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeContent.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const currentContent = activeContent[currentIndex];

  return (
    <div
      className="relative w-full bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-purple-500/30"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Main Content Area */}
      <div className="relative">
        {/* Background Image with Overlay */}
        <div className="relative h-64 md:h-80 lg:h-96 overflow-hidden">
          <img
            src={currentContent.image_url}
            alt={currentContent.title}
            className="w-full h-full object-cover"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/70 to-transparent"></div>
        </div>

        {/* Content Overlay */}
        <div className="absolute inset-0 flex items-end">
          <div className="w-full p-6 md:p-8 lg:p-10">
            {/* Featured Badge */}
            <div className="inline-flex items-center px-3 py-1 bg-purple-500/90 text-white text-xs font-bold rounded-full backdrop-blur-sm mb-3">
              <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
              FEATURED
            </div>

            {/* Title */}
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-white mb-3 leading-tight drop-shadow-lg">
              {currentContent.title}
            </h2>

            {/* Caption */}
            <p className="text-gray-200 text-base md:text-lg max-w-2xl mb-4 drop-shadow-md">
              {currentContent.caption}
            </p>

            {/* CTA Button */}
            {currentContent.link_url && (
              <a
                href={currentContent.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <span>Learn More</span>
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            )}
          </div>
        </div>

        {/* Navigation Arrows - Only show if more than 1 item */}
        {activeContent.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-all duration-200 z-10"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-all duration-200 z-10"
              aria-label="Next slide"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Dot Indicators - Only show if more than 1 item */}
      {activeContent.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
          {activeContent.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all duration-300 rounded-full ${
                index === currentIndex
                  ? 'w-8 h-3 bg-purple-500'
                  : 'w-3 h-3 bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Slide Counter */}
      {activeContent.length > 1 && (
        <div className="absolute top-4 right-4 px-3 py-1 bg-black/50 text-white text-xs font-medium rounded-full backdrop-blur-sm">
          {currentIndex + 1} / {activeContent.length}
        </div>
      )}
    </div>
  );
};
