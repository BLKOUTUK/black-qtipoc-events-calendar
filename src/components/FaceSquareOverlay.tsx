import { useState, useEffect } from 'react';

interface FaceSquareOverlayProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  position?: 'top' | 'center' | 'bottom';
  enableLazyLoad?: boolean;
}

export function FaceSquareOverlay({ 
  size = 'lg', 
  position = 'center',
  enableLazyLoad = true
}: FaceSquareOverlayProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showGif, setShowGif] = useState(!enableLazyLoad);

  const sizeClasses = {
    sm: 'w-32 h-32',
    md: 'w-48 h-48', 
    lg: 'w-64 h-64',
    xl: 'w-80 h-80'
  };

  const positionClasses = {
    top: 'top-8',
    center: 'top-1/2 -translate-y-1/2',
    bottom: 'bottom-8'
  };

  // Lazy loading implementation
  useEffect(() => {
    if (!enableLazyLoad) return;

    const timer = setTimeout(() => {
      setShowGif(true);
    }, 1000); // Delay loading by 1 second for better initial page load

    return () => clearTimeout(timer);
  }, [enableLazyLoad]);

  return (
    <div 
      className={`fixed left-8 ${positionClasses[position]} ${sizeClasses[size]} pointer-events-none z-50`}
    >
      {showGif ? (
        <img 
          src="/images/face-square/face-cycling.gif"
          alt="Community members cycling"
          className={`w-full h-full object-contain filter drop-shadow-2xl opacity-95 transition-opacity duration-500 ${
            isLoaded ? 'opacity-95' : 'opacity-0'
          }`}
          onLoad={() => setIsLoaded(true)}
          loading="lazy"
        />
      ) : (
        // Fallback while loading - show first face as static
        <img 
          src="/images/face-square/1.png"
          alt="Community member"
          className="w-full h-full object-contain filter drop-shadow-2xl opacity-95"
        />
      )}
    </div>
  );
}