import React from 'react';
import { ExternalLink } from 'lucide-react';

const AdventCalendarBanner: React.FC = () => {
  return (
    <div className="w-full mb-8">
      {/* Main Advent Banner - Simplified */}
      <div className="bg-gradient-to-br from-red-900/30 via-green-900/30 to-red-900/30 border-2 border-yellow-500/50 rounded-2xl p-6 shadow-2xl backdrop-blur-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* BLKOUT Christmas Logo */}
          <div className="flex-shrink-0 w-32 h-32 md:w-40 md:h-40">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-contain rounded-xl"
            >
              <source src="/Blkoutchristmas.mp4" type="video/mp4" />
              🎄
            </video>
          </div>

          {/* Simple Content */}
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Let's Go OUT OUT This Christmas
            </h2>

            {/* Action Links */}
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <a
                href="https://blkoutuk.com/discover"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-red-600 to-green-600 text-white font-semibold rounded-lg hover:from-red-500 hover:to-green-500 transition-all text-sm"
              >
                View Advent Calendar
                <ExternalLink className="w-4 h-4" />
              </a>
              <a
                href="https://blkoutuk.com/voices"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2 bg-gray-800/80 border border-yellow-500/50 text-yellow-300 font-semibold rounded-lg hover:bg-gray-700/80 transition-all text-sm"
              >
                Read Reviews
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdventCalendarBanner;
