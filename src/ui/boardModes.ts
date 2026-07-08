export type BoardMode = 'map' | 'fronts' | 'military' | 'campaigns' | 'intelligence';

export const BOARD_MODES: { id: BoardMode; label: string }[] = [
  { id: 'map', label: 'Strategic Map' },
  { id: 'fronts', label: 'War Fronts' },
  { id: 'military', label: 'Military' },
  { id: 'campaigns', label: 'Campaigns' },
  { id: 'intelligence', label: 'Intelligence' },
];
