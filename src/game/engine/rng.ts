// Deterministic seeded RNG (mulberry32). Engines never call Math.random.
// The game state stores `seed` and `rngCursor` (number of draws consumed),
// so a loaded save reproduces the exact same future as the original run.

export class Rng {
  private state: number;
  cursor: number;

  constructor(seed: number, cursor = 0) {
    this.state = seed >>> 0;
    this.cursor = 0;
    // Fast-forward to the saved position.
    for (let i = 0; i < cursor; i++) this.next();
  }

  /** Uniform float in [0, 1). Advances the cursor. */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    this.cursor++;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /** True with probability p. */
  chance(p: number): boolean {
    return this.next() < p;
  }

  /** Weighted pick; returns undefined for an empty list. */
  weightedPick<T>(items: T[], weightOf: (item: T) => number): T | undefined {
    if (items.length === 0) return undefined;
    const total = items.reduce((sum, it) => sum + Math.max(0, weightOf(it)), 0);
    if (total <= 0) return items[this.int(0, items.length - 1)];
    let roll = this.next() * total;
    for (const it of items) {
      roll -= Math.max(0, weightOf(it));
      if (roll <= 0) return it;
    }
    return items[items.length - 1];
  }
}

/** Derive a numeric seed from an arbitrary string (xmur3 hash). */
export function seedFromString(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

/** A fresh random seed for new campaigns (UI-level only, never in engines). */
export function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff) >>> 0;
}
