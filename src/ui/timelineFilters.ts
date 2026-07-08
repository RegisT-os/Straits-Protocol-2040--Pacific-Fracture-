import type { TimelineEntry } from '../game/types/gameTypes';

export type TimelineFilterId =
  | 'all'
  | 'player'
  | 'ai'
  | 'event'
  | 'map'
  | 'front'
  | 'campaign'
  | 'military'
  | 'scheduled';

export const TIMELINE_FILTERS: { id: TimelineFilterId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'player', label: 'You' },
  { id: 'ai', label: 'Actors' },
  { id: 'event', label: 'Events' },
  { id: 'map', label: 'Map' },
  { id: 'front', label: 'Fronts' },
  { id: 'campaign', label: 'Campaigns' },
  { id: 'military', label: 'Military' },
  { id: 'scheduled', label: 'Delayed' },
];

/**
 * Display-only filtering. Fronts and campaigns share the 'map' entry type
 * today, so those two filters match on title heuristics — safe if the
 * underlying types evolve later.
 */
export function matchesTimelineFilter(entry: TimelineEntry, filter: TimelineFilterId): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'front':
      return /war front|front shift|front:/i.test(entry.title);
    case 'campaign':
      return /campaign/i.test(entry.title);
    case 'map':
      return entry.type === 'map' && !/war front|front shift|campaign/i.test(entry.title);
    default:
      return entry.type === filter;
  }
}
