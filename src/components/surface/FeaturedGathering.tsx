import { useEffect, useState } from 'react';
import { featuredContentService } from '../../services/featuredContentService';
import { FeaturedContent } from '../../types';

// Featured slot (Rob, 21 Nov 2026: Beam Day "a featured event"). Reads this week's
// weekly_featured_content rows (status active, week_start = this Monday) and shows the first
// one large, above the gatherings list. Nothing renders in a week with no row.
export function FeaturedGathering() {
  const [item, setItem] = useState<FeaturedContent | null>(null);

  useEffect(() => {
    featuredContentService.getCurrentWeekFeatured().then((rows) => setItem(rows[0] ?? null));
  }, []);

  if (!item) return null;
  const external = !!item.link_url && /^https?:/.test(item.link_url);

  return (
    <a
      href={item.link_url || '#gatherings'}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="mt-8 group grid grid-cols-1 md:grid-cols-5 bg-[#14141f] border-2 border-events/100 rounded-sharp overflow-hidden hover:bg-[#1a1a28] transition-colors"
    >
      <div className="md:col-span-2 aspect-[5/4] md:aspect-auto overflow-hidden">
        <img src={item.image_url} alt="" className="w-full h-full object-cover" />
      </div>
      <div className="md:col-span-3 p-6 md:p-8 flex flex-col justify-center">
        <p className="font-meta text-[12px] uppercase tracking-widest text-events/100">Featured · BLKOUT</p>
        <h3 className="font-signature font-black uppercase tracking-tight leading-[1.02] text-3xl md:text-4xl text-[#f5f1e8] mt-3">
          {item.title}
        </h3>
        <p className="text-[#f5f1e8]/80 mt-4 leading-relaxed max-w-[52ch]">{item.caption}</p>
        <span className="mt-6 inline-flex self-start items-center bg-events/100 text-[#0a0a14] font-signature font-black uppercase tracking-tight px-6 py-3 min-h-[44px] rounded-sharp group-hover:bg-events/90">
          Details and tickets →
        </span>
      </div>
    </a>
  );
}
