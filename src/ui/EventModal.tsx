import type { EventDef } from '../game/types/gameTypes';
import { deltaChips } from './format';

interface Props {
  event: EventDef;
  onChoose: (choiceId: string) => void;
}

/** Blocking modal for interactive events — the week cannot advance until resolved. */
export function EventModal({ event, onChoose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-lg border border-amber-700/60 bg-slate-900 shadow-2xl shadow-amber-950/40">
        <header className="border-b border-slate-800 px-5 py-3">
          <p className="font-mono text-[10px] tracking-widest text-amber-500 uppercase">
            Decision required
          </p>
          <h2 className="mt-0.5 text-lg font-bold text-slate-100">{event.title}</h2>
        </header>
        <div className="px-5 py-4">
          <p className="text-sm leading-relaxed text-slate-300">{event.description}</p>
          <div className="mt-4 space-y-2">
            {(event.choices ?? []).map((choice) => {
              const chips = deltaChips(choice.metricEffects);
              return (
                <button
                  key={choice.id}
                  type="button"
                  onClick={() => onChoose(choice.id)}
                  className="w-full rounded-md border border-slate-700 bg-slate-800/60 p-3 text-left transition-colors hover:border-amber-500 hover:bg-slate-800"
                >
                  <span className="text-sm font-semibold text-slate-100">{choice.label}</span>
                  <p className="mt-1 text-xs text-slate-400">{choice.description}</p>
                  {chips.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {chips.map((chip) => (
                        <span
                          key={chip.key}
                          className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                            chip.positive
                              ? 'bg-emerald-950 text-emerald-400'
                              : 'bg-red-950 text-red-400'
                          }`}
                        >
                          {chip.short} {chip.value > 0 ? '+' : ''}
                          {chip.value}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
