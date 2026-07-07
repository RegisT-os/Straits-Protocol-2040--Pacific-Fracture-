import type { TimelineEntry, TimelineEntryType } from '../game/types/gameTypes';

interface Props {
  timeline: TimelineEntry[];
}

const TYPE_STYLE: Record<TimelineEntryType, { label: string; badge: string; border: string }> = {
  player: { label: 'You', badge: 'bg-cyan-950 text-cyan-400', border: 'border-l-cyan-500' },
  ai: { label: 'Actor', badge: 'bg-red-950 text-red-300', border: 'border-l-red-500' },
  event: { label: 'Event', badge: 'bg-amber-950 text-amber-400', border: 'border-l-amber-500' },
  system: { label: 'System', badge: 'bg-slate-800 text-slate-400', border: 'border-l-slate-500' },
  phase: { label: 'Phase', badge: 'bg-indigo-950 text-indigo-300', border: 'border-l-indigo-500' },
  risk: { label: 'Blowback', badge: 'bg-orange-950 text-orange-400', border: 'border-l-orange-500' },
};

export function TimelineFeed({ timeline }: Props) {
  const entries = [...timeline].reverse();

  return (
    <section className="flex min-h-0 flex-col rounded-lg border border-slate-800 bg-slate-900/60">
      <header className="border-b border-slate-800 px-4 py-2.5">
        <h2 className="text-sm font-semibold tracking-wide text-slate-200 uppercase">Timeline</h2>
        <p className="text-xs text-slate-500">Newest first — everything that happened, on record.</p>
      </header>
      <div className="feed-scroll min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {entries.map((entry) => {
          const style = TYPE_STYLE[entry.type];
          return (
            <div
              key={entry.id}
              className={`rounded-md border border-slate-800 border-l-2 bg-slate-900 p-2.5 ${style.border}`}
            >
              <div className="flex items-center gap-2">
                <span className={`rounded px-1.5 py-0.5 font-mono text-[9px] uppercase ${style.badge}`}>
                  {style.label}
                </span>
                <span className="font-mono text-[10px] text-slate-500">W{entry.week}</span>
                <span className="truncate text-xs font-semibold text-slate-200">{entry.title}</span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{entry.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
