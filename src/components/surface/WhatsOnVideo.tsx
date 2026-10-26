import { useEffect, useState } from 'react';

// This week's AIvor "What's On" video, once Rob has approved it and it is public on YouTube
// (api/whats-on-video.ts). Nothing shows in a week without one.
type Video = { week_label: string; video_id: string; video_url: string };

export function WhatsOnVideo() {
  const [video, setVideo] = useState<Video | null>(null);

  useEffect(() => {
    fetch('/api/whats-on-video')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setVideo(d?.video || null))
      .catch(() => setVideo(null));
  }, []);

  if (!video) return null;
  return (
    <div className="mt-8 flex flex-col sm:flex-row gap-6 items-start">
      <div className="w-full max-w-[280px] aspect-[9/16] overflow-hidden border border-events/40 rounded-sharp bg-black">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${video.video_id}`}
          title={`BLKOUT What's On, ${video.week_label}`}
          className="w-full h-full"
          allow="encrypted-media; picture-in-picture; fullscreen"
          loading="lazy"
        />
      </div>
      <div className="max-w-[40ch]">
        <p className="font-meta text-xs uppercase tracking-wide text-events/100 mb-2">This week, from AIvor</p>
        <p className="font-disrupt italic text-[#f5f1e8] text-xl">
          the gatherings worth your time, in under a minute.
        </p>
        <a
          href={video.video_url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-meta text-xs uppercase tracking-wide text-events/100 hover:underline mt-3 inline-flex items-center min-h-[44px]"
        >
          Watch on YouTube →
        </a>
      </div>
    </div>
  );
}
