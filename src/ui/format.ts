import type { MetricDelta, MetricKey } from '../game/types/gameTypes';
import { METRIC_INFO } from '../game/data/initialState';

export type MetricStatus = 'healthy' | 'strained' | 'critical';

const INFO_BY_KEY = Object.fromEntries(METRIC_INFO.map((m) => [m.key, m]));

export function metricInfo(key: MetricKey) {
  return INFO_BY_KEY[key];
}

/** Health status of a metric value, respecting inverted (bad-when-high) metrics. */
export function metricStatus(key: MetricKey, value: number): MetricStatus {
  const badWhenHigh = INFO_BY_KEY[key]?.badWhenHigh ?? false;
  const v = badWhenHigh ? 100 - value : value;
  if (v >= 55) return 'healthy';
  if (v >= 30) return 'strained';
  return 'critical';
}

export const STATUS_TEXT: Record<MetricStatus, string> = {
  healthy: 'text-emerald-400',
  strained: 'text-amber-400',
  critical: 'text-red-400',
};

export const STATUS_BAR: Record<MetricStatus, string> = {
  healthy: 'bg-emerald-500',
  strained: 'bg-amber-500',
  critical: 'bg-red-500',
};

export interface DeltaChip {
  key: MetricKey;
  short: string;
  value: number;
  /** Whether this change is good news for the player. */
  positive: boolean;
}

/** Turn a metric delta into displayable chips (+CYB 8, −SOV 4, ...). */
export function deltaChips(delta: MetricDelta | undefined): DeltaChip[] {
  if (!delta) return [];
  return (Object.entries(delta) as [MetricKey, number][])
    .filter(([, v]) => v !== 0)
    .map(([key, value]) => {
      const info = INFO_BY_KEY[key];
      const positive = info?.badWhenHigh ? value < 0 : value > 0;
      return { key, short: info?.short ?? key, value, positive };
    });
}

/** Human label for an actor relationship value (-100..100). */
export function relationshipLabel(value: number): string {
  if (value >= 60) return 'Aligned';
  if (value >= 25) return 'Cordial';
  if (value >= -10) return 'Neutral';
  if (value >= -45) return 'Wary';
  return 'Hostile';
}

export function relationshipColor(value: number): string {
  if (value >= 25) return 'text-emerald-400';
  if (value >= -10) return 'text-slate-300';
  if (value >= -45) return 'text-amber-400';
  return 'text-red-400';
}
