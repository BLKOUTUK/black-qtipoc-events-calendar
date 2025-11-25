import React from 'react';
import { ExternalLink } from 'lucide-react';

const AdventCalendarBanner: React.FC = () => {
  return (
    <div className="w-full mb-8">
      {/* Main Advent Banner - Logo on Left */}
      <div className="bg-gradient-to-br from-red-900/40 via-green-900/40 to-red-900/40 border-2 border-yellow-500/60 rounded-2xl p-6 shadow-2xl backdrop-blur-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* BLKOUT Christmas Logo - Left */}
          <div className="flex-shrink-0 w-40 h-40 md:w-56 md:h-56">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-contain rounded-2xl shadow-lg"
            >
              <source src="/Blkoutchristmas.mp4" type="video/mp4" />
              🎄
            </video>
          </div>

          {/* Content - Right */}
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">
              Let's Go OUT OUT This Christmas
            </h2>

            {/* Action Links */}
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <a
                href="https://blkoutuk.com/discover"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-green-600 text-white font-bold rounded-xl hover:from-red-500 hover:to-green-500 transition-all shadow-lg"
              >
                View Advent Calendar
                <ExternalLink className="w-5 h-5" />
              </a>
              <a
                href="https://blkoutuk.com/voices"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800/80 border-2 border-yellow-500/60 text-yellow-300 font-bold rounded-xl hover:bg-gray-700/80 transition-all shadow-lg"
              >
                Read Reviews
                <ExternalLink className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdventCalendarBanner;
