import { TIMELINE_FILTERS, type TimelineFilterId } from './timelineFilters';

interface Props {
  filter: TimelineFilterId;
  onChange: (filter: TimelineFilterId) => void;
}

export function TimelineControls({ filter, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-1" data-testid="timeline-controls">
      <span className="mr-1 font-mono text-[9px] tracking-wider text-slate-500 uppercase">
        Filter
      </span>
      {TIMELINE_FILTERS.map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => onChange(f.id)}
          className={`rounded px-2 py-0.5 font-mono text-[10px] transition-colors ${
            filter === f.id
              ? 'bg-cyan-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
