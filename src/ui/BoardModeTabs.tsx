import { BOARD_MODES, type BoardMode } from './boardModes';

interface Props {
  mode: BoardMode;
  onChange: (mode: BoardMode) => void;
  /** Optional per-tab attention badges (e.g. active campaign count). */
  badges?: Partial<Record<BoardMode, number>>;
}

export function BoardModeTabs({ mode, onChange, badges = {} }: Props) {
  return (
    <div className="flex flex-wrap gap-1" data-testid="board-mode-tabs">
      {BOARD_MODES.map((m) => {
        const badge = badges[m.id];
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onChange(m.id)}
            className={`rounded-t-md px-3 py-1.5 text-xs font-semibold tracking-wide uppercase transition-colors ${
              mode === m.id
                ? 'bg-slate-800 text-cyan-300'
                : 'bg-slate-900/50 text-slate-500 hover:bg-slate-800/60 hover:text-slate-300'
            }`}
          >
            {m.label}
            {badge !== undefined && badge > 0 && (
              <span className="ml-1.5 rounded bg-red-950 px-1.5 font-mono text-[9px] text-red-400">
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
