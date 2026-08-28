import { Place } from '../../types/surface';
import { doorSlugs, boroughSlug } from '../../data/places';

interface PlaceRowProps {
  place: Place;
}

export function PlaceRow({ place }: PlaceRowProps) {
  return (
    <div className="py-3 border-b border-events/10">
      {place.url ? (
        <a
          href={place.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-[#f5f1e8] hover:text-events/100 transition-colors"
        >
          {place.name}
        </a>
      ) : (
        <p className="font-semibold text-[#f5f1e8]">{place.name}</p>
      )}
      <p className="text-sm text-[#f5f1e8]/60">{place.what}</p>
      {place.regular && (
        <p className="font-meta text-xs uppercase tracking-wide text-[#f5f1e8]/50 mt-1">{place.regular}</p>
      )}
      <p className="text-sm text-[#f5f1e8]/50">{place.where}</p>
      {place.borough && (
        <p className="font-meta text-xs uppercase tracking-wide text-[#f5f1e8]/50 mt-1">
          {place.borough}
          {doorSlugs.includes(boroughSlug(place.borough)) && (
            <>
              {' · '}
              <a href={`/${boroughSlug(place.borough)}/`} className="text-events/100 hover:underline normal-case tracking-normal">
                BLKOUT in {place.borough} →
              </a>
            </>
          )}
        </p>
      )}
    </div>
  );
}
