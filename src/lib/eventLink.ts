import { doorSlugs, boroughSlug } from '../data/places';

/**
 * Event page addresses (events redesign spec 02, Part A): /e/<id>/<title-slug>.
 * The id finds the event; the slug is for people reading the link. `slug` in the
 * events table is empty for every live row (25 Oct 2026), so it is not used.
 * server.ts has its own copy of eventSlug — keep the two in step.
 */
export function eventSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
}

/** The borough door's address when the event's borough has one ('/lambeth/'), else null. Doors are static pages: link with <a>, not a router Link. */
export function doorPath(borough: string | null | undefined): string | null {
  if (!borough) return null;
  const slug = boroughSlug(borough);
  return doorSlugs.includes(slug) ? `/${slug}/` : null;
}

export function eventPath(event: { id: string; title: string }): string {
  const slug = eventSlug(event.title);
  return slug ? `/e/${event.id}/${slug}` : `/e/${event.id}`;
}
