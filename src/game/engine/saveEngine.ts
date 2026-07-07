import type { GameState } from '../types/gameTypes';

const SAVE_KEY = 'straits-protocol-2040-save';
const SAVE_VERSION = 2;

interface SaveEnvelope {
  version: number;
  savedAt: string;
  state: GameState;
}

/** Cheap structural validation so a corrupt/incompatible save never crashes the app. */
function isValidState(state: unknown): state is GameState {
  if (typeof state !== 'object' || state === null) return false;
  const s = state as Partial<GameState>;
  return (
    typeof s.campaignId === 'string' &&
    typeof s.seed === 'number' &&
    typeof s.week === 'number' &&
    typeof s.maxWeeks === 'number' &&
    typeof s.metrics === 'object' &&
    s.metrics !== null &&
    typeof s.actors === 'object' &&
    s.actors !== null &&
    Array.isArray(s.timeline) &&
    Array.isArray(s.flags) &&
    (s.status === 'setup' || s.status === 'active' || s.status === 'ended')
  );
}

export function saveGame(state: GameState): boolean {
  try {
    const envelope: SaveEnvelope = {
      version: SAVE_VERSION,
      savedAt: new Date().toISOString(),
      state,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(envelope));
    return true;
  } catch {
    return false;
  }
}

/** Fill in fields introduced after a save was written, so v1 saves still load. */
function migrate(state: GameState, version: number): GameState {
  if (version < 2) {
    state.difficulty ??= 'adviser';
    state.pendingActions ??= [];
    state.scheduledEffects ??= [];
    state.lastEventWeek ??= {};
  }
  return state;
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const envelope = JSON.parse(raw) as Partial<SaveEnvelope>;
    if (typeof envelope.version !== 'number' || envelope.version > SAVE_VERSION) return null;
    if (!isValidState(envelope.state)) return null;
    return migrate(envelope.state, envelope.version);
  } catch {
    return null;
  }
}

export function hasSave(): boolean {
  return loadGame() !== null;
}

export function savedAt(): string | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const envelope = JSON.parse(raw) as Partial<SaveEnvelope>;
    return envelope.savedAt ?? null;
  } catch {
    return null;
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // storage unavailable — nothing to clear
  }
}
