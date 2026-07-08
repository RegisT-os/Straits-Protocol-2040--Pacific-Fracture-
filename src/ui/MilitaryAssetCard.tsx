import type { MilitaryAssetState, MilitaryStatus } from '../game/types/gameTypes';
import { getTheatre } from '../game/data/mapNodes';
import { MilitaryAssetSilhouette } from './MilitaryAssetSilhouette';

interface Props {
  asset: MilitaryAssetState;
  week: number;
  selected: boolean;
  onSelect: () => void;
}

const STATUS_STYLE: Record<MilitaryStatus, { label: string; chip: string; border: string }> = {
  ready: { label: 'Ready', chip: 'bg-emerald-950 text-emerald-400', border: 'border-slate-800' },
  'on-mission': { label: 'On mission', chip: 'bg-cyan-950 text-cyan-300', border: 'border-cyan-800' },
  refitting: { label: 'Refitting', chip: 'bg-amber-950 text-amber-400', border: 'border-slate-800' },
  strained: { label: 'Strained', chip: 'bg-red-950 text-red-400', border: 'border-red-900' },
};

function Gauge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between font-mono text-[9px] text-slate-500">
        <span className="uppercase">{label}</span>
        <span>{Math.round(value)}</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-slate-800">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function MilitaryAssetCard({ asset, week, selected, onSelect }: Props) {
  const status = STATUS_STYLE[asset.status];
  const eta =
    asset.operationEndsWeek !== undefined ? Math.max(0, asset.operationEndsWeek - week) : null;

  return (
    <button
      type="button"
      onClick={onSelect}
      title={asset.showcaseText}
      className={`w-full rounded-md border bg-slate-900 p-3 text-left transition-colors ${
        selected ? 'border-cyan-500 ring-1 ring-cyan-500' : `${status.border} hover:border-slate-600`
      }`}
    >
      <MilitaryAssetSilhouette
        type={asset.type}
        className={asset.status === 'strained' ? 'text-red-400/80' : 'text-cyan-400/90'}
      />
      <div className="mt-2 flex items-start justify-between gap-2">
        <span className="text-sm font-semibold text-slate-100">{asset.name}</span>
        <span className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[9px] uppercase ${status.chip}`}>
          {status.label}
        </span>
      </div>
      <p className="mt-0.5 font-mono text-[10px] text-slate-500 uppercase">
        {asset.type.replace(/-/g, ' ')} · {getTheatre(asset.theatre).name}
      </p>
      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
        <Gauge label="Readiness" value={asset.readiness} color="bg-emerald-500" />
        <Gauge label="Strength" value={asset.strength} color="bg-cyan-500" />
        <Gauge label="Logistics" value={asset.logistics} color="bg-amber-500" />
        <Gauge label="Exposure" value={asset.exposure} color="bg-red-500" />
      </div>
      <p className="mt-2 truncate text-[11px] text-slate-400">
        <span className="font-mono text-[9px] text-slate-600 uppercase">Mission · </span>
        {asset.mission}
        {eta !== null && (
          <span className="ml-1 font-mono text-[10px] text-cyan-400">
            (~{eta} wk{eta === 1 ? '' : 's'} left)
          </span>
        )}
      </p>
    </button>
  );
}
